<?php
/**
 * EchoDash React Admin Integration
 *
 * Handles the integration of the React admin interface with WordPress.
 * Includes advanced asset enqueueing, performance optimization, and feature flag integration.
 *
 * @package EchoDash
 * @since 2.0.0
 */

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * EchoDash React Admin class.
 *
 * @since 2.0.0
 */
class EchoDash_React_Admin {

	/**
	 * Initialize the React admin interface.
	 */
	public function __construct() {

		// Core hooks.
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_react_assets' ) );
		add_action( 'admin_menu', array( $this, 'add_settings_submenu' ) );

		// Asset optimization hooks.
		add_filter( 'script_loader_tag', array( $this, 'add_script_attributes' ), 10, 2 );
	}


	/**
	 * Add EchoDash submenu page under settings.
	 *
	 * @since 2.0.0
	 */
	public function add_settings_submenu() {
		add_submenu_page(
			'options-general.php',
			__( 'EchoDash', 'echodash' ),
			__( 'EchoDash', 'echodash' ),
			'manage_options',
			'echodash',
			array( $this, 'render_react_container' )
		);
	}

	/**
	 * Enqueue React assets with performance optimization.
	 *
	 * @since 2.0.0
	 *
	 * @param string $hook The current admin page hook.
	 */
	public function enqueue_react_assets( $hook ) {
		// Only load on EchoDash settings page.
		if ( 'settings_page_echodash' !== $hook ) {
			return;
		}

		// Load asset file.
		$asset_path = ECHODASH_DIR_PATH . 'assets/dist/index.asset.php';
		if ( ! file_exists( $asset_path ) ) {
			return;
		}
		$asset_file = include $asset_path;

		// Enqueue vendor chunks first (if they exist).
		$this->enqueue_vendor_chunks( $asset_file );

		// Enqueue main React script with optimization.
		wp_enqueue_script(
			'echodash-react',
			ECHODASH_DIR_URL . 'assets/dist/index.js',
			$asset_file['dependencies'],
			$asset_file['version'],
			true
		);

		// Set script translations for React app.
		wp_set_script_translations( 'echodash-react', 'echodash', ECHODASH_DIR_PATH . 'languages' );

		// Enqueue React styles with media optimization.
		wp_enqueue_style(
			'echodash-react',
			ECHODASH_DIR_URL . 'assets/dist/index.css',
			array( 'wp-components' ),
			$asset_file['version']
		);

		// Enqueue WordPress component styles.
		wp_enqueue_style( 'wp-components' );

		// Localize script data with caching.
		$localized_data = $this->get_localized_data();
		wp_localize_script( 'echodash-react', 'ecdReactData', $localized_data );
	}

	/**
	 * Enqueue vendor chunks for better caching.
	 *
	 * @since 2.0.0
	 *
	 * @param array $asset_file The asset file data.
	 */
	private function enqueue_vendor_chunks( $asset_file ) {
		// Check for vendor chunk.
		$vendor_js = ECHODASH_DIR_PATH . 'assets/dist/vendors.js';
		if ( file_exists( $vendor_js ) ) {
			wp_enqueue_script(
				'echodash-vendors',
				ECHODASH_DIR_URL . 'assets/dist/vendors.js',
				array(),
				$asset_file['version'],
				true
			);
		}

		// Check for WordPress chunk.
		$wp_js = ECHODASH_DIR_PATH . 'assets/dist/wordpress.js';
		if ( file_exists( $wp_js ) ) {
			wp_enqueue_script(
				'echodash-wordpress',
				ECHODASH_DIR_URL . 'assets/dist/wordpress.js',
				array( 'wp-element', 'wp-components', 'wp-api-fetch' ),
				$asset_file['version'],
				true
			);
		}
	}

