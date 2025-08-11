<?php
/**
 * WP Fusion integration.
 *
 * @package EchoDash
 * @since x.x.x
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * WP Fusion integration class.
 *
 * @since x.x.x
 */
class EchoDash_WP_Fusion extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since x.x.x
	 * @var string $slug
	 */
	public $slug = 'wp-fusion';

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since x.x.x
	 * @var string $name
	 */
	public $name = 'WP Fusion';

	/**
	 * The background color for the integration icon.
	 *
	 * @since x.x.x
	 * @var string $icon_background_color
	 */
	protected $icon_background_color = '#E55B10';

	/**
	 * Get things started.
	 *
	 * @since x.x.x
	 */
	public function init() {

		// Contact API events (outgoing to CRM).
		add_action( 'wpf_api_did_add_contact', array( $this, 'contact_added' ), 10, 3 );
		add_action( 'wpf_api_did_update_contact', array( $this, 'contact_updated' ), 10, 3 );

		// Tag events.
		add_action( 'wpf_tags_applied', array( $this, 'tags_applied' ), 10, 2 );
		add_action( 'wpf_tags_removed', array( $this, 'tags_removed' ), 10, 2 );

		// Logging events.
		add_action( 'wpf_handle_log', array( $this, 'handle_log' ), 10, 5 );
		add_action( 'wpf_handle_log_error', array( $this, 'handle_log_error' ), 10, 4 );
	}

	/**
	 * Gets the triggers for the integration.
	 *
	 * @access protected
	 *
	 * @since  x.x.x
	 *
	 * @return array The triggers.
	 */
	protected function setup_triggers() {

		$triggers = array(
			'contact_added'     => array(
				'name'               => __( 'Contact Added', 'echodash' ),
				'description'        => __( 'Triggered when a new contact is added to the CRM via WP Fusion.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'contact' ),
				'enabled_by_default' => false,
				'default_event'      => array(
					'name'     => __( 'Contact Created', 'echodash' ),
					'mappings' => array(
						'contact_id' => '{contact:contact_id}',
						'email'      => '{contact:email}',
						'first_name' => '{contact:first_name}',
						'last_name'  => '{contact:last_name}',
						'user_id'    => '{contact:user_id}',
					),
				),
			),
			'contact_updated'   => array(
				'name'               => __( 'Contact Updated', 'echodash' ),
				'description'        => __( 'Triggered when a contact is updated in the CRM via WP Fusion.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'contact' ),
				'enabled_by_default' => false,
				'default_event'      => array(
					'name'     => __( 'Contact Updated', 'echodash' ),
					'mappings' => array(
						'contact_id' => '{contact:contact_id}',
						'email'      => '{contact:email}',
						'first_name' => '{contact:first_name}',
						'last_name'  => '{contact:last_name}',
						'user_id'    => '{contact:user_id}',
					),
				),
			),
			'tags_applied'      => array(
				'name'               => __( 'Tags Applied', 'echodash' ),
				'description'        => __( 'Triggered when tags are applied to a user in WP Fusion.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'user', 'contact' ),
				'enabled_by_default' => false,
				'default_event'      => array(
					'name'     => __( 'Tags Applied', 'echodash' ),
					'mappings' => array(
						'user_email'   => '{user:user_email}',
						'tags_applied' => '{contact:tags_applied}',
					),
				),
			),
			'tags_removed'      => array(
				'name'               => __( 'Tags Removed', 'echodash' ),
				'description'        => __( 'Triggered when tags are removed from a user in WP Fusion.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'user', 'contact' ),
				'enabled_by_default' => false,
				'default_event'      => array(
					'name'     => __( 'Tags Removed', 'echodash' ),
					'mappings' => array(
						'user_email'    => '{user:user_email}',
						'tags_removed'  => '{contact:tags_removed}',
					),
				),
			),
			'enrollment_update' => array(
				'name'               => __( 'Enrollment Update', 'echodash' ),
				'description'        => __( 'Triggered when an enrollment is updated by a linked tag in WP Fusion.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'user', 'contact' ),
				'enabled_by_default' => false,
				'default_event'      => array(
					'name'     => __( 'Enrollment Updated', 'echodash' ),
					'mappings' => array(
						'user_email' => '{user:user_email}',
						'message'    => '{contact:log_message}',
						'source'     => '{contact:log_source}',
					),
				),
			),
			'log_message'       => array(
				'name'               => __( 'Log Message', 'echodash' ),
				'description'        => __( 'Triggered when WP Fusion logs a message.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'user', 'contact' ),
				'enabled_by_default' => false,
				'default_event'      => array(
					'name'     => __( 'WP Fusion Log', 'echodash' ),
					'mappings' => array(
						'user_email' => '{user:user_email}',
						'contact_id' => '{contact:contact_id}',
						'message'    => '{contact:log_message}',
						'source'     => '{contact:log_source}',
					),
				),
			),
			'log_error'         => array(
				'name'               => __( 'Log Error', 'echodash' ),
				'description'        => __( 'Triggered when WP Fusion logs an error.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'user', 'contact' ),
				'enabled_by_default' => false,
				'default_event'      => array(
					'name'     => __( 'WP Fusion Error', 'echodash' ),
					'mappings' => array(
						'user_id'    => '{user:ID}',
						'contact_id' => '{contact:contact_id}',
						'message'    => '{contact:log_message}',
						'source'     => '{contact:log_source}',
					),
				),
			),
		);

		return $triggers;
	}

	/**
	 * Track event when a contact is added to the CRM.
	 *
	 * @since x.x.x
	 *
	 * @param array  $args       The data sent to the CRM.
	 * @param string $contact_id The contact ID in the CRM.
	 * @param mixed  $result     The API response.
	 */
	public function contact_added( $args, $contact_id, $result ) {

		// Extract user_id from args if available.
		$user_id = isset( $args['user_id'] ) ? $args['user_id'] : 0;

		$this->track_event(
			'contact_added',
			array(
				'user' => $user_id,
			),
			array(
				'contact' => array(
					'contact_id' => $contact_id,
					'email'      => isset( $args['email'] ) ? $args['email'] : '',
					'first_name' => isset( $args['first_name'] ) ? $args['first_name'] : '',
					'last_name'  => isset( $args['last_name'] ) ? $args['last_name'] : '',
					'user_id'    => $user_id,
				),
			)
		);
	}

	/**
	 * Track event when a contact is updated in the CRM.
	 *
	 * @since x.x.x
	 *
	 * @param array  $args       The data sent to the CRM.
	 * @param string $contact_id The contact ID in the CRM.
	 * @param mixed  $result     The API response.
	 */
	public function contact_updated( $args, $contact_id, $result ) {

		$user_id = wpf_get_user_id( $contact_id );

		$this->track_event(
			'contact_updated',
			array(
				'user' => $user_id,
			),
			array(
				'contact' => array(
					'contact_id' => $contact_id,
					'email'      => isset( $args['email'] ) ? $args['email'] : '',
					'first_name' => isset( $args['first_name'] ) ? $args['first_name'] : '',
					'last_name'  => isset( $args['last_name'] ) ? $args['last_name'] : '',
					'user_id'    => $user_id,
				),
			)
		);
	}

	/**
	 * Track event when tags are applied to a user.
	 *
	 * @since x.x.x
	 *
	 * @param int   $user_id The user ID.
	 * @param array $tags    The tags that were applied.
	 */
	public function tags_applied( $user_id, $tags ) {

		$tags = implode( ', ', array_map( 'wpf_get_tag_label', $tags ) );

		$this->track_event(
			'tags_applied',
			array(
				'user' => $user_id,
			),
			array(
				'tag' => array(
					'tags_applied' => $tags,
					'contact_id'   => wpf_get_contact_id( $user_id ),
				),
			)
		);
	}

	/**
	 * Track event when tags are removed from a user.
	 *
	 * @since x.x.x
	 *
	 * @param int   $user_id The user ID.
	 * @param array $tags    The tags that were removed.
	 */
	public function tags_removed( $user_id, $tags ) {

		$tags = implode( ', ', array_map( 'wpf_get_tag_label', $tags ) );

		$this->track_event(
			'tags_removed',
			array(
				'user' => $user_id,
				'c'
			),
			array(
				'tag' => array(
					'tags_removed' => $tags,
					'contact_id'   => wpf_get_contact_id( $user_id ),
				),
			)
		);
	}

	/**
	 * Track log messages from WP Fusion.
	 *
	 * @since x.x.x
	 *
	 * @param int    $timestamp The timestamp.
	 * @param string $level     The log level.
	 * @param int    $user      The user ID.
	 * @param string $message   The log message.
	 * @param array  $context   The log context.
	 */
	public function handle_log( $timestamp, $level, $user, $message, $context ) {

		// Check for enrollment updates.
		if ( strpos( $message, 'by linked tag' ) !== false ) {
			$this->track_event(
				'enrollment_update',
				array(
					'user' => $user,
				),
				array(
					'log' => array(
						'message'   => $message,
						'timestamp' => $timestamp,
					),
				)
			);
		}

		// Track general log message.
		$this->track_event(
			'log_message',
			array(
				'user' => $user,
			),
			array(
				'log' => array(
					'level'     => $level,
					'message'   => $message,
					'timestamp' => $timestamp,
				),
			)
		);
	}

	/**
	 * Track error log messages from WP Fusion.
	 *
	 * @since x.x.x
	 *
	 * @param int    $timestamp The timestamp.
	 * @param int    $user      The user ID.
	 * @param string $message   The log message.
	 * @param array  $context   The log context.
	 */
	public function handle_log_error( $timestamp, $user, $message, $context ) {

		$this->track_event(
			'log_error',
			array(
				'user' => $user,
			),
			array(
				'log' => array(
					'message'   => $message,
					'timestamp' => $timestamp,
				),
			)
		);
	}

	/**
	 * Gets the contact options.
	 *
	 * @since  x.x.x
	 *
	 * @return array The contact options.
	 */
	public function get_contact_options() {

		return array(
			'name'    => __( 'Contact', 'echodash' ),
			'type'    => 'contact',
			'options' => array(
				array(
					'meta'        => 'contact_id',
					'preview'     => 'cid_123456',
					'placeholder' => __( 'The contact ID in the CRM', 'echodash' ),
				),
				array(
					'meta'        => 'email',
					'preview'     => 'john@example.com',
					'placeholder' => __( 'The contact email address', 'echodash' ),
				),
				array(
					'meta'        => 'first_name',
					'preview'     => 'John',
					'placeholder' => __( 'The contact first name', 'echodash' ),
				),
				array(
					'meta'        => 'last_name',
					'preview'     => 'Doe',
					'placeholder' => __( 'The contact last name', 'echodash' ),
				),
				array(
					'meta'        => 'user_id',
					'preview'     => '42',
					'placeholder' => __( 'The WordPress user ID', 'echodash' ),
				),
				array(
					'meta'        => 'update_data',
					'preview'     => '{"first_name": "John", "last_name": "Doe"}',
					'placeholder' => __( 'The updated data in the CRM', 'echodash' ),
				),
				array(
					'meta'        => 'log_message',
					'preview'     => 'Contact updated successfully',
					'placeholder' => __( 'The log message', 'echodash' ),
				),
				array(
					'meta'        => 'log_source',
					'preview'     => 'learndash',
					'placeholder' => __( 'The log source', 'echodash' ),
				),
				array(
					'meta'        => 'tags_applied',
					'preview'     => 'tag1, tag2',
					'placeholder' => __( 'The tags applied to the contact', 'echodash' ),
				),
				array(
					'meta'        => 'tags_removed',
					'preview'     => 'tag1, tag2',
					'placeholder' => __( 'The tags removed from the contact', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Get the actual contact data.
	 *
	 * @since x.x.x
	 *
	 * @param string $contact_id The contact ID.
	 * @return array The contact data.
	 */
	public function get_contact_vars( $contact_id ) {

		$data = array(
			'contact_id' => $contact_id,
			'crm_type'   => wpf_get_option( 'crm', '' ),
		);

		// Try to get user data if we have a user ID associated with this contact.
		if ( function_exists( 'wp_fusion' ) && method_exists( wp_fusion()->user, 'get_user_id' ) ) {
			$user_id = wp_fusion()->user->get_user_id( $contact_id );

			if ( $user_id ) {
				$user = get_userdata( $user_id );
				if ( $user ) {
					$data['email']      = $user->user_email;
					$data['first_name'] = get_user_meta( $user_id, 'first_name', true );
					$data['last_name']  = get_user_meta( $user_id, 'last_name', true );
					$data['user_id']    = $user_id;
				}
			}
		}

		return $data;
	}
}

new EchoDash_WP_Fusion();