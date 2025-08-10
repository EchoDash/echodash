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
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_settings' ),
					'permission_callback' => array( $this, 'get_settings_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'update_settings' ),
					'permission_callback' => array( $this, 'update_settings_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
				),
			)
		);

		// Note: Integration list data is provided via wp_localize_script in EchoDash_React_Admin
		// No need for separate REST endpoint since React app gets this data on page load

				// Integration settings endpoint (for updating integration-specific settings)
		register_rest_route(
			$this->namespace,
			'/integrations/(?P<slug>[a-z0-9-]+)',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_integration' ),
					'permission_callback' => array( $this, 'update_integration_permissions_check' ),
					'args'                => $this->get_integration_update_args(),
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
	 * Get all settings.
	 *
	 * @since 2.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response The response object.
	 */
	public function get_settings( $request ) {
		$settings = get_option( 'echodash_options', array() );
		$endpoint = get_option( 'echodash_endpoint', '' );

		$response = array(
			'endpoint'     => $endpoint,
			'settings'     => $settings,
			'debug_mode'   => defined( 'WP_DEBUG' ) && WP_DEBUG,
			'version'      => ECHODASH_VERSION,
			'capabilities' => $this->get_user_capabilities(),
		);

		return rest_ensure_response( $response );
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
		return $this->get_settings( $request );
	}

	// Removed get_integrations() - data provided via wp_localize_script in EchoDash_React_Admin

	// Removed get_integration() - data provided via wp_localize_script in EchoDash_React_Admin

	/**
	 * Update integration settings.
	 *
	 * @since 2.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response The response object.
	 */
	public function update_integration( $request ) {
		$slug   = $request->get_param( 'slug' );
		$params = $request->get_json_params();

		// Get current settings
		$settings = get_option( 'echodash_options', array() );

		// Update integration-specific settings
		if ( ! isset( $settings['integrations'] ) ) {
			$settings['integrations'] = array();
		}

		if ( ! isset( $settings['integrations'][ $slug ] ) ) {
			$settings['integrations'][ $slug ] = array();
		}

		// Merge new settings
		$settings['integrations'][ $slug ] = array_merge(
			$settings['integrations'][ $slug ],
			$this->sanitize_integration_settings( $params )
		);

		// Save settings
		update_option( 'echodash_options', $settings );

		// Return success response
		return rest_ensure_response(
			array(
				'message' => __( 'Integration updated successfully', 'echodash' ),
			)
		);
	}

	// Removed get_triggers() - data provided via wp_localize_script in EchoDash_React_Admin

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
	 * Generate event preview.
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
		$test_data        = isset( $params['testData'] ) ? $params['testData'] : $this->get_integration_test_data( $integration_slug, $trigger_id );

		// Process merge tags
		$processed_data = array();
		foreach ( $event_config['mappings'] as $mapping ) {
			$key                    = $mapping['key'];
			$value                  = $this->process_merge_tag( $mapping['value'], $test_data );
			$processed_data[ $key ] = $value;
		}

		return rest_ensure_response(
			array(
				'eventName'     => $event_config['name'],
				'processedData' => $processed_data,
				'rawData'       => $event_config,
				'testData'      => $test_data,
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
	 * Process merge tag.
	 *
	 * @since 2.0.0
	 *
	 * @param string $template The template.
	 * @param array  $test_data The test data.
	 * @return string The processed merge tag.
	 */
	private function process_merge_tag( $template, $test_data ) {
		if ( ! is_string( $template ) ) {
			return $template;
		}

		return preg_replace_callback(
			'/\{([^}]+)\}/',
			function ( $matches ) use ( $test_data ) {
				$parts = explode( ':', $matches[1] );
				if ( count( $parts ) === 2 ) {
					$object_type = $parts[0];
					$field_name  = $parts[1];

					if ( isset( $test_data[ $object_type ][ $field_name ] ) ) {
						return $test_data[ $object_type ][ $field_name ];
					}
				}
				return $matches[0];
			},
			$template
		);
	}

	/**
	 * Get integration-specific test data based on the integration's preview definitions.
	 * Used only by the preview endpoint - test event data is already processed.
	 *
	 * @since 2.0.0
	 *
	 * @param string $integration_slug The integration slug.
	 * @param string $trigger_id       The trigger ID.
	 * @return array The integration-specific test data.
	 */
	private function get_integration_test_data( $integration_slug = null, $trigger_id = null ) {
		// If no integration specified, return basic fallback data
		if ( ! $integration_slug ) {
			return $this->get_fallback_test_data();
		}

		error_log( print_r( 'GET TEST DATA', true ) );

		// Get the integration instance
		if ( ! echodash() || ! echodash()->integration( $integration_slug ) ) {
			return $this->get_fallback_test_data();
		}

		$integration = echodash()->integration( $integration_slug );

		// Get the trigger's option types and build test data from preview values.
		$options   = $integration->get_options( $trigger_id );
		$test_data = array();

		if ( ! empty( $options ) ) {
			foreach ( $options as $option_data ) {
				if ( isset( $option_data['type'] ) && isset( $option_data['options'] ) && is_array( $option_data['options'] ) ) {
					$option_type               = $option_data['type'];
					$test_data[ $option_type ] = array();

					// Extract preview values from each option.
					foreach ( $option_data['options'] as $option ) {
						if ( isset( $option['meta'] ) && isset( $option['preview'] ) ) {
							$test_data[ $option_type ][ $option['meta'] ] = $option['preview'];
						}
					}
				}
			}
		}

		// If no test data was generated, use fallback.
		if ( empty( $test_data ) ) {
			return $this->get_fallback_test_data();
		}

		return $test_data;
	}

	/**
	 * Get fallback test data for when integration-specific data is not available.
	 * Used only by the preview endpoint.
	 *
	 * @since 2.0.0
	 *
	 * @return array The fallback test data.
	 */
	private function get_fallback_test_data() {
		$current_user = wp_get_current_user();

		return array(
			'user'    => array(
				'user_email'   => $current_user->user_email,
				'display_name' => $current_user->display_name,
				'first_name'   => $current_user->first_name,
				'last_name'    => $current_user->last_name,
				'ID'           => $current_user->ID,
			),
			'post'    => array(
				'post_title'   => 'Sample Post Title',
				'post_content' => 'Sample post content',
				'post_excerpt' => 'Sample excerpt',
				'ID'           => 1,
				'post_url'     => home_url( '/sample-post/' ),
			),
			'product' => array(
				'name'  => 'Sample Product',
				'price' => '29.99',
				'sku'   => 'SAMPLE-001',
				'id'    => 1,
			),
		);
	}

	/**
	 * Get user capabilities.
	 *
	 * @since 2.0.0
	 *
	 * @return array The user capabilities.
	 */
	private function get_user_capabilities() {
		$user = wp_get_current_user();
		return array(
			'can_manage_options' => current_user_can( 'manage_options' ),
			'can_edit_posts'     => current_user_can( 'edit_posts' ),
			'is_admin'           => is_admin(),
		);
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
	 * Sanitize integration settings.
	 *
	 * @since 2.0.0
	 *
	 * @param array $settings The settings.
	 * @return array The sanitized settings.
	 */
	private function sanitize_integration_settings( $settings ) {
		return $this->sanitize_settings( $settings );
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
	 * Get endpoint args for integration update.
	 *
	 * @since 2.0.0
	 *
	 * @return array The endpoint args.
	 */
	private function get_integration_update_args() {
		return array(
			'enabled'  => array(
				'description' => __( 'Whether the integration is enabled', 'echodash' ),
				'type'        => 'boolean',
				'required'    => false,
			),
			'settings' => array(
				'description' => __( 'Integration-specific settings', 'echodash' ),
				'type'        => 'object',
				'required'    => false,
			),
		);
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
	 * Check if a given request has access to get settings.
	 *
	 * @since 2.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return bool Whether the user has access.
	 */
	public function get_settings_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
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

	// Removed get_integrations_permissions_check() - endpoint removed

	// Removed get_integration_permissions_check() - GET endpoint removed

	/**
	 * Check if a given request has access to update an integration.
	 *
	 * @since 2.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return bool Whether the user has access.
	 */
	public function update_integration_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	// Removed get_triggers_permissions_check() - GET endpoint removed

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
