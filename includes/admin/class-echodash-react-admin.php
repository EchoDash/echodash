<?php
/**
 * EchoDash React Admin Integration
 *
 * Handles the integration of the React admin interface with WordPress.
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
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_react_assets' ) );
		add_action( 'admin_footer', array( $this, 'render_react_container' ) );
	}

	/**
	 * Enqueue React assets
	 */
	public function enqueue_react_assets( $hook ) {
		// Only load on EchoDash settings page
		if ( 'settings_page_echodash' !== $hook ) {
			return;
		}

		// Check if React interface is enabled
		if ( ! $this->should_use_react_ui() ) {
			return;
		}

		$asset_file = include ECHODASH_DIR_PATH . 'assets/dist/index.asset.php';

		// Enqueue React script
		wp_enqueue_script(
			'echodash-react',
			ECHODASH_DIR_URL . 'assets/dist/index.js',
			$asset_file['dependencies'],
			$asset_file['version'],
			true
		);

		// Enqueue React styles
		wp_enqueue_style(
			'echodash-react',
			ECHODASH_DIR_URL . 'assets/dist/index.css',
			array( 'wp-components' ),
			$asset_file['version']
		);

		// Localize script data
		wp_localize_script(
			'echodash-react',
			'ecdReactData',
			array(
				'apiUrl'       => rest_url( 'echodash/v1/' ),
				'nonce'        => wp_create_nonce( 'wp_rest' ),
				'integrations' => $this->get_integrations_data(),
				'currentUser'  => array(
					'id'    => get_current_user_id(),
					'name'  => wp_get_current_user()->display_name,
					'email' => wp_get_current_user()->user_email,
				),
				'debugMode'    => defined( 'WP_DEBUG' ) && WP_DEBUG,
			)
		);
	}

	/**
	 * Render React container div
	 */
	public function render_react_container() {
		$screen = get_current_screen();

		if ( 'settings_page_echodash' !== $screen->id ) {
			return;
		}

		if ( ! $this->should_use_react_ui() ) {
			return;
		}

		echo '<div id="echodash-react-app"></div>';
	}

	/**
	 * Check if React UI should be used
	 */
	private function should_use_react_ui() {
		// For Phase 1, this is a simple check
		// In later phases, this will check feature flags and user preferences
		return defined( 'ECHODASH_USE_REACT' ) && ECHODASH_USE_REACT;
	}

	/**
	 * Get integrations data for React app
	 */
	private function get_integrations_data() {
		// Get all integrations from the main EchoDash instance
		$echodash     = echodash();
		$integrations = array();

		if ( ! $echodash || ! isset( $echodash->integrations ) ) {
			return $integrations;
		}

		foreach ( $echodash->integrations as $slug => $integration ) {
			$integrations[] = array(
				'slug'         => $slug,
				'name'         => $integration->name,
				'icon'         => '', // Will be populated in later phases
				'triggerCount' => count( $integration->triggers ),
				'enabled'      => $integration->is_active(),
				'triggers'     => array(), // Will be populated when needed
				'isActive'     => $integration->is_active(),
				'description'  => '', // Will be added in later phases
			);
		}

		return $integrations;
	}
}

// Initialize React admin if in admin area
if ( is_admin() ) {
	new EchoDash_React_Admin();
}
