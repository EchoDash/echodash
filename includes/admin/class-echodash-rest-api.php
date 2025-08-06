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
	 * Constructor
	 */
	public function __construct() {
		$this->namespace = 'echodash/v1';
		$this->rest_base = 'settings';
	}

	/**
	 * Register the routes for the objects of the controller.
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

		// Integrations endpoints
		register_rest_route(
			$this->namespace,
			'/integrations',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_integrations' ),
					'permission_callback' => array( $this, 'get_integrations_permissions_check' ),
				),
			)
		);

		// Single integration endpoint
		register_rest_route(
			$this->namespace,
			'/integrations/(?P<slug>[a-z0-9-]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_integration' ),
					'permission_callback' => array( $this, 'get_integration_permissions_check' ),
					'args'                => array(
						'slug' => array(
							'description' => __( 'Integration slug', 'echodash' ),
							'type'        => 'string',
							'required'    => true,
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_integration' ),
					'permission_callback' => array( $this, 'update_integration_permissions_check' ),
					'args'                => $this->get_integration_update_args(),
				),
			)
		);

		// Triggers endpoints
		register_rest_route(
			$this->namespace,
			'/integrations/(?P<slug>[a-z0-9-]+)/triggers',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_triggers' ),
					'permission_callback' => array( $this, 'get_triggers_permissions_check' ),
					'args'                => array(
						'slug' => array(
							'description' => __( 'Integration slug', 'echodash' ),
							'type'        => 'string',
							'required'    => true,
						),
					),
				),
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
						'eventData' => array(
							'description' => __( 'Event data to send', 'echodash' ),
							'type'        => 'object',
							'required'    => true,
						),
					),
				),
			)
		);
	}

	/**
	 * Get all settings
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

	/**
	 * Get all integrations
	 */
	public function get_integrations( $request ) {
		$echodash          = echodash();
		$integrations_data = array();

		if ( ! $echodash || ! isset( $echodash->integrations ) ) {
			return rest_ensure_response( array( 'integrations' => array() ) );
		}

		foreach ( $echodash->integrations as $slug => $integration ) {
			$integrations_data[] = $this->prepare_integration_for_response( $integration, $slug );
		}

		return rest_ensure_response(
			array(
				'integrations' => $integrations_data,
				'total'        => count( $integrations_data ),
			)
		);
	}

	/**
	 * Get single integration
	 */
	public function get_integration( $request ) {
		$slug     = $request->get_param( 'slug' );
		$echodash = echodash();

		if ( ! $echodash || ! isset( $echodash->integrations[ $slug ] ) ) {
			return new WP_Error( 'integration_not_found', __( 'Integration not found', 'echodash' ), array( 'status' => 404 ) );
		}

		$integration = $echodash->integrations[ $slug ];
		$data        = $this->prepare_integration_for_response( $integration, $slug, true );

		return rest_ensure_response( $data );
	}

	/**
	 * Update integration settings
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

		// Return updated integration data
		return $this->get_integration( $request );
	}

	/**
	 * Get triggers for an integration
	 */
	public function get_triggers( $request ) {
		$slug     = $request->get_param( 'slug' );
		$echodash = echodash();

		if ( ! $echodash || ! isset( $echodash->integrations[ $slug ] ) ) {
			return new WP_Error( 'integration_not_found', __( 'Integration not found', 'echodash' ), array( 'status' => 404 ) );
		}

		$integration = $echodash->integrations[ $slug ];
		$triggers    = array();

		// Get configured triggers from database settings
		$settings            = get_option( 'echodash_options', array() );
		$configured_triggers = array();
		if ( isset( $settings['integrations'][ $slug ]['triggers'] ) && is_array( $settings['integrations'][ $slug ]['triggers'] ) ) {
			$configured_triggers = $settings['integrations'][ $slug ]['triggers'];
		}

		// Convert configured triggers to API response format
		foreach ( $configured_triggers as $trigger_id => $trigger_data ) {
			// Get trigger definition for additional metadata
			$available_triggers = $integration->get_triggers();
			$trigger_definition = isset( $available_triggers[ $trigger_data['trigger'] ] ) ? $available_triggers[ $trigger_data['trigger'] ] : array();

			$triggers[] = array(
				'id'          => $trigger_id,
				'name'        => $trigger_data['name'] ?? $trigger_id,
				'trigger'     => $trigger_data['trigger'] ?? $trigger_id,
				'event_name'  => $trigger_data['event_name'] ?? $trigger_data['name'] ?? '',
				'mappings'    => $trigger_data['mappings'] ?? array(),
				'enabled'     => true, // Assume enabled if configured
				'description' => $trigger_definition['description'] ?? '',
				'hasGlobal'   => $trigger_definition['has_global'] ?? true,
				'hasSingle'   => $trigger_definition['has_single'] ?? false,
				'optionTypes' => $trigger_definition['option_types'] ?? array(),
				'postTypes'   => $trigger_definition['post_types'] ?? array(),
			);
		}

		return rest_ensure_response(
			array(
				'triggers' => $triggers,
				'total'    => count( $triggers ),
			)
		);
	}

	/**
	 * Create a new trigger
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
	 * Update a trigger
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
	 * Delete a trigger
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
	 * Generate event preview
	 */
	public function generate_preview( $request ) {
		$params           = $request->get_json_params();
		$event_config     = $params['eventConfig'];
		$integration_slug = $params['integrationSlug'];
		$test_data        = isset( $params['testData'] ) ? $params['testData'] : $this->get_default_test_data();

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
	 * Send test event
	 */
	public function send_test_event( $request ) {
		$params     = $request->get_json_params();
		$event_data = $params['eventData'];

		// Get EchoDash instance
		$echodash = echodash();
		if ( ! $echodash || ! isset( $echodash->public ) ) {
			return new WP_Error( 'echodash_not_initialized', __( 'EchoDash is not properly initialized', 'echodash' ), array( 'status' => 500 ) );
		}

		// Track test event
		$result = $echodash->public->track_event( $event_data['name'], $event_data['properties'], true );

		if ( $result ) {
			return rest_ensure_response(
				array(
					'success' => true,
					'message' => __( 'Test event sent successfully', 'echodash' ),
				)
			);
		} else {
			return new WP_Error( 'event_send_failed', __( 'Failed to send test event', 'echodash' ), array( 'status' => 500 ) );
		}
	}

	/**
	 * Prepare integration data for response
	 */
	private function prepare_integration_for_response( $integration, $slug, $detailed = false ) {
		// Get configured triggers count from database
		$settings                 = get_option( 'echodash_options', array() );
		$configured_trigger_count = 0;
		if ( isset( $settings['integrations'][ $slug ]['triggers'] ) && is_array( $settings['integrations'][ $slug ]['triggers'] ) ) {
			$configured_trigger_count = count( $settings['integrations'][ $slug ]['triggers'] );
		}

		$data = array(
			'slug'         => $slug,
			'name'         => $integration->name,
			'icon'         => $this->get_integration_icon( $slug ),
			'description'  => isset( $integration->description ) ? $integration->description : '',
			'isActive'     => $integration->is_active(),
			'enabled'      => $integration->is_active(),
			'triggerCount' => $configured_trigger_count,
		);

		if ( $detailed ) {
			$data['triggers'] = array();

			// Get configured triggers from database settings
			$configured_triggers = array();
			if ( isset( $settings['integrations'][ $slug ]['triggers'] ) && is_array( $settings['integrations'][ $slug ]['triggers'] ) ) {
				$configured_triggers = $settings['integrations'][ $slug ]['triggers'];
			}

			// Convert configured triggers to API response format
			foreach ( $configured_triggers as $trigger_id => $trigger_data ) {
				// Get trigger definition for additional metadata
				$available_triggers = $integration->get_triggers();
				$trigger_definition = isset( $available_triggers[ $trigger_data['trigger'] ] ) ? $available_triggers[ $trigger_data['trigger'] ] : array();

				$data['triggers'][] = array(
					'id'          => $trigger_id,
					'name'        => $trigger_data['name'] ?? $trigger_id,
					'trigger'     => $trigger_data['trigger'] ?? $trigger_id,
					'event_name'  => $trigger_data['event_name'] ?? $trigger_data['name'] ?? '',
					'mappings'    => $trigger_data['mappings'] ?? array(),
					'enabled'     => true, // Assume enabled if configured
					'description' => $trigger_definition['description'] ?? '',
					'hasGlobal'   => $trigger_definition['has_global'] ?? true,
					'hasSingle'   => $trigger_definition['has_single'] ?? false,
					'optionTypes' => $trigger_definition['option_types'] ?? array(),
					'postTypes'   => $trigger_definition['post_types'] ?? array(),
				);
			}

			$data['settings']     = $this->get_integration_settings( $slug );
			$data['capabilities'] = array(
				'hasGlobalSettings' => true,
				'hasSingleSettings' => isset( $integration->has_single ) ? $integration->has_single : false,
			);
		}

		return $data;
	}

	/**
	 * Prepare trigger data for response
	 */
	private function prepare_trigger_for_response( $trigger, $trigger_id ) {
		return array(
			'id'           => $trigger_id,
			'name'         => isset( $trigger['name'] ) ? $trigger['name'] : '',
			'description'  => isset( $trigger['description'] ) ? $trigger['description'] : '',
			'hasGlobal'    => isset( $trigger['has_global'] ) ? $trigger['has_global'] : true,
			'hasSingle'    => isset( $trigger['has_single'] ) ? $trigger['has_single'] : false,
			'optionTypes'  => isset( $trigger['option_types'] ) ? $trigger['option_types'] : array(),
			'defaultEvent' => isset( $trigger['default_event'] ) ? $trigger['default_event'] : array(),
			'postTypes'    => isset( $trigger['post_types'] ) ? $trigger['post_types'] : array(),
		);
	}

	/**
	 * Get integration icon
	 */
	private function get_integration_icon( $slug ) {
		$icons = array(
			'woocommerce'   => 'cart',
			'gravity-forms' => 'forms',
			'learndash'     => 'welcome-learn-more',
			'memberpress'   => 'groups',
			'wordpress'     => 'wordpress',
		);

		return isset( $icons[ $slug ] ) ? $icons[ $slug ] : 'admin-plugins';
	}

	/**
	 * Get integration settings
	 */
	private function get_integration_settings( $slug ) {
		$settings = get_option( 'echodash_options', array() );
		return isset( $settings['integrations'][ $slug ] ) ? $settings['integrations'][ $slug ] : array();
	}

	/**
	 * Process merge tag
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
	 * Get default test data
	 */
	private function get_default_test_data() {
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
	 * Get user capabilities
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
	 * Sanitize settings data
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
	 * Sanitize integration settings
	 */
	private function sanitize_integration_settings( $settings ) {
		return $this->sanitize_settings( $settings );
	}

	/**
	 * Sanitize trigger data
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
	 * Get endpoint args for integration update
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
	 * Get endpoint args for trigger creation
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
	 * Get endpoint args for trigger update
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
	 * Check if a given request has access to get settings
	 */
	public function get_settings_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to update settings
	 */
	public function update_settings_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to get integrations
	 */
	public function get_integrations_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to get a single integration
	 */
	public function get_integration_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to update an integration
	 */
	public function update_integration_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to get triggers
	 */
	public function get_triggers_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to create triggers
	 */
	public function create_trigger_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to update triggers
	 */
	public function update_trigger_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to delete triggers
	 */
	public function delete_trigger_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to generate preview
	 */
	public function preview_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to send test events
	 */
	public function test_event_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}
}

// Initialize the REST API
add_action(
	'rest_api_init',
	function () {
		$controller = new EchoDash_REST_API();
		$controller->register_routes();
	}
);
