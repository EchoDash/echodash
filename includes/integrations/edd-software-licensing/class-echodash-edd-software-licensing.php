<?php
/**
 * EDD Software Licensing integration.
 *
 * @package EchoDash
 */

defined( 'ABSPATH' ) || exit;

/**
 * Easy Digital Downloads integration.
 *
 * @since 1.0.0
 */
class EchoDash_EDD_Software_Licensing extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since 1.0.0
	 * @var string $slug
	 */

	public $slug = 'edd-software-licensing';

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 1.0.0
	 * @var string $name
	 */
	public $name = 'Easy Digital Downloads Software Licensing';

	/**
	 * The icon background color for EchoDash's module tracking.
	 *
	 * @since 2.0.0
	 * @var string $icon_background_color
	 */
	protected $icon_background_color = '#35495c';

	/**
	 * Get things started.
	 *
	 * @since 1.0.0
	 */
	public function init() {

		add_action( 'edd_sl_activate_license', array( $this, 'activate_license' ), 10, 2 );
		add_action( 'edd_sl_deactivate_license', array( $this, 'deactivate_license' ), 10, 2 );
		add_action( 'edd_sl_download_package_url', array( $this, 'package_download' ), 10, 3 );

		add_action( 'echodash_edd_meta_box', array( $this, 'meta_box_callback' ) );
	}

	/**
	 * Gets the triggers for the integration.
	 *
	 * @access protected
	 *
	 * @since  1.0.0
	 *
	 * @return array The triggers.
	 */
	protected function setup_triggers() {

		$triggers = array(
			'license_activated'   => array(
				'name'         => __( 'License Activated', 'echodash' ),
				'description'  => __( 'Triggered whenever a license key is activated on a site.', 'echodash' ),
				'has_single'   => true,
				'post_types'   => array( 'download' ),
				'has_global'   => true,
				'option_types' => array( 'license', 'download' ),
			),
			'license_deactivated' => array(
				'name'         => __( 'License Deactivated', 'echodash' ),
				'description'  => __( 'Triggered whenever a license key is deactivated on a site.', 'echodash' ),
				'has_single'   => true,
				'post_types'   => array( 'download' ),
				'has_global'   => true,
				'option_types' => array( 'license', 'download' ),
			),
			'installed_update'    => array(
				'name'         => __( 'Installed Update', 'echodash' ),
				'description'  => __( 'Triggered when a plugin update is downloaded onto the remote site.', 'echodash' ),
				'has_single'   => true,
				'post_types'   => array( 'download' ),
				'has_global'   => true,
				'option_types' => array( 'license', 'download' ),
			),
		);

		return $triggers;
	}

	/**
	 * Override the add_meta_boxes function in the parent class.
	 *
	 * @since 1.2.0
	 */
	public function add_meta_boxes() {}

	/**
	 * Triggered when a license is activated.
	 *
	 * @since 1.0.0
	 *
	 * @param int $license_id  The license ID.
	 * @param int $download_id The download ID.
	 */
	public function activate_license( $license_id, $download_id ) {
		$this->track_event(
			'license_activated',
			array(
				'download' => $download_id,
				'license'  => $license_id,
			)
		);
	}

	/**
	 * Triggered when a license is deactivated.
	 *
	 * @since 1.0.0
	 *
	 * @param int $license_id  The license ID.
	 * @param int $download_id The download ID.
	 */
	public function deactivate_license( $license_id, $download_id ) {
		$this->track_event(
			'license_deactivated',
			array(
				'download' => $download_id,
				'license'  => $license_id,
			)
		);
	}

	/**
	 * Triggered when an update package is delivered.
	 *
	 * @since  1.0.0
	 *
	 * @param  string $file_url    The file url.
	 * @param  int    $download_id The download ID.
	 * @param  string $license_key The license key.
	 * @return string The download file URL.
	 */
	public function package_download( $file_url, $download_id, $license_key ) {
		$license = edd_software_licensing()->get_license( $license_key );

		$this->track_event(
			'installed_update',
			array(
				'download' => $download_id,
				'license'  => $license->ID,
			)
		);

		return $file_url;
	}


	/**
	 * Gets the download options.
	 *
	 * @since  1.0.0
	 *
	 * @return array The download options.
	 */
	public function get_license_options() {

		return array(
			'name'    => __( 'License', 'echodash' ),
			'type'    => 'license',
			'options' => array(
				array(
					'meta'        => 'license_key',
					'preview'     => 'b5f9254fd2eb24216f718aff8eb63309',
					'placeholder' => __( 'The license key', 'echodash' ),
				),
				array(
					'meta'        => 'status',
					'preview'     => 'active',
					'placeholder' => __( 'The license status', 'echodash' ),
				),
				array(
					'meta'        => 'activation_count',
					'preview'     => '1',
					'placeholder' => __( 'The license activation count', 'echodash' ),
				),
				array(
					'meta'        => 'expiration',
					'preview'     => gmdate( 'Y-m-d', strtotime( '+1 year' ) ),
					'placeholder' => __( 'The license expiration date', 'echodash' ),
				),
				array(
					'meta'        => 'site_url',
					'preview'     => 'https://example.com',
					'placeholder' => __( 'The site URL the license was activated/deactivated on', 'echodash' ),
				),
				array(
					'meta'        => 'version_number',
					'preview'     => '1.0.0',
					'placeholder' => __( 'The version number the plugin was updated to', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Gets the details from the license for merging.
	 *
	 * @since  1.0.0
	 *
	 * @param  int $license_id The license ID.
	 * @return array The product variables.
	 */
	public function get_license_vars( $license_id = false ) {

		$license = edd_software_licensing()->get_license( $license_id );

		if ( ! empty( $license->ID ) ) {

			$vars = array(
				'license' => array(
					'license_key'      => $license->license_key,
					'status'           => $license->status,
					'activation_count' => $license->activation_count,
					'expiration'       => $license->expiration,
					'site_url'         => ! empty( $license->sites ) ? $license->sites[0] : false,
				),
			);

			if ( isset( $_REQUEST['url'] ) ) {

				// If we're activating / deactivating a URL, grab it.// If we're activating / deactivating a URL, grab it.
				$vars['license']['site_url'] = sanitize_url( sanitize_text_field( wp_unslash( $_REQUEST['url'] ) ) );

			} elseif ( isset( $_SERVER['HTTP_USER_AGENT'] ) ) {

				$user_agent = sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) );

				if ( false !== strpos( $user_agent, 'WordPress' ) ) {

					// Installing an update. The user agent will be like "WordPress/5.4.2; https://example.com".
					$parts                       = explode( ';', $user_agent );
					$vars['license']['site_url'] = sanitize_url( trim( $parts[1] ) );

				}
			}

			$download = new EDD_SL_Download( $license->download_id );

			$vars['license']['version_number'] = $download->get_version();

		} else {

			// In the admin preview, $license_id is the download ID.

			$download = new EDD_SL_Download( $license_id );

			$vars = array(
				'license' => array(
					'version_number' => $download->get_version(),
				),
			);

		}

		return $vars;
	}
}

new EchoDash_EDD_Software_Licensing();
