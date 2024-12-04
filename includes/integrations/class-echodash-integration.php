<?php

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

/**
 * Base class for EchoDash integrations.
 *
 * This class provides the foundation for integrating various plugins with EchoDash.
 * Each integration should extend this class and implement the required abstract methods.
 *
 * @since 1.0.0
 */
abstract class EchoDash_Integration {

	/**
	 * The slug name for EchoDash's module tracking.
	 *
	 * @since 1.0.0
	 * @var string $slug
	 */
	public $slug;

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 1.0.0
	 * @var string $name
	 */
	public $name;

	/**
	 * Stores the triggers for the integration.
	 *
	 * @since 1.0.0
	 * @var array $triggers
	 */
	private $triggers = array();

	/**
	 * Stores any global options which are shared across integrations.
	 *
	 * @since 1.1.0
	 * @var array $global_options
	 */
	public $global_option_types = array();

	/**
	 * Constructs a new instance.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {

		echodash()->integrations->{ $this->slug } = $this;

		// Add the hooks in each integration.
		$this->init();

		// So any global / shared options can be properly loaded.
		add_filter( 'echodash_event_data', array( $this, 'get_event_data' ), 10, 2 );

		// Allows other integrations to include relevant objects for the event, such as the current user.
		add_filter( 'echodash_event_objects', array( $this, 'event_objects' ), 10, 2 );

		// So any global / shared options can be properly loaded.
		add_action( 'echodash_integrations_loaded', array( $this, 'initialize_triggers' ) );
		add_action( 'echodash_integrations_loaded', array( $this, 'register_meta_boxes' ) );
	}

	/**
	 * Gets things started.
	 *
	 * @access protected
	 * @since  1.0.0
	 */
	abstract protected function init();

	/**
	 * Defines the available triggers and their properties.
	 *
	 * @access protected
	 * @since  1.0.0
	 * @return array The triggers.
	 */
	abstract protected function setup_triggers();

	/**
	 * Allows other integrations to include relevant objects for the event, such as the current user.
	 *
	 * @since 1.0.0
	 * @param array  $objects The objects.
	 * @param string $trigger The trigger.
	 * @return array The objects.
	 */
	public function event_objects( $objects, $trigger ) {
		return $objects;
	}

	/**
	 * Return the available triggers for the integration.
	 *
	 * @since  1.0.0
	 * @return array The triggers.
	 */
	public function get_triggers() {
		return apply_filters( "echodash_{$this->slug}_triggers", $this->triggers );
	}

	/**
	 * Gets a trigger.
	 *
	 * @since 1.0.0
	 * @param string $trigger The trigger.
	 * @return array The trigger.
	 */
	public function get_trigger( $trigger ) {
		return $this->triggers[ $trigger ];
	}

	/**
	 * Gets the trigger name.
	 *
	 * @since 1.0.0
	 * @param string $trigger The trigger.
	 * @return string The trigger name.
	 */
	public function get_trigger_name( $trigger ) {
		$trigger_name = isset( $this->triggers[ $trigger ]['name'] ) ? $this->triggers[ $trigger ]['name'] : $trigger;
		return apply_filters( 'echodash_trigger_name', $trigger_name, $trigger );
	}

	/**
	 * Gets the relevant object ID for single events from the objects array.
	 *
	 * @since 1.0.0
	 * @param string $trigger The trigger.
	 * @param array  $objects The objects array.
	 * @return int|bool The object ID or false if not applicable.
	 */
	private function get_object_id_for_trigger( $trigger, $objects ) {

		// Check if this trigger supports single events
		if ( empty( $this->triggers[ $trigger ]['has_single'] ) ) {
			return false;
		}

		if ( empty( $objects ) ) {
			return false;
		}

		// Get first key/value pair
		reset( $objects );
		$object_type = key( $objects );
		$object_id   = current( $objects );

		// Verify this object type is valid for this trigger.
		if ( ! in_array( $object_type, $this->triggers[ $trigger ]['option_types'], true ) ) {
			return false;
		}

		return $object_id;
	}

