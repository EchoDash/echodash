<?php

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

/**
 * Base class for handling the event tracking plugin integrations.
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
	 * @var  array $global_options
	 */
	public $global_option_types = array();

	/**
	 * Constructs a new instance.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {

		// Make it globally available.

		if ( ! echodash()->integrations ) {
			echodash()->integrations = new stdClass();
		}

		echodash()->integrations->{ $this->slug } = $this;

		if ( is_admin() ) {
			$this->admin_actions();
		}

		// Add the hooks in each integration.

		$this->init();

		// So any global / shared options can be properly loaded.

		add_action( 'echodash_integrations_loaded', array( $this, 'initialize_triggers' ) );
		add_action( 'echodash_integrations_loaded', array( $this, 'admin_actions' ) );
	}

	/**
	 * Gets things started.
	 *
	 * @access protected
	 *
	 * @since  1.0.0
	 */
	abstract protected function init();

	/**
	 * Defines the available triggers and their properties.
	 *
	 * @access protected
	 *
	 * @since  1.0.0
	 *
	 * @return array The triggers.
	 */
	abstract protected function setup_triggers();

	/**
	 * Gets the array of triggers and sets their defaults, then loads the
	 * available options for each trigger type based on the option types
	 * configured for the trigger.
	 *
	 * @access private
	 *
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

			$this->triggers[ $trigger ]['option_types'] = array_merge( $this->triggers[ $trigger ]['option_types'], $this->get_global_option_types() ); // add in the global option types.
			// $this->triggers[ $trigger ]['options']      = $this->get_options( $trigger ); // fill in the options and their defaults. (don't think we need it).

		}
	}

	/**
	 * Adds admin-only hooks.
	 *
	 * @since 1.0.0
	 */
	public function admin_actions() {

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
	 * Return the available triggers for the integration.
	 *
	 * @since  1.0.0
	 *
	 * @return array The triggers.
	 */
	public function get_triggers() {

		return $this->triggers;
	}

	/**
	 * Helper function for rendering the event tracking fields.
	 *
	 * @since  1.0.0
	 *
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
	 * Gets the options for the event editor, and pre-fills the previews based
	 * on the current post, if available.
	 *
	 * @since  1.0.0
	 *
	 * @param  string $trigger The trigger.
	 * @param  bool   $post_id The post ID.
	 * @return array  The options.
	 */
	public function get_options( $trigger, $post_id = false ) {

		$options    = array();
		$used_types = array(); // If two integrations use the same type, we don't want to duplicate them in the dropdown.

		// Options from this integration.

		foreach ( $this->triggers[ $trigger ]['option_types'] as $option_type ) {

			// Get the options.

			$option = apply_filters( "get_{$option_type}_options", array(), $post_id );

			// Maybe fill in previews.

			if ( ! empty( $post_id ) && has_filter( "get_{$option_type}_vars" ) ) { // We used to check if get_post_type( $post_id ) === $option_type ) here but not sure it's necessary.

				// This is apply_filters since some integrations like EDDSL need to
				// get variables from other integration classes (i.e. the
				// get_download_vars method in the main EDD class).

				$values = apply_filters( "get_{$option_type}_vars", $post_id ); // TODO kinda ugly to filter an ID and expect an array in return....

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
	 * Gets the global option types from other integrations that need to be
	 * included in this one.
	 *
	 * @since  1.1.1
	 *
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
	 * Gets the post types that can be configured with events for this integration.
	 *
	 * @since  1.2.0
	 *
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
	 * Helper for replacing the placeholders in value field.
	 *
	 * @since 1.4.2
	 * @param string $value
	 * @param string $search
	 * @param string $replace
	 * @return string
	 */
	private function replace_value( $value, $search, $replace ) {
		if ( is_array( $value ) ) {
			foreach ( $value as $event_key => $event_val ) {
				$value[ $event_key ]['value'] = trim( str_replace( $search, strval( $replace ), $event_val['value'] ) );
			}
		} else {
			$value = trim( str_replace( $search, strval( $replace ), $value ) );
		}

		return $value;
	}

	/**
	 * Helper for checking if placeholder exist in value.
	 *
	 * @since 1.4.2
	 * @param string $value
	 * @param string $search
	 * @return boolean
	 */
	private function placeholder_in_value( $value, $search ) {
		$exist = false;
		if ( is_array( $value ) ) {
			foreach ( $value as $event_value ) {
				if ( false !== strpos( $event_value['value'], $search ) ) {
					$exist = true;
				}
			}
		} elseif ( false !== strpos( $value, $search ) ) {
				$exist = true;
		}

		return $exist;
	}



	/**
	 * Helper for replacing the placeholders with values.
	 *
	 * @since  1.0.0
	 *
	 * @param  array $event  The event as saved in the database.
	 * @param  array $args   The key value replacement pairs from the integration.
	 * @return array The filtered event.
	 */
	public function replace_tags( $event, $args ) {

		$defaults = array(
			'name'  => '',
			'value' => array(),
		);

		$event = wp_parse_args( $event, $defaults );

		foreach ( $args as $type => $values ) {
			foreach ( $values as $id => $value ) {

				if ( ! is_scalar( $value ) ) {
					continue;
				}

				$search         = '{' . $type . ':' . $id . '}';
				$event['name']  = trim( str_replace( $search, $value, $event['name'] ) );
				$event['value'] = $this->replace_value( $event['value'], $search, $value );
			}
		}

		$event = apply_filters( 'echodash_replace_tags', $event, $args );

		return $event;
	}

	/**
	 * Replace the global tags from other integrations.
	 *
	 * @since  1.1.0
	 *
	 * @param  array $event  The event.
	 * @return array The event.
	 */
	public function replace_global_tags( $event ) {

		// Now replace the global tags, if there are any.

		foreach ( echodash()->integrations as $integration ) {

			foreach ( $integration->global_option_types as $option_type ) {

				if ( false !== strpos( $event['name'], '{' . $option_type . ':' ) || $this->placeholder_in_value( $event['value'], '{' . $option_type . ':' ) ) {
					$args  = call_user_func( array( $integration, "get_{$option_type}_vars" ) );
					$event = $this->replace_tags( $event, $args );

				}
			}
		}

		return $event;
	}

	/**
	 * Remove events if it has no name in their value.
	 *
	 * @since 1.5.0
	 *
	 * @param array $events The events.
	 * @return array The filtered events.
	 */
	private function filter_events( $events ) {
		if ( empty( $events ) ) {
			return array();
		}
		foreach ( $events as $key => $event ) {
			if ( empty( $event['name'] ) ) {
				unset( $events[ $key ] );
			}
		}

		return array_filter( $events );
	}


	/**
	 * Gets all events bound to a particular trigger.
	 *
	 * @since  1.0.0
	 *
	 * @param  string   $trigger The trigger.
	 * @param  int|bool $post_id The post ID.
	 * @return array    The events.
	 */
	public function get_events( $trigger, $post_id = false ) {

		$events = array();

		if ( false === $post_id && $this->triggers[ $trigger ]['has_single'] ) {

			// Get all the single events for a trigger. Used when loading the global options.

			$events = $this->get_single_events( $trigger );

		} elseif ( false !== $post_id && $this->triggers[ $trigger ]['has_single'] ) {

			// Get the events just for a specific post. Used in the admin when editing a post and when triggering an event.

			$settings = $this->get_settings( $post_id );

			if ( false !== $settings[ $trigger ] ) {
				$events[] = $settings[ $trigger ];
			}
		}

		// If the post has no events, check for global events.
		if ( false === $post_id || empty( $events ) ) {

			$global_events = $this->get_global_events( $trigger );
			$events        = array_merge( $events, $global_events );

		}

		return $this->filter_events( $events );
	}

	/**
	 * Get all the post-specific events for a trigger. Used when loading the
	 * global options.
	 *
	 * @since  1.1.0
	 *
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
	 *
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
	 * Log an event.
	 *
	 * @since 1.2.0
	 *
	 * @param array $event The event.
	 */
	public function log_event( $event, $email_address = '' ) {

		$message = esc_html__( 'Tracking event', 'echodash' );

		// Try to find the user / contact ID to log.

		if ( ecd_is_user_logged_in() ) {
			$contact_id = ecd_get_contact_id();
			$user_id    = get_current_user_id();
		} else {

			// Try to get the CID by user.
			$user = get_user_by( 'email', $email_address );

			if ( $user ) {
				$contact_id = ecd_get_contact_id( $user->ID );
				$user_id    = $user->ID;
			} else {
				$user_id = 0;
			}
		}

		if ( ! empty( $contact_id ) ) {
			// translators: Contact ID.
			$message .= sprintf( esc_html__( ' for contact #%s', 'echodash' ), $contact_id );
		}

		// translators: Event Name.
		$message .= ':<ul><li><strong>' . sprintf( esc_html__( 'name: %s', 'echodash' ), '</strong>' . esc_html( $event['name'] ) ) . '</li>';

		if ( ! empty( $event['value'] ) ) {
			// translators: Event Value.
			if ( is_array( $event['value'] ) ) {
				foreach ( $event['value'] as $event_value ) {
					$message .= '<li><code>' . esc_html( $event_value['key'] ) . '</code>: ' . esc_html( $event_value['value'] ) . '</li>';
				}
			} else {
				$message .= '<li><strong>' . sprintf( esc_html__( 'value: %s', 'echodash' ), '</strong>' . esc_html( $event['value'] ) ) . '</li>';
			}
		}

		$message .= '</ul>';

		ecd_log(
			'info',
			$user_id,
			$message,
			array(
				'source' => array(
					'echodash',
					$this->slug,
				),
			)
		);
	}

	/**
	 * Is called by the integrations to track an event.
	 *
	 * @since 1.0.0
	 *
	 * @param array  $event         The event.
	 * @param string $email_address The email address.
	 */
	public function track_event( $event, $email_address = '' ) {

		if ( empty( $email_address ) ) {
			$user          = wp_get_current_user();
			$email_address = $user->user_email;
		}

		// Replace the global tags as well.

		$event = $this->replace_global_tags( $event );

		$event = apply_filters( 'echodash_track_event', $event, $email_address, $this->slug );

		if ( empty( $event ) ) {
			return; // allows canceling the event.
		}

		// Build up the log message.

		// if ( ecd_get_option( 'events_logging', true ) ) {
		//  $this->log_event( $event, $email_address );
		// }

		echodash()->track_event( $event['name'], $event['value'], $email_address, $this->name );
	}

	/**
	 * Helper for getting the echodash_settings value off a post and
	 * setting the defaults.
	 *
	 * @since  1.0.0
	 *
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

		return apply_filters( 'ecd_get_event_tracking_settings', $settings, $post_id );
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
				array(
					$this,
					'meta_box_callback',
				),
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
	 *
	 * @param WP_Post $post   The post.
	 */
	public function meta_box_callback( $post ) {

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
	 * If an integraton has settings on an individual post, this handles
	 * sanitizing and saving them.
	 *
	 * @since 1.0.0
	 *
	 * @param int $post_id The post ID.
	 */
	public function save_post( $post_id ) {

		$data = ! empty( $_POST['echodash_settings'] ) ? wp_unslash( $_POST['echodash_settings'] ) : array();
		$data = array_filter( $data ); // Sanitize and remove empty values.

		foreach ( $data as $id => $event ) {
			if ( empty( $event['name'] ) && empty( $event['value'] ) || ( is_array( $event['value'] ) && empty( $event['value'][0]['key'] ) ) ) {
				unset( $data[ $id ] );
			}
		}

		if ( ! empty( $data ) ) {
			update_post_meta( $post_id, 'echodash_settings', $data );
		} else {
			delete_post_meta( $post_id, 'echodash_settings' );
		}
	}
}