	/**
	 * Get localized data for React app with caching.
	 *
	 * @since 2.0.0
	 */
	private function get_localized_data() {

		$integrations_data = $this->get_integrations_data();

		// Build userTriggers structure - single source of truth for all trigger data.
		$user_triggers = array();
		foreach ( $integrations_data as $integration ) {
			$user_triggers[ $integration['slug'] ] = array(
				'global'     => $integration['triggers'], // Global triggers (configured via UI).
				'singleItem' => $integration['singleItemTriggers'], // Single-item triggers (per post/form/etc).
			);
		}

		// Clean integrations data - remove duplicated trigger data.
		$clean_integrations = array();
		foreach ( $integrations_data as $integration ) {
			$clean_integrations[] = array(
				'slug'                => $integration['slug'],
				'name'                => $integration['name'],
				'icon'                => $integration['icon'],
				'iconBackgroundColor' => $integration['iconBackgroundColor'],
				'triggerCount'        => $integration['triggerCount'],
				'enabled'             => $integration['enabled'],
				'availableTriggers'   => $integration['availableTriggers'], // Available trigger definitions.
			);
		}

		$localized_data = array(
			// API Configuration.
			'apiUrl'       => rest_url( 'echodash/v1/' ),
			'nonce'        => wp_create_nonce( 'wp_rest' ),

			// User Data.
			'currentUser'  => array(
				'ID'           => get_current_user_id(),
				'display_name' => wp_get_current_user()->display_name,
				'user_email'   => wp_get_current_user()->user_email,
				'roles'        => wp_get_current_user()->roles,
				'capabilities' => array(
					'manage_options' => current_user_can( 'manage_options' ),
				),
			),

			// Clean Integrations Data (without duplicated triggers).
			'integrations' => $clean_integrations,

			// Single source of truth for user-configured triggers.
			'userTriggers' => $user_triggers,

			// Settings and Configuration (without trigger duplication).
			'settings'     => array(
				'endpoint'    => get_option( 'echodash_endpoint', '' ),
				'isConnected' => ! empty( get_option( 'echodash_endpoint', '' ) ),
				'connectUrl'  => echodash()->admin->get_connect_url(),
			),

			// Environment and Debug.
			'environment'  => array(
				'debugMode'     => defined( 'WP_DEBUG' ) && WP_DEBUG,
				'wpVersion'     => get_bloginfo( 'version' ),
				'pluginVersion' => ECHODASH_VERSION,
				'adminUrl'      => admin_url(),
				'assetsUrl'     => ECHODASH_DIR_URL . 'assets/',
			),
		);

		return $localized_data;
	}

	/**
	 * Render React container with loading states.
	 *
	 * @since 2.0.0
	 */
	public function render_react_container() {
		$screen = get_current_screen();

		if ( 'settings_page_echodash' !== $screen->id ) {
			return;
		}

		?>
		<div id="echodash-react-app" class="echodash-react-app">
			<div class="echodash-loading" id="echodash-loading">
				<div class="spinner is-active"></div>
				<p><?php esc_html_e( 'Loading EchoDash...', 'echodash' ); ?></p>
			</div>
		</div>
		
		<style>
		.echodash-react-app {
			min-height: 400px;
			position: relative;
		}
		
		.echodash-loading {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			height: 400px;
			color: #666;
		}
		
		.echodash-loading .spinner {
			margin-bottom: 20px;
		}
		
		/* Hide loading when React app is ready */
		.echodash-react-app.loaded .echodash-loading {
			display: none;
		}
		</style>

		<script>
		
		// Timeout fallback
		setTimeout(function() {
			const loading = document.getElementById('echodash-loading');
			if (loading && loading.style.display !== 'none') {
				loading.innerHTML = '<p><?php esc_html_e( 'Loading is taking longer than expected. Please refresh the page.', 'echodash' ); ?></p>';
			}
		}, 10000);
		</script>
		<?php
	}

	/**
	 * Add script attributes for performance optimization.
	 *
	 * @since 2.0.0
	 *
	 * @param string $tag    The script tag HTML.
	 * @param string $handle The script handle.
	 * @return string The modified script tag.
	 */
	public function add_script_attributes( $tag, $handle ) {
		// Add defer to non-critical scripts only.
		if ( in_array( $handle, array( 'echodash-vendors', 'echodash-wordpress' ), true ) ) {
			$tag = str_replace( ' src', ' defer src', $tag );
		}

		return $tag;
	}