	/**
	 * Gets the event data from the get_{$object_type}_vars method in each integration.
	 *
	 * @since 1.0.0
	 * @param array $objects The objects.
	 * @return array The event data.
	 */
	public function get_event_data( $event_data = array(), $objects = array() ) {

		foreach ( $objects as $object_type => $object_id ) {
			if ( method_exists( $this, "get_{$object_type}_vars" ) ) {
				$event_data = array_merge( $event_data, $this->{"get_{$object_type}_vars"}( $object_id ) );
			}
		}

		return $event_data;
	}

	/**
	 * Tracks an event.
	 *
	 * @since 1.0.0
	 * @param string $trigger The trigger.
	 * @param array  $objects The objects.
	 * @param array  $args    The event arguments.
	 */
	public function track_event( $trigger, $objects = array(), $args = array() ) {

		$objects = apply_filters( 'echodash_event_objects', $objects, $trigger );

		// Get object ID if applicable
		$object_id = $this->get_object_id_for_trigger( $trigger, $objects );

		// Get events configured for this trigger
		$events = $this->get_events( $trigger, $object_id );

		// Get merge variables
		$event_data = apply_filters( 'echodash_event_data', array(), $objects );

		// Merge in any custom arguments passed from the trigger
		foreach ( $args as $object_type => $values ) {
			if ( isset( $event_data[ $object_type ] ) ) {
				$event_data[ $object_type ] = array_merge( $event_data[ $object_type ], $values );
			}
		}

		// Process each event
		foreach ( $events as $event ) {

			// Format the values from settings storage into key-value pairs.
			$event['value'] = wp_list_pluck( $event['value'], 'value', 'key' );

			// Replace merge tags in event data
			$event['value'] = $this->replace_tags( $event['value'], $event_data );

			// Track via public class
			echodash()->public->track_event(
				$event['name'],
				$event['value'],
				$this->name,
				$this->get_trigger_name( $trigger )
			);
		}
	}

	/**
	 * Helper for replacing the placeholders with values.
	 *
	 * @since  1.0.0
	 * @param array $event_values The event values.
	 * @param array $event_data   The event data.
	 * @return array The filtered event values.
	 */
	public function replace_tags( $event_values, $event_data ) {

		foreach ( $event_values as $key => $event_value ) {

			// At this point we have the user's configured mapping, like "first_name" => "{user:first_name}"

			foreach ( $event_data as $object_type => $object_values ) {

				// Object type is, for example, "user", or "order".

				foreach ( $object_values as $object_key => $object_value ) {

					// Object key is, for example, "first_name", object value is, for example, "John".

					$search = '{' . $object_type . ':' . $object_key . '}';

					if ( is_scalar( $object_value ) ) {

						// Now we replace the placeholder text, like {user:first_name} with the actual value.
						$event_values[ $key ] = str_replace( $search, $object_value, $event_values[ $key ] );

					} elseif ( is_array( $object_value ) && false !== strpos( $event_value, $search ) ) {

						unset( $event_values[ $key ] );

						foreach ( $object_value as $object_value_key => $object_value_value ) {
							$event_values[ $key . '_' . $object_value_key ] = $object_value_value;
						}
					}
				}
			}
		}

		$event_values = array_filter( $event_values ); // Remove any empty values.

		$event_values = apply_filters( 'echodash_replace_tags', $event_values, $event_data );

		return $event_values;
	}

