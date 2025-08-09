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

	/**
	 * Get all integrations.
	 *
	 * @since 2.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response The response object.
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
	 * Get single integration.
	 *
	 * @since 2.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response The response object.
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

		// Return updated integration data
		return $this->get_integration( $request );
	}

	/**
	 * Get triggers for an integration.
	 *
	 * @since 2.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response The response object.
	 */
	public function get_triggers( $request ) {
		$slug     = $request->get_param( 'slug' );
		$echodash = echodash();

		if ( ! $echodash || ! isset( $echodash->integrations[ $slug ] ) ) {
			return new WP_Error( 'integration_not_found', __( 'Integration not found', 'echodash' ), array( 'status' => 404 ) );
		}

		$integration          = $echodash->integrations[ $slug ];
		$triggers             = array();
		$single_item_triggers = array();

		// Get configured triggers from database settings
		$settings            = get_option( 'echodash_options', array() );
		$configured_triggers = array();
		if ( isset( $settings['integrations'][ $slug ]['triggers'] ) && is_array( $settings['integrations'][ $slug ]['triggers'] ) ) {
			$configured_triggers = $settings['integrations'][ $slug ]['triggers'];
		}

		// Get available trigger definitions ONCE
		$available_triggers = $integration->get_triggers();

		// Convert configured triggers to API response format
		foreach ( $configured_triggers as $trigger_id => $trigger_data ) {
			// Get trigger definition for additional metadata
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

		// Get single-item events for each trigger type (using the same $available_triggers)
		foreach ( $available_triggers as $trigger_key => $trigger_config ) {
			if ( isset( $trigger_config['has_single'] ) && $trigger_config['has_single'] ) {
				// Get single events for this trigger
				$single_events = $integration->get_single_events( $trigger_key );

				if ( ! empty( $single_events ) ) {
					// Group single events by trigger type
					$grouped_events = array();
					foreach ( $single_events as $event ) {
						// Get post title and edit URL
						$post_title = isset( $event['post_title'] ) ? $event['post_title'] : get_the_title( $event['post_id'] );
						$edit_url   = isset( $event['edit_url'] ) ? $event['edit_url'] : get_edit_post_link( $event['post_id'] ) . '#echodash';

						$grouped_events[] = array(
							'post_id'    => $event['post_id'],
							'post_title' => $post_title,
							'edit_url'   => $edit_url,
							'event_name' => $event['name'] ?? '',
							'mappings'   => $event['value'] ?? array(),
						);
					}

					if ( ! empty( $grouped_events ) ) {
						$single_item_triggers[] = array(
							'trigger'     => $trigger_key,
							'name'        => $trigger_config['name'],
							'description' => $trigger_config['description'] ?? '',
							'items'       => $grouped_events,
						);
					}
				}
			}
		}

		return rest_ensure_response(
			array(
				'triggers'             => $triggers,
				'single_item_triggers' => $single_item_triggers,
				'total'                => count( $triggers ),
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

		// Get test data for processing merge tags
		$test_data = $this->get_integration_test_data( $integration_slug, $trigger );

		// Process merge tags in event properties
		$processed_properties = array();
		if ( isset( $event_data['properties'] ) && is_array( $event_data['properties'] ) ) {
			foreach ( $event_data['properties'] as $key => $value ) {
				$processed_properties[ $key ] = $this->process_merge_tag( $value, $test_data );
			}
		}

		// Get source and trigger names (following legacy implementation pattern)
		$source_name  = $integration->name;
		$trigger_name = $integration->get_trigger_name( $trigger );

		// Track test event with processed parameters
		$result = echodash_track_event( $event_data['name'], $processed_properties, $source_name, $trigger_name );

		if ( $result ) {
			return rest_ensure_response(
				array(
					'success'        => true,
					'message'        => __( 'Test event sent successfully', 'echodash' ),
					'processed_data' => $processed_properties, // Include processed data for debugging
				)
			);
		} else {
			return new WP_Error( 'event_send_failed', __( 'Failed to send test event', 'echodash' ), array( 'status' => 500 ) );
		}
	}

	/**
	 * Prepare integration data for response.
	 *
	 * @since 2.0.0
	 *
	 * @param EchoDash_Integration $integration The integration object.
	 * @param string               $slug        The integration slug.
	 * @param bool                 $detailed    Whether to include detailed data.
	 * @return array The integration data.
	 */
	private function prepare_integration_for_response( $integration, $slug, $detailed = false ) {
		// Get configured triggers count from database
		$settings                 = get_option( 'echodash_options', array() );
		$configured_trigger_count = 0;
		if ( isset( $settings['integrations'][ $slug ]['triggers'] ) && is_array( $settings['integrations'][ $slug ]['triggers'] ) ) {
			$configured_trigger_count = count( $settings['integrations'][ $slug ]['triggers'] );
		}

		// Get available trigger definitions ONCE (we always need this to calculate accurate trigger count)
		$available_triggers = $integration->get_triggers();
		$single_item_count  = 0;

		// Add count of single-item events
		foreach ( $available_triggers as $trigger_key => $trigger_config ) {
			if ( isset( $trigger_config['has_single'] ) && $trigger_config['has_single'] ) {
				$single_events      = $integration->get_single_events( $trigger_key );
				$single_item_count += count( $single_events );
			}
		}

		$total_trigger_count = $configured_trigger_count + $single_item_count;

		$data = array(
			'slug'         => $slug,
			'name'         => $integration->name,
			'icon'         => $this->get_integration_icon( $slug ),
			'triggerCount' => $total_trigger_count,
		);

		if ( $detailed ) {
			$data['triggers'] = array();

			// Get configured triggers from database settings
			$configured_triggers = array();
			if ( isset( $settings['integrations'][ $slug ]['triggers'] ) && is_array( $settings['integrations'][ $slug ]['triggers'] ) ) {
				$configured_triggers = $settings['integrations'][ $slug ]['triggers'];
			}

			// Convert configured triggers to API response format (reusing $available_triggers)
			foreach ( $configured_triggers as $trigger_id => $trigger_data ) {
				// Get trigger definition for additional metadata
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

			$data['settings'] = $this->get_integration_settings( $slug );
		}

		return $data;
	}

	/**
	 * Get integration icon.
	 *
	 * @since 2.0.0
	 *
	 * @param string $slug The integration slug.
	 * @return string The integration icon.
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
	 * Get integration settings.
	 *
	 * @since 2.0.0
	 *
	 * @param string $slug The integration slug.
	 * @return array The integration settings.
	 */
	private function get_integration_settings( $slug ) {
		$settings = get_option( 'echodash_options', array() );
		return isset( $settings['integrations'][ $slug ] ) ? $settings['integrations'][ $slug ] : array();
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

	/**
	 * Check if a given request has access to get integrations.
	 *
	 * @since 2.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return bool Whether the user has access.
	 */
	public function get_integrations_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to get a single integration.
	 *
	 * @since 2.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return bool Whether the user has access.
	 */
	public function get_integration_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

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

	/**
	 * Check if a given request has access to get triggers.
	 *
	 * @since 2.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return bool Whether the user has access.
	 */
	public function get_triggers_permissions_check( $request ) {
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