	/**
	 * Get integrations data with full trigger information.
	 *
	 * @since 2.0.0
	 */
	private function get_integrations_data() {
		$echodash     = echodash();
		$integrations = array();
		$needs_update = false;

		if ( ! $echodash || ! isset( $echodash->integrations ) ) {
			return $integrations;
		}

		$settings = get_option( 'echodash_options', array() );

		foreach ( $echodash->integrations as $slug => $integration ) {
			$configured_triggers  = 0;
			$triggers             = array();
			$available_triggers   = array();
			$single_item_triggers = array();
			$single_item_count    = 0;

			// Migrate v1 settings storage to v2.
			if ( isset( $settings[ $slug ] ) ) {

				if ( ! isset( $settings['integrations'][ $slug ] ) ) {
					$settings['integrations'][ $slug ] = array();
				}

				if ( ! isset( $settings['integrations'][ $slug ]['triggers'] ) ) {
					$settings['integrations'][ $slug ]['triggers'] = array();
				}

				foreach ( $settings[ $slug ] as $trigger_data ) {
					$id                       = $trigger_data['trigger'] . '_' . uniqid( '', true );
					$trigger_data['mappings'] = $trigger_data['value'];
					unset( $trigger_data['value'] );
					$settings['integrations'][ $slug ]['triggers'][ $id ] = $trigger_data;
				}

				unset( $settings[ $slug ] );

				$needs_update = true;

			}

			// Load configured triggers from the correct settings path.
			$configured_trigger_data = array();
			if ( isset( $settings['integrations'][ $slug ]['triggers'] ) && is_array( $settings['integrations'][ $slug ]['triggers'] ) ) {
				$configured_trigger_data = $settings['integrations'][ $slug ]['triggers'];
				$configured_triggers     = count( $configured_trigger_data );
			}

			// Convert configured triggers to React-compatible format.
			foreach ( $configured_trigger_data as $trigger_id => $trigger_data ) {
				$triggers[] = array(
					'id'         => $trigger_id,
					'name'       => $trigger_data['name'] ?? $trigger_id,
					'trigger'    => $trigger_data['trigger'] ?? $trigger_id,
					'event_name' => $trigger_data['event_name'] ?? $trigger_data['name'] ?? '',
					'mappings'   => $trigger_data['mappings'] ?? array(),
				);
			}

			// Get single-item events for each trigger type.
			$available_trigger_definitions = $integration->get_triggers();
			foreach ( $available_trigger_definitions as $trigger_key => $trigger_config ) {
				if ( isset( $trigger_config['has_single'] ) && $trigger_config['has_single'] ) {
					// Get single events for this trigger.
					$single_events = $integration->get_single_events( $trigger_key );

					if ( ! empty( $single_events ) ) {
						// Count single events for the total.
						$single_item_count += count( $single_events );

						// Group single events by trigger type.
						$grouped_events = array();
						foreach ( $single_events as $event ) {
							// Get post title and edit URL.
							$post_title = isset( $event['post_title'] ) ? $event['post_title'] : get_the_title( $event['post_id'] );
							if ( isset( $event['edit_url'] ) ) {
								$edit_url = $event['edit_url'];
							} else {
								$edit_link = get_edit_post_link( $event['post_id'], 'raw' );
								$edit_url  = $edit_link ? $edit_link . '#echodash' : '';
							}

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

			// Calculate total trigger count (global + single-item).
			$total_trigger_count = $configured_triggers + $single_item_count;

			// Get available trigger definitions.
			foreach ( $available_trigger_definitions as $trigger_id => $trigger_config ) {
				$available_triggers[] = array(
					'id'           => $trigger_id,
					'name'         => $trigger_config['name'] ?? $trigger_id,
					'description'  => $trigger_config['description'] ?? '',
					'defaultEvent' => $integration->get_defaults( $trigger_id ),
					'options'      => $integration->get_options( $trigger_id ),
				);

				// Add description to configured triggers if available.
				foreach ( $triggers as &$configured_trigger ) {
					if ( $configured_trigger['trigger'] === $trigger_id && empty( $configured_trigger['description'] ) ) {
						$configured_trigger['description'] = $trigger_config['description'] ?? '';
					}
				}
			}

			$integrations[] = array(
				'slug'                => $slug,
				'name'                => $integration->name,
				'icon'                => $integration->get_icon(),
				'iconBackgroundColor' => $integration->get_icon_background_color(),
				'triggerCount'        => $total_trigger_count,
				'enabled'             => $total_trigger_count > 0,
				'triggers'            => $triggers,
				'availableTriggers'   => $available_triggers,
				'singleItemTriggers'  => $single_item_triggers,
			);
		}

		// Update the options after migrating to 2.0.
		if ( $needs_update ) {
			update_option( 'echodash_options', $settings );
		}

		// Sort integrations alphabetically by name.
		usort(
			$integrations,
			function ( $a, $b ) {
				return strcasecmp( $a['name'], $b['name'] );
			}
		);

		return $integrations;
	}
}

// Initialize React admin if in admin area.
if ( is_admin() ) {
	new EchoDash_React_Admin();
}
