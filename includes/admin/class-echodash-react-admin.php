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

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class EchoDash_React_Admin {

	/**
	 * Initialize the React admin interface
	 */
	public function __construct() {

		// Core hooks
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_react_assets' ) );

		// Performance and monitoring hooks
		add_action( 'wp_ajax_ecd_log_client_event', array( $this, 'handle_client_logging' ) );

		// Asset optimization hooks
		add_filter( 'script_loader_tag', array( $this, 'add_script_attributes' ), 10, 3 );
		// Temporarily disabled preload to debug script execution issue
		// add_action( 'admin_print_scripts', array( $this, 'preload_critical_assets' ) );
	}

	/**
	 * Enqueue React assets with performance optimization
	 */
	public function enqueue_react_assets( $hook ) {
		// Only load on EchoDash settings page
		if ( 'settings_page_echodash' !== $hook ) {
			return;
		}

		// Load asset file
		$asset_file = include ECHODASH_DIR_PATH . 'assets/dist/index.asset.php';

		// Enqueue vendor chunks first (if they exist)
		$this->enqueue_vendor_chunks( $asset_file );

		// Enqueue main React script with optimization
		wp_enqueue_script(
			'echodash-react',
			ECHODASH_DIR_URL . 'assets/dist/index.js',
			$asset_file['dependencies'],
			$asset_file['version'],
			true
		);

		// Script attributes are already handled by add_script_attributes method in constructor

		// Enqueue React styles with media optimization
		wp_enqueue_style(
			'echodash-react',
			ECHODASH_DIR_URL . 'assets/dist/index.css',
			array( 'wp-components' ),
			$asset_file['version']
		);

		// Enqueue WordPress component styles
		wp_enqueue_style( 'wp-components' );

		// Localize script data with caching
		$localized_data = $this->get_localized_data();
		wp_localize_script( 'echodash-react', 'ecdReactData', $localized_data );
	}

	/**
	 * Enqueue vendor chunks for better caching
	 */
	private function enqueue_vendor_chunks( $asset_file ) {
		// Check for vendor chunk
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

		// Check for WordPress chunk
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
	 * Get localized data for React app with caching
	 */
	private function get_localized_data() {

		$localized_data = array(
			// API Configuration
			'apiUrl'       => rest_url( 'echodash/v1/' ),
			'nonce'        => wp_create_nonce( 'wp_rest' ),

			// User Data
			'currentUser'  => array(
				'ID'           => get_current_user_id(),
				'display_name' => wp_get_current_user()->display_name,
				'user_email'   => wp_get_current_user()->user_email,
				'roles'        => wp_get_current_user()->roles,
				'capabilities' => array(
					'manage_options' => current_user_can( 'manage_options' ),
				),
			),

			// Integrations Data
			'integrations' => $this->get_integrations_data(),

			// Settings and Configuration
			'settings'     => $this->get_settings_data(),

			// Environment and Debug
			'environment'  => array(
				'debugMode'     => defined( 'WP_DEBUG' ) && WP_DEBUG,
				'wpVersion'     => get_bloginfo( 'version' ),
				'pluginVersion' => ECHODASH_VERSION,
				'adminUrl'      => admin_url(),
				'assetsUrl'     => ECHODASH_DIR_URL . 'assets/',
			),

			// Internationalization
			'i18n'         => array(
				'loading'           => __( 'Loading...', 'echodash' ),
				'error'             => __( 'Error', 'echodash' ),
				'success'           => __( 'Success', 'echodash' ),
				'saving'            => __( 'Saving...', 'echodash' ),
				'saved'             => __( 'Saved', 'echodash' ),
				'cancel'            => __( 'Cancel', 'echodash' ),
				'delete'            => __( 'Delete', 'echodash' ),
				'edit'              => __( 'Edit', 'echodash' ),
				'add'               => __( 'Add', 'echodash' ),
				'remove'            => __( 'Remove', 'echodash' ),
				'confirm'           => __( 'Confirm', 'echodash' ),
				'confirmDelete'     => __( 'Are you sure you want to delete this item?', 'echodash' ),
				'noResults'         => __( 'No results found', 'echodash' ),
				'searchPlaceholder' => __( 'Search...', 'echodash' ),
			),
		);

		return $localized_data;
	}

	/**
	 * Get settings data for React app
	 */
	private function get_settings_data() {
		return array(
			'endpoint'    => get_option( 'echodash_endpoint', '' ),
			'options'     => get_option( 'echodash_options', array() ),
			'isConnected' => ! empty( get_option( 'echodash_endpoint', '' ) ),
		);
	}

	/**
	 * Get bundle size information
	 */
	private function get_bundle_size() {
		$js_file  = ECHODASH_DIR_PATH . 'assets/dist/index.js';
		$css_file = ECHODASH_DIR_PATH . 'assets/dist/index.css';

		$sizes = array(
			'js'  => file_exists( $js_file ) ? filesize( $js_file ) : 0,
			'css' => file_exists( $css_file ) ? filesize( $css_file ) : 0,
		);

		$sizes['total']     = $sizes['js'] + $sizes['css'];
		$sizes['formatted'] = array(
			'js'    => size_format( $sizes['js'] ),
			'css'   => size_format( $sizes['css'] ),
			'total' => size_format( $sizes['total'] ),
		);

		return $sizes;
	}

	/**
	 * Render React container with loading states
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
		// Performance monitoring
		if (window.performance && window.performance.mark) {
			window.performance.mark('echodash-react-start');
		}
		
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
	 * Handle client-side logging
	 */
	public function handle_client_logging() {
		check_ajax_referer( 'wp_rest', 'nonce' );

		$level   = sanitize_text_field( $_POST['level'] ?? 'info' );
		$message = sanitize_text_field( $_POST['message'] ?? '' );
		$context = sanitize_text_field( $_POST['context'] ?? 'react-app' );

		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( sprintf( '[EchoDash React] [%s] %s (Context: %s)', strtoupper( $level ), $message, $context ) );
		}

		wp_send_json_success();
	}

	/**
	 * Add script attributes for performance optimization
	 */
	public function add_script_attributes( $tag, $handle, $src ) {
		// Add defer to non-critical scripts only
		if ( in_array( $handle, array( 'echodash-vendors', 'echodash-wordpress' ), true ) ) {
			$tag = str_replace( ' src', ' defer src', $tag );
		}

		// Don't defer the main React script - let it load normally after dependencies
		// if ( 'echodash-react' === $handle ) {
		// $tag = str_replace( ' src', ' defer src', $tag );
		// }

		return $tag;
	}

	/**
	 * Preload critical assets
	 */
	public function preload_critical_assets() {

		$asset_file_path = ECHODASH_DIR_PATH . 'assets/dist/index.asset.php';
		if ( ! file_exists( $asset_file_path ) ) {
			return;
		}

		$asset_file = include $asset_file_path;

		// Preload main JS file
		echo '<link rel="preload" href="' . esc_url( ECHODASH_DIR_URL . 'assets/dist/index.js' ) . '" as="script">' . "\n";

		// Preload main CSS file
		echo '<link rel="preload" href="' . esc_url( ECHODASH_DIR_URL . 'assets/dist/index.css' ) . '" as="style">' . "\n";

		// Preload vendor chunks if they exist
		if ( file_exists( ECHODASH_DIR_PATH . 'assets/dist/vendors.js' ) ) {
			echo '<link rel="preload" href="' . esc_url( ECHODASH_DIR_URL . 'assets/dist/vendors.js' ) . '" as="script">' . "\n";
		}
	}

	/**
	 * Handle missing assets gracefully
	 */
	private function handle_missing_assets() {
		if ( current_user_can( 'manage_options' ) ) {
			add_action(
				'admin_notices',
				function () {
					echo '<div class="notice notice-error"><p>';
					echo esc_html__( 'EchoDash React assets are missing. Please run "npm run build" to generate them.', 'echodash' );
					echo '</p></div>';
				}
			);
		}

		// Log error for debugging
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( 'EchoDash: React asset file missing at ' . ECHODASH_DIR_PATH . 'assets/dist/index.asset.php' );
		}
	}

	/**
	 * Get integrations data with full trigger information
	 */
	private function get_integrations_data() {
		$echodash     = echodash();
		$integrations = array();

		if ( ! $echodash || ! isset( $echodash->integrations ) ) {
			return $integrations;
		}

		$settings = get_option( 'echodash_options', array() );

		foreach ( $echodash->integrations as $slug => $integration ) {
			$configured_triggers = 0;
			$triggers            = array();
			$available_triggers  = array();

			// Count configured triggers
			if ( ! empty( $settings[ $slug ] ) && is_array( $settings[ $slug ] ) ) {
				$configured_triggers = count( $settings[ $slug ] );
			}

			foreach ( $integration->get_triggers() as $trigger_id => $trigger_config ) {
				$available_triggers[] = array(
					'id'           => $trigger_id,
					'name'         => $trigger_config['name'] ?? $trigger_id,
					'description'  => $trigger_config['description'] ?? '',
					'defaultEvent' => $integration->get_defaults( $trigger_id ),
					'options'      => $integration->get_options( $trigger_id ),
				);
			}

			$integrations[] = array(
				'slug'                => $slug,
				'name'                => $integration->name,
				'icon'                => $integration->get_icon(),
				'iconBackgroundColor' => $integration->get_icon_background_color(),
				'triggerCount'        => $configured_triggers,
				'enabled'             => $configured_triggers > 0,
				'triggers'            => $triggers,
				'availableTriggers'   => $available_triggers,
			);
		}

		return $integrations;
	}
}

// Initialize React admin if in admin area
if ( is_admin() ) {
	new EchoDash_React_Admin();
}