	/**
	 * Gets all events bound to a particular trigger.
	 *
	 * @since  1.0.0
	 * @param  string   $trigger The trigger.
	 * @param  int|bool $post_id The post ID.
	 * @return array    The events.
	 */
	public function get_events( $trigger, $post_id = false ) {

		$events = array();

		if ( false !== $post_id ) {

			// Get the events just for a specific post. Used in the admin when editing a post and when triggering an event.
			$settings = $this->get_settings( $post_id );

			if ( false !== $settings[ $trigger ] ) {
				$events[] = $settings[ $trigger ];
			}
		} elseif ( false === $post_id && $this->triggers[ $trigger ]['has_single'] ) {
			// Get all the single events for a trigger. Used when loading the global options.
			$events = $this->get_single_events( $trigger );
		}

		// If the post has no events, check for global events.
		if ( false === $post_id || empty( $events ) ) {
			$global_events = $this->get_global_events( $trigger );
			$events        = array_merge( $events, $global_events );
		}

		return $events;
	}

	/**
	 * Get all the post-specific events for a trigger. Used when loading the
	 * global options.
	 *
	 * @since  1.1.0
	 * @param  string $trigger The trigger.
	 * @return array  The events.
	 */
	public function get_single_events( $trigger ) {
		$events = array();

		if ( $this->triggers[ $trigger ]['has_single'] ) {

			// Settings saved on individual posts.
			$args = array(
				'numberposts' => 100, // safe limit.
				'post_type'   => $this->triggers[ $trigger ]['post_types'],
				'fields'      => 'ids',
				'meta_query'  => array(
					array(
						'key'     => 'echodash_settings',
						'compare' => 'EXISTS',
					),
				),
			);

			$posts = get_posts( $args );

			if ( ! empty( $posts ) ) {
				foreach ( $posts as $result_post_id ) {
					$settings = get_post_meta( $result_post_id, 'echodash_settings', true );

					if ( ! empty( $settings ) ) {
						// Clean up settings that might be saved on the same post, but from other integrations / triggers.
						foreach ( $settings as $trigger_id => $setting ) {
							if ( $trigger_id !== $trigger ) {
								unset( $settings[ $trigger_id ] );
							}
						}
					}

					if ( ! empty( $settings ) ) {
						// Build up events array.
						$event = array(
							'trigger' => $trigger,
							'post_id' => $result_post_id,
						);

						$event    = array_merge( $event, $settings[ $trigger ] );
						$events[] = $event;
					}
				}
			}
		}

		return $events;
	}

	/**
	 * Get all the global events for a trigger. Used when loading the global
	 * options and sending global events.
	 *
	 * @since 1.1.0
	 * @param string $trigger The trigger.
	 * @return array The events.
	 */
	public function get_global_events( $trigger ) {
		$events = array();

		if ( $this->triggers[ $trigger ]['has_global'] ) {
			// Global settings.
			$settings = get_option( 'echodash_options', array() );

			if ( ! empty( $settings[ $this->slug ] ) ) {
				foreach ( $settings[ $this->slug ] as $event ) {
					if ( $event['trigger'] === $trigger ) {
						// If we're getting it for a single post we don't need to keep them separate.
						$events[] = $event;
					}
				}
			}
		}

		return $events;
	}

	/**
	 * Helper for getting the echodash_settings value off a post and
	 * setting the defaults.
	 *
	 * @since  1.0.0
	 * @param  int $post_id    The post ID.
	 * @return array The settings.
	 */
	public function get_settings( $post_id ) {
		$defaults = array();

		foreach ( $this->triggers as $id => $trigger ) {
			if ( $trigger['has_single'] ) {
				$defaults[ $id ] = false;
			}
		}

		$settings = get_post_meta( $post_id, 'echodash_settings', true );
		$settings = wp_parse_args( $settings, $defaults );

		return apply_filters( 'echodash_get_post_settings', $settings, $post_id );
	}

