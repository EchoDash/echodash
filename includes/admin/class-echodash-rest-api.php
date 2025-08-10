<?php
/**
 * EchoDash REST API Controller
 *
 * Handles REST API endpoints for the React admin interface.
 *
 * @package EchoDash
 * @since 2.0.0
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class EchoDash_REST_API extends WP_REST_Controller {

	/**
	 * Constructor.
	 *
	 * @since 2.0.0
	 */
	public function __construct() {
		$this->namespace = 'echodash/v1';
		$this->rest_base = 'settings';
	}

	/**
	 * Register the routes for the objects of the controller.
	 *
	 * @since 2.0.0
	 */
	public function register_routes() {
		// Settings endpoints
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'update_settings' ),
					'permission_callback' => array( $this, 'update_settings_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
				),
			)
		);

		// Triggers endpoints (CREATE only - data provided via wp_localize_script)
		register_rest_route(
			$this->namespace,
			'/integrations/(?P<slug>[a-z0-9-]+)/triggers',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_trigger' ),
					'permission_callback' => array( $this, 'create_trigger_permissions_check' ),
					'args'                => $this->get_trigger_create_args(),
				),
			)
		);

		// Single trigger endpoint
		register_rest_route(
			$this->namespace,
			'/integrations/(?P<slug>[a-z0-9-]+)/triggers/(?P<trigger_id>[a-z0-9_]+)',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_trigger' ),
					'permission_callback' => array( $this, 'update_trigger_permissions_check' ),
					'args'                => $this->get_trigger_update_args(),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_trigger' ),
					'permission_callback' => array( $this, 'delete_trigger_permissions_check' ),
				),
			)
		);

		// Event preview endpoint
		register_rest_route(
			$this->namespace,
			'/preview',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'generate_preview' ),
					'permission_callback' => array( $this, 'preview_permissions_check' ),
					'args'                => array(
						'eventConfig'     => array(
							'description' => __( 'Event configuration to preview', 'echodash' ),
							'type'        => 'object',
							'required'    => true,
						),
						'integrationSlug' => array(
							'description' => __( 'Integration slug for context', 'echodash' ),
							'type'        => 'string',
							'required'    => true,
						),
						'testData'        => array(
							'description' => __( 'Test data for merge tag processing', 'echodash' ),
							'type'        => 'object',
							'required'    => false,
						),
					),
				),
			)
		);

		// Test event endpoint
		register_rest_route(
			$this->namespace,
			'/test-event',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'send_test_event' ),
					'permission_callback' => array( $this, 'test_event_permissions_check' ),
					'args'                => array(
						'eventData'       => array(
							'description' => __( 'Event data to send', 'echodash' ),
							'type'        => 'object',
							'required'    => true,
						),
						'integrationSlug' => array(
							'description' => __( 'Integration slug for source context', 'echodash' ),
							'type'        => 'string',
							'required'    => true,
						),
						'trigger'         => array(
							'description' => __( 'Trigger key for context', 'echodash' ),
							'type'        => 'string',
							'required'    => true,
						),
					),
				),
			)
		);
	}

	/**
	 * Update settings
	 *
	 * @since 2.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response The response object.
	 */
	public function update_settings( $request ) {
		$params = $request->get_json_params();

		// Validate and sanitize input
		if ( isset( $params['endpoint'] ) ) {
			$endpoint = esc_url_raw( $params['endpoint'] );
			update_option( 'echodash_endpoint', $endpoint );
		}

		if ( isset( $params['settings'] ) && is_array( $params['settings'] ) ) {
			$settings = $this->sanitize_settings( $params['settings'] );
			update_option( 'echodash_options', $settings );
		}

		// Return updated settings
		return rest_ensure_response(
			array(
				'message' => __( 'Settings updated successfully', 'echodash' ),
			)
		);
	}


	/**
	 * Create a new trigger.
	 *
	 * @since 2.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response The response object.
	 */
	public function create_trigger( $request ) {
		$slug   = $request->get_param( 'slug' );
		$params = $request->get_json_params();

		// Validate required fields
		if ( ! isset( $params['name'] ) || ! isset( $params['trigger'] ) ) {
			return new WP_Error( 'missing_required_fields', __( 'Name and trigger type are required', 'echodash' ), array( 'status' => 400 ) );
		}

		// Get current settings
		$settings = get_option( 'echodash_options', array() );

		// Initialize structure if needed
		if ( ! isset( $settings['integrations'] ) ) {
			$settings['integrations'] = array();
		}
		if ( ! isset( $settings['integrations'][ $slug ] ) ) {
			$settings['integrations'][ $slug ] = array();
		}
		if ( ! isset( $settings['integrations'][ $slug ]['triggers'] ) ) {
			$settings['integrations'][ $slug ]['triggers'] = array();
		}

		// Generate unique ID for the trigger
		$trigger_id = sanitize_key( $params['trigger'] . '_' . time() );

		// Add trigger
		$settings['integrations'][ $slug ]['triggers'][ $trigger_id ] = $this->sanitize_trigger_data( $params );

		// Save settings
		update_option( 'echodash_options', $settings );

		// Return created trigger
		return rest_ensure_response(
			array(
				'id'      => $trigger_id,
				'trigger' => $settings['integrations'][ $slug ]['triggers'][ $trigger_id ],
				'message' => __( 'Trigger created successfully', 'echodash' ),
			)
		);
	}

	/**
	 * Update a trigger.
	 *
	 * @since 2.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response The response object.
	 */
	public function update_trigger( $request ) {
		$slug       = $request->get_param( 'slug' );
		$trigger_id = $request->get_param( 'trigger_id' );
		$params     = $request->get_json_params();

		// Get current settings
		$settings = get_option( 'echodash_options', array() );

		// Check if trigger exists
		if ( ! isset( $settings['integrations'][ $slug ]['triggers'][ $trigger_id ] ) ) {
			return new WP_Error( 'trigger_not_found', __( 'Trigger not found', 'echodash' ), array( 'status' => 404 ) );
		}

		// Update trigger
		$settings['integrations'][ $slug ]['triggers'][ $trigger_id ] = array_merge(
			$settings['integrations'][ $slug ]['triggers'][ $trigger_id ],
			$this->sanitize_trigger_data( $params )
		);

		// Save settings
		update_option( 'echodash_options', $settings );

		// Return updated trigger
		return rest_ensure_response(
			array(
				'id'      => $trigger_id,
				'trigger' => $settings['integrations'][ $slug ]['triggers'][ $trigger_id ],
				'message' => __( 'Trigger updated successfully', 'echodash' ),
			)
		);
	}

	/**
	 * Delete a trigger.
	 *
	 * @since 2.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response The response object.
	 */
	public function delete_trigger( $request ) {
		$slug       = $request->get_param( 'slug' );
		$trigger_id = $request->get_param( 'trigger_id' );

		// Get current settings
		$settings = get_option( 'echodash_options', array() );

		// Check if trigger exists
		if ( ! isset( $settings['integrations'][ $slug ]['triggers'][ $trigger_id ] ) ) {
			return new WP_Error( 'trigger_not_found', __( 'Trigger not found', 'echodash' ), array( 'status' => 404 ) );
		}

		// Delete trigger
		unset( $settings['integrations'][ $slug ]['triggers'][ $trigger_id ] );

		// Save settings
		update_option( 'echodash_options', $settings );

		return rest_ensure_response(
			array(
				'message' => __( 'Trigger deleted successfully', 'echodash' ),
			)
		);
	}

	/**
	 * Generate event preview using integration's built-in methods.
	 *
	 * @since 2.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response The response object.
	 */
	public function generate_preview( $request ) {
		$params           = $request->get_json_params();
		$event_config     = $params['eventConfig'];
		$integration_slug = isset( $params['integrationSlug'] ) ? $params['integrationSlug'] : null;
		$trigger_id       = isset( $params['triggerId'] ) ? $params['triggerId'] : null;

		// Get integration instance
		if ( ! $integration_slug || ! echodash() || ! echodash()->integration( $integration_slug ) ) {
			return new WP_Error( 'integration_not_found', __( 'Integration not found', 'echodash' ), array( 'status' => 404 ) );
		}

		$integration = echodash()->integration( $integration_slug );

		// Get preview data directly from integration's options system
		$options         = $integration->get_options( $trigger_id );
		$test_event_data = $this->extract_preview_data_from_options( $options );

		// Use integration's replace_tags method for processing
		$event_values   = wp_list_pluck( $event_config['mappings'], 'value', 'key' );
		$processed_data = $integration->replace_tags( $event_values, $test_event_data );

		return rest_ensure_response(
			array(
				'eventName'     => $event_config['name'],
				'processedData' => $processed_data,
				'rawData'       => $event_config,
				'testData'      => $test_event_data,
			)
		);
	}

	/**
	 * Send test event.
	 *
	 * @since 2.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error The response object or error object.
	 */
	public function send_test_event( $request ) {

		$params           = $request->get_json_params();
		$event_data       = $params['eventData'];
		$integration_slug = $params['integrationSlug'];
		$trigger          = $params['trigger'];

		// Get EchoDash instance and validate integration
		if ( ! echodash() || ! echodash()->integration( $integration_slug ) ) {
			return new WP_Error( 'integration_not_found', __( 'Integration not found', 'echodash' ), array( 'status' => 404 ) );
		}

		$integration = echodash()->integration( $integration_slug );

		// Get source and trigger names (following legacy implementation pattern)
		$source_name  = $integration->name;
		$trigger_name = $integration->get_trigger_name( $trigger );

		// Track test event with processed parameters
		$result = echodash_track_event( $event_data['name'], $event_data['properties'], $source_name, $trigger_name );

		if ( $result ) {
			return rest_ensure_response(
				array(
					'success'        => true,
					'message'        => __( 'Test event sent successfully', 'echodash' ),
					'processed_data' => $event_data['properties'],
				)
			);
		} else {
			return new WP_Error( 'event_send_failed', __( 'Failed to send test event', 'echodash' ), array( 'status' => 500 ) );
		}
	}

	/**
	 * Extract preview data from integration options structure.
	 * Converts the options array into the format expected by replace_tags().
	 *
	 * @since 2.0.0
	 *
	 * @param array $options The options array from integration->get_options().
	 * @return array The preview data organized by object type.
	 */
	private function extract_preview_data_from_options( $options ) {
		$preview_data = array();

		foreach ( $options as $option_group ) {
			if ( isset( $option_group['type'] ) && isset( $option_group['options'] ) ) {
				$object_type                  = $option_group['type'];
				$preview_data[ $object_type ] = array();

				foreach ( $option_group['options'] as $option ) {
					if ( isset( $option['meta'] ) && isset( $option['preview'] ) ) {
						$preview_data[ $object_type ][ $option['meta'] ] = $option['preview'];
					}
				}

				// Add in custom meta, like postmeta or user meta that we haven't specifically declared.
				if ( ! empty( $option_group['meta'] ) ) {
					$preview_data[ $object_type ] = array_merge( $preview_data[ $object_type ], $option_group['meta'] );
				}
			}
		}

		return $preview_data;
	}

	/**
	 * Sanitize settings data.
	 *
	 * @since 2.0.0
	 *
	 * @param array $settings The settings.
	 * @return array The sanitized settings.
	 */
	private function sanitize_settings( $settings ) {
		$sanitized = array();

		foreach ( $settings as $key => $value ) {
			if ( is_array( $value ) ) {
				$sanitized[ $key ] = $this->sanitize_settings( $value );
			} else {
				$sanitized[ $key ] = sanitize_text_field( $value );
			}
		}

		return $sanitized;
	}


	/**
	 * Sanitize trigger data.
	 *
	 * @since 2.0.0
	 *
	 * @param array $data The trigger data.
	 * @return array The sanitized trigger data.
	 */
	private function sanitize_trigger_data( $data ) {
		$sanitized = array(
			'name'       => sanitize_text_field( $data['name'] ),
			'trigger'    => sanitize_key( $data['trigger'] ),
			'event_name' => sanitize_text_field( isset( $data['event_name'] ) ? $data['event_name'] : $data['name'] ),
			'mappings'   => array(),
		);

		if ( isset( $data['mappings'] ) && is_array( $data['mappings'] ) ) {
			foreach ( $data['mappings'] as $mapping ) {
				$sanitized['mappings'][] = array(
					'key'   => sanitize_key( $mapping['key'] ),
					'value' => sanitize_text_field( $mapping['value'] ),
				);
			}
		}

		return $sanitized;
	}

	/**
	 * Get endpoint args for trigger creation.
	 *
	 * @since 2.0.0
	 *
	 * @return array The endpoint args.
	 */
	private function get_trigger_create_args() {
		return array(
			'trigger'    => array(
				'description' => __( 'Trigger type', 'echodash' ),
				'type'        => 'string',
				'required'    => true,
			),
			'event_name' => array(
				'description' => __( 'Event name', 'echodash' ),
				'type'        => 'string',
				'required'    => false,
			),
			'mappings'   => array(
				'description' => __( 'Event property mappings', 'echodash' ),
				'type'        => 'array',
				'required'    => false,
			),
		);
	}

	/**
	 * Get endpoint args for trigger update.
	 *
	 * @since 2.0.0
	 *
	 * @return array The endpoint args.
	 */
	private function get_trigger_update_args() {
		return array(
			'event_name' => array(
				'description' => __( 'Event name', 'echodash' ),
				'type'        => 'string',
				'required'    => false,
			),
			'mappings'   => array(
				'description' => __( 'Event property mappings', 'echodash' ),
				'type'        => 'array',
				'required'    => false,
			),
		);
	}

	/**
	 * Check if a given request has access to update settings.
	 *
	 * @since 2.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return bool Whether the user has access.
	 */
	public function update_settings_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to create triggers.
	 *
	 * @since 2.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return bool Whether the user has access.
	 */
	public function create_trigger_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to update triggers.
	 *
	 * @since 2.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return bool Whether the user has access.
	 */
	public function update_trigger_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to delete triggers.
	 *
	 * @since 2.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return bool Whether the user has access.
	 */
	public function delete_trigger_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to generate preview.
	 *
	 * @since 2.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return bool Whether the user has access.
	 */
	public function preview_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to send test events.
	 *
	 * @since 2.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return bool Whether the user has access.
	 */
	public function test_event_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}
}

/**
 * Initialize the REST API.
 */
add_action(
	'rest_api_init',
	function () {
		$controller = new EchoDash_REST_API();
		$controller->register_routes();
	}
);
