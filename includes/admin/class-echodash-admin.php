<?php

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

/**
 * Class EchoDash_Admin
 *
 * Handles the admin functionality.
 *
 * @since 1.0.0
 */
class EchoDash_Admin {

	/**
	 * Stores any data that needs to be passed to the admin scripts.
	 *
	 * @var array $localize_data
	 * @since 1.0.0
	 */
	public $localize_data = array();

	/**
	 * Constructs a new instance.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {

		add_action( 'admin_footer', array( $this, 'admin_scripts' ) );
		add_action( 'admin_menu', array( $this, 'add_settings_submenu' ), 11 );
		add_action( 'admin_init', array( $this, 'save_settings' ) );

		add_action( 'wp_ajax_ecd_send_test', array( $this, 'send_event_test' ) );
	}

	/**
	 * Send a test event using the current user data.
	 *
	 * @return void
	 */
	public function send_event_test() {

		check_ajax_referer( 'ecd_ajax_nonce', '_ajax_nonce' );

		if ( empty( $_POST['data'] ) || empty( $_POST['data']['event_name'] ) || empty( $_POST['data']['integration_name'] ) ) {
			wp_send_json_error( 'ecd_empty_data' );
		}

		$data              = $_POST['data'];
		$event_name        = sanitize_text_field( $data['event_name'] );
		$event_keys_values = $data['event_keys_values'];
		$event_data        = array();
		if ( is_array( $event_keys_values ) && ! empty( $event_keys_values ) ) {

			foreach ( $event_keys_values as $event ) {

				if ( ! empty( $event['value'] ) ) {

					$event_data[] = array(
						'key'   => sanitize_text_field( $event['key'] ),
						'value' => sanitize_text_field( $event['value'] ),
					);
				}
			}
		} else {
			$event_data = sanitize_text_field( $event_keys_values );
		}

		$event = array(
			'name'  => $event_name,
			'value' => $event_data,
		);

		echodash()->integrations->{$data['integration_name']}->track_event( $event );

		wp_send_json_success( 'success' );
	}

	/**
	 * Used by the plugin integrations to pass data to the admin scripts.
	 *
	 * @since 1.1.3
	 *
	 * @param string $integration The integration slug.
	 * @param string $trigger     The trigger ID.
	 * @param array  $options     The options.
	 */
	public function localize( $integration, $trigger, $options ) {

		if ( ! isset( $this->localize_data['triggers'] ) ) {
			$this->localize_data = array( 'triggers' => array() );
		}

		if ( ! isset( $this->localize_data['triggers'][ $integration ] ) ) {
			$this->localize_data['triggers'][ $integration ] = array();
		}

		if ( ! isset( $this->localize_data['triggers'][ $integration ][ $trigger ] ) ) {
			$this->localize_data['triggers'][ $integration ][ $trigger ] = array();
		}

		$this->localize_data['triggers'][ $integration ][ $trigger ]['options'] = $options;
	}

	/**
	 * Saves the global settings.
	 *
	 * @since 1.0.0
	 */
	public function save_settings() {

		if ( ! isset( $_POST['echodash_options'] ) ) {
			return;
		}

		if ( ! wp_verify_nonce( $_POST['echodash_options_nonce'], 'echodash_options' ) ) {
			return;
		}

		$data = wp_unslash( $_POST['echodash_options'] );

		if ( ! empty( $data ) ) {

			// Clean up empties.

			foreach ( $data as $integration => $triggers ) {

				if ( is_array( $triggers ) ) {

					foreach ( $triggers as $i => $rule ) {

						if ( empty( $rule['name'] ) && ( empty( $rule['value'] ) || empty( $rule['value'][0]['value'] ) ) ) {
							unset( $data[ $integration ][ $i ] );
						}
					}
				}
			}
		}

		if ( ! empty( $data ) ) {
			update_option( 'echodash_options', $data, true );
		} else {
			delete_option( 'echodash_options' );
		}

		add_action(
			'admin_notices',
			function () {
				echo '<div id="message" class="updated fade"><p><strong>' . esc_html__( 'Settings saved.', 'echodash' ) . '</strong></p></div>';
			}
		);
	}

	/**
	 * Add event tracking submenu page under settings.
	 *
	 * @return void
	 */
	public function add_settings_submenu() {
		add_submenu_page(
			'options-general.php',
			__( 'EchoDash', 'echodash' ),
			__( 'EchoDash', 'echodash' ),
			'manage_options',
			'echodash',
			array( $this, 'submenu_callback' )
		);
	}

	/**
	 * Submenu callback.
	 *
	 * @return void
	 */
	public function submenu_callback() {
		include_once ECHODASH_DIR_PATH . '/includes/admin/option-page.php';
	}

	/**
	 * Register scripts and styles.
	 *
	 * @since 1.0.0
	 */
	public function admin_scripts() {

		wp_register_script( 'echodash-admin', ECHODASH_DIR_URL . 'assets/echodash-admin.js', array( 'jquery', 'jquery-ui-sortable' ), ECHODASH_VERSION, true );
		wp_register_style( 'echodash-admin', ECHODASH_DIR_URL . 'assets/echodash-admin.css', array(), ECHODASH_VERSION );

		if ( 'settings_page_echodash' === get_current_screen()->id ) {

			$this->localize_data['triggers'] = array();

			// Load the various integration options for the main settings page.

			foreach ( echodash()->integrations as $slug => $integration ) {

				$this->localize_data['triggers'][ $slug ] = array();

				foreach ( $integration->get_triggers() as $trigger => $trigger_data ) {

					$this->localize_data['triggers'][ $slug ][ $trigger ] = array( 'options' => $integration->get_options( $trigger ) );

				}
			}

			// Repeater is always needed on the main settings page.
			wp_enqueue_script( 'echodash-jquery-repeater', ECHODASH_DIR_URL . 'assets/jquery-repeater/jquery.repeater.min.js', array( 'jquery' ), ECHODASH_VERSION, true );

		}

		// Integrations set $this->localize_data based on the fields specific to the integration.
		// We only want to enqueue the scripts and styles if the current page has settings on it.

		if ( ! empty( $this->localize_data ) ) {

			$this->localize_data['ajaxurl'] = admin_url( 'admin-ajax.php' );
			$this->localize_data['nonce']   = wp_create_nonce( 'ecd_ajax_nonce' );

			wp_enqueue_script( 'echodash-jquery-repeater', ECHODASH_DIR_URL . 'assets/jquery-repeater/jquery.repeater.min.js', array( 'jquery' ), ECHODASH_VERSION, true );

			wp_enqueue_style( 'echodash-admin' );
			wp_enqueue_script( 'echodash-admin' );
			wp_localize_script( 'echodash-admin', 'ecdEventData', $this->localize_data );

		}
	}
}