	/**
	 * Gets the options for the event editor, and pre-fills the previews based
	 * on the current post, if available.
	 *
	 * @since  1.0.0
	 * @param  string $trigger The trigger.
	 * @param  int    $post_id The post ID.
	 * @return array  The options.
	 */
	public function get_options( $trigger, $post_id = 0 ) {
		$options    = array();
		$used_types = array(); // If two integrations use the same type, we don't want to duplicate them in the dropdown.

		// Options from this integration.
		foreach ( $this->triggers[ $trigger ]['option_types'] as $option_type ) {
			// Get the options.
			$option = apply_filters( "get_{$option_type}_options", array(), $post_id );

			// Maybe fill in previews.
			if ( ! empty( $post_id ) && has_filter( "get_{$option_type}_vars" ) ) {
				$values = apply_filters( "get_{$option_type}_vars", $post_id );

				foreach ( $option['options'] as $i => $sub_option ) {
					if ( ! empty( $values[ $option['type'] ][ $sub_option['meta'] ] ) ) {
						$option['options'][ $i ]['preview'] = $values[ $option['type'] ][ $sub_option['meta'] ];
					}
				}
			}

			$used_types[] = $option_type;
			$options[]    = $option;
		}

		return $options;
	}

	/**
	 * Gets the default configuration for a trigger.
	 *
	 * @since 1.2.0
	 * @param string $trigger The trigger ID.
	 * @return array|false The default configuration or false if none exists.
	 */
	public function get_defaults( $trigger ) {
		$triggers = $this->get_triggers();

		if ( ! isset( $triggers[ $trigger ] ) || empty( $triggers[ $trigger ]['default_event'] ) ) {
			return false;
		}

		return apply_filters(
			'echodash_default_event_mappings',
			$triggers[ $trigger ]['default_event'],
			$trigger,
			$this->slug
		);
	}

	/**
	 * Gets the global option types from other integrations that need to be
	 * included in this one.
	 *
	 * @since  1.1.1
	 * @return array The global option types.
	 */
	public function get_global_option_types() {
		$global_option_types = array();

		foreach ( echodash()->integrations as $integration ) {
			if ( $integration === $this ) {
				continue;
			}

			$global_option_types = array_merge( $global_option_types, $integration->global_option_types );
		}

		return $global_option_types;
	}

	/**
	 * Gets the array of triggers and sets their defaults, then loads the
	 * available options for each trigger type based on the option types
	 * configured for the trigger.
	 *
	 * @access private
	 * @since  1.0.0
	 */
	public function initialize_triggers() {
		$defaults = array(
			'name'         => false,
			'description'  => false,
			'post_types'   => array(),
			'has_single'   => false,
			'has_global'   => false,
			'option_types' => array(),
			'options'      => array(), // options specific to when this trigger is running.
		);

		foreach ( $this->setup_triggers() as $trigger => $data ) {
			$this->triggers[ $trigger ] = wp_parse_args( $data, $defaults );

			foreach ( $this->triggers[ $trigger ]['option_types'] as $option_type ) {
				// Add the filter for getting the available options.
				if ( ! has_filter( "get_{$option_type}_options" ) && method_exists( $this, "get_{$option_type}_options" ) ) {
					add_filter( "get_{$option_type}_options", array( $this, "get_{$option_type}_options" ), 10, 2 );
				}

				// Add the filter for filling the options with the real variables.
				if ( method_exists( $this, "get_{$option_type}_vars" ) ) {
					add_filter( "get_{$option_type}_vars", array( $this, "get_{$option_type}_vars" ), 10, 2 );
				}
			}

			$this->triggers[ $trigger ]['option_types'] = array_merge( $this->triggers[ $trigger ]['option_types'], $this->get_global_option_types() );
		}
	}

	/**
	 * Adds admin-only hooks.
	 *
	 * @since 1.0.0
	 */
	public function register_meta_boxes() {
		foreach ( $this->triggers as $trigger ) {
			if ( $trigger['has_single'] && ! empty( $trigger['post_types'] ) ) {
				if ( ! has_action( 'add_meta_boxes', array( $this, 'add_meta_boxes' ) ) ) {
					add_action( 'add_meta_boxes', array( $this, 'add_meta_boxes' ) );
				}

				foreach ( $trigger['post_types'] as $post_type ) {
					if ( ! has_action( "save_post_{$post_type}", array( $this, 'save_post' ) ) ) {
						add_action( "save_post_{$post_type}", array( $this, 'save_post' ) );
					}
				}
			}
		}
	}

