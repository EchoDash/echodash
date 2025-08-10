<?php
/**
 * WordPress core integration for EchoDash.
 *
 * @package EchoDash
 */

defined( 'ABSPATH' ) || exit;

/**
 * WordPress core integration.
 *
 * @since 1.1.0
 */
class EchoDash_WordPress extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since 1.1.0
	 * @var string $slug
	 */
	public $slug = 'wordpress'; // phpcs:disable WordPress.WP.CapitalPDangit.MisspelledInText

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 1.1.0
	 * @var string $name
	 */
	public $name = 'WordPress';

	/**
	 * Get things started.
	 *
	 * @since 1.1.0
	 */
	public function init() {
		add_action( 'upgrader_process_complete', array( $this, 'upgrader_process_complete' ), 10, 2 );
	}

	/**
	 * Gets the triggers for the integration.
	 *
	 * @access protected
	 *
	 * @since  1.1.0
	 *
	 * @return array The triggers.
	 */
	protected function setup_triggers() {
		$triggers = array(
			'core_updated'   => array(
				'name'               => __( 'WordPress Core Updated', 'echodash' ),
				'description'        => __( 'Triggered when WordPress core is updated.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'wordpress' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => __( 'WordPress Core Update', 'echodash' ),
					'mappings' => array(
						'old_version' => '{wordpress:old_version}',
						'new_version' => '{wordpress:new_version}',
					),
				),
			),
			'plugin_updated' => array(
				'name'               => __( 'Plugin Updated', 'echodash' ),
				'description'        => __( 'Triggered when a plugin is updated.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'wordpress' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => __( 'Plugin Update', 'echodash' ),
					'mappings' => array(
						'plugin_name'        => '{wordpress:plugin_name}',
						'plugin_description' => '{wordpress:plugin_description}',
						'old_version'        => '{wordpress:old_version}',
						'new_version'        => '{wordpress:new_version}',
					),
				),
			),
		);

		return $triggers;
	}

	/**
	 * Gets the WordPress options.
	 *
	 * @since  1.1.0
	 *
	 * @return array The WordPress options.
	 */
	public function get_wordpress_options() {
		return array(
			'name'    => __( 'WordPress', 'echodash' ),
			'type'    => 'wordpress',
			'options' => array(
				array(
					'meta'        => 'old_version',
					'preview'     => '6.3.2',
					'placeholder' => __( 'The previous version', 'echodash' ),
				),
				array(
					'meta'        => 'new_version',
					'preview'     => '6.4.0',
					'placeholder' => __( 'The new version', 'echodash' ),
				),
				array(
					'meta'        => 'plugin_name',
					'preview'     => __( 'WooCommerce', 'echodash' ),
					'placeholder' => __( 'The plugin name', 'echodash' ),
				),
				array(
					'meta'        => 'plugin_description',
					'preview'     => __( 'An ecommerce toolkit that helps you sell anything. Beautifully.', 'echodash' ),
					'placeholder' => __( 'The plugin description', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Handle WordPress core and plugin updates.
	 *
	 * @since 1.1.0
	 *
	 * @param WP_Upgrader $upgrader   WP_Upgrader instance.
	 * @param array       $hook_extra Array of bulk item update data.
	 */
	public function upgrader_process_complete( $upgrader, $hook_extra ) {
		global $wp_version;

		if ( ! empty( $hook_extra['type'] ) && 'core' === $hook_extra['type'] ) {
			$old_version = ! empty( $upgrader->skin->options['old_version'] ) ? $upgrader->skin->options['old_version'] : '';

			$this->track_event(
				'core_updated',
				array(),
				array(
					'wordpress' => array(
						'old_version' => $old_version,
						'new_version' => $wp_version,
					),
				)
			);
		} elseif ( ! empty( $hook_extra['type'] ) && 'plugin' === $hook_extra['type'] ) {
			// Single plugin update.
			if ( ! empty( $hook_extra['plugin'] ) ) {
				$plugin_file = $hook_extra['plugin'];
			} elseif ( ! empty( $hook_extra['plugins'] ) && is_array( $hook_extra['plugins'] ) ) { // Bulk plugin update.
				$plugin_file = current( $hook_extra['plugins'] );
			}

			if ( empty( $plugin_file ) ) {
				return;
			}

			if ( ! function_exists( 'get_plugin_data' ) ) {
				require_once ABSPATH . 'wp-admin/includes/plugin.php';
			}

			$plugin_data = get_plugin_data( ECHODASH_WP_PLUGIN_DIR . '/' . $plugin_file );

			$old_version = ! empty( $upgrader->skin->plugin_info['Version'] ) ? $upgrader->skin->plugin_info['Version'] : '';

			$this->track_event(
				'plugin_updated',
				array(),
				array(
					'wordpress' => array(
						'plugin_name'        => $plugin_data['Name'],
						'plugin_description' => wp_strip_all_tags( $plugin_data['Description'] ),
						'old_version'        => $old_version,
						'new_version'        => $plugin_data['Version'],
					),
				)
			);
		}
	}
}

new EchoDash_WordPress();