	/**
	 * Gets the post types that can be configured with events for this integration.
	 *
	 * @since  1.2.0
	 * @return array The post types.
	 */
	public function get_post_types() {
		$post_types = array();

		foreach ( $this->triggers as $trigger ) {
			$post_types = array_merge( $post_types, $trigger['post_types'] );
		}

		return $post_types;
	}

	/**
	 * Registers meta box.
	 *
	 * @since  1.2.0
	 */
	public function add_meta_boxes() {
		foreach ( $this->get_post_types() as $post_type ) {
			add_meta_box(
				'echodash',
				__( 'EchoDash - Event Tracking', 'echodash' ),
				array( $this, 'meta_box_callback' ),
				$post_type,
				'normal',
				'default'
			);
		}
	}

	/**
	 * Displays the meta box content.
	 *
	 * Show the event tracking fields based on the triggers configured for the
	 * post type.
	 *
	 * @since 1.2.0
	 * @param WP_Post $post The post.
	 */
	public function meta_box_callback( $post ) {
		// Add nonce field
		wp_nonce_field( 'echodash_save_settings', 'echodash_nonce' );

		echo '<table class="form-table echodash"><tbody>';

		foreach ( $this->get_triggers() as $id => $trigger ) {
			if ( in_array( $post->post_type, $trigger['post_types'], true ) ) {
				echo '<tr>';
				echo '<th scope="row">';
				echo '<label for="' . esc_attr( $id ) . '">' . esc_html( $trigger['name'] ) . ':</label>';
				echo '<span class="description">' . esc_html( $trigger['description'] ) . '</span>';
				echo '</th>';
				echo '<td>';
				$this->render_event_tracking_fields( $id, $post->ID );
				echo '</td>';
				echo '</tr>';
				echo '<tr>';
			}
		}

		echo '</table>';

		do_action( "echodash_{$this->slug}_meta_box", $post );
	}

	/**
	 * Helper function for rendering the event tracking fields.
	 *
	 * @since  1.0.0
	 * @param  string $trigger The trigger.
	 * @param  int    $post_id The post ID.
	 * @param  array  $args    The arguments.
	 * @return mixed  The event tracking input fields.
	 */
	public function render_event_tracking_fields( $trigger, $post_id, $args = array() ) {
		$settings = $this->get_settings( $post_id );

		$defaults = array(
			'setting'     => $settings[ $trigger ],
			'field_id'    => $trigger,
			'integration' => $this->slug,
			'trigger'     => $trigger,
			'return'      => false,
		);

		$args = wp_parse_args( $args, $defaults );

		// If we're returning instead of echoing.
		if ( true === $args['return'] ) {
			ob_start();
		}

		ecd_render_event_tracking_fields( $args );

		// Localize the script data.
		echodash()->admin->localize( $this->slug, $trigger, $this->get_options( $trigger, $post_id ) );

		if ( true === $args['return'] ) {
			return ob_get_clean();
		}
	}

	/**
	 * If an integraton has settings on an individual post, this handles
	 * sanitizing and saving them.
	 *
	 * @since 1.0.0
	 * @param int $post_id The post ID.
	 */
	public function save_post( $post_id ) {
		if ( ! isset( $_POST['echodash_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['echodash_nonce'] ), 'echodash_save_settings' ) ) {
			return;
		}

		$data = ! empty( $_POST['echodash_settings'] ) ? ecd_clean( wp_unslash( $_POST['echodash_settings'] ) ) : array();

		if ( ! empty( $data ) ) {
			update_post_meta( $post_id, 'echodash_settings', $data );
		} else {
			delete_post_meta( $post_id, 'echodash_settings' );
		}
	}
}
