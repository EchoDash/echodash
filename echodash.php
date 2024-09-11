<?php

/**
 * Plugin Name: EchoDash
 * Description: Track events from WordPress plugins as real-time activities in the EchoDash platform.
 * Plugin URI: https://echodash.com/
 * Version: 0.0.1
 * Author: EchoDash
 * Author URI: https://echodash.com/
 * Text Domain: echodash
 */

/**
 * @copyright Copyright (c) 2024. All rights reserved.
 *
 * @license   Released under the GPL license http://www.opensource.org/licenses/gpl-license.php
 *
 * **********************************************************************
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * **********************************************************************
 */


// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

define( 'ECHODASH_VERSION', '0.0.1' );

/**
 * Class EchoDash
 *
 * @since 1.0.0
 */
final class EchoDash {

	/** Singleton *************************************************************/

	/**
	 * The one true EchoDash.
	 *
	 * @var EchoDash
	 * @since 1.0.0
	 */
	private static $instance;

	/**
	 * Allows interfacing with the main class.
	 *
	 * @var EchoDash_Queue
	 * @since 1.0.0
	 */
	public $queue;

	/**
	 * Allows interfacing with the admin class.
	 *
	 * @var EchoDash_Admin
	 * @since 1.1.3
	 */
	public $admin;

	/**
	 * Allows interfacing with integrations.
	 *
	 * For example echodash()->integrations->{'woocommerce'}->get_events().
	 *
	 * @var object
	 * @since 1.0.0
	 */
	public $integrations;


	/**
	 * Main EchoDash Instance
	 *
	 * Insures that only one instance of EchoDash exists in
	 * memory at any one time. Also prevents needing to define globals all over
	 * the place.
	 *
	 * @since  1.0.0
	 * @static var array $instance
	 *
	 * @return EchoDash The one true EchoDash
	 */
	public static function instance() {

		if ( ! isset( self::$instance ) && ! ( self::$instance instanceof EchoDash ) ) {

			self::$instance = new EchoDash();

			self::$instance->setup_constants();

			if ( ! is_wp_error( self::$instance->check_install() ) ) {

				self::$instance->includes();

				// Initialize classes
				self::$instance->queue = new EchoDash_Queue();

				if ( is_admin() ) {
					self::$instance->admin = new EchoDash_Admin();
				}

				self::$instance->integrations_includes();

			} else {
				add_action( 'admin_notices', array( self::$instance, 'admin_notices' ) );
			}
		}

		return self::$instance;
	}

	/**
	 * Throw error on object clone.
	 *
	 * The whole idea of the singleton design pattern is that there is a single
	 * object therefore, we don't want the object to be cloned.
	 *
	 * @access protected
	 *
	 * @since  1.0.0.
	 */
	public function __clone() {
		// Cloning instances of the class is forbidden.
		_doing_it_wrong( __FUNCTION__, esc_html__( 'Cheatin&#8217; huh?', 'echodash' ), '1.0.0' );
	}

	/**
	 * Disable unserializing of the class.
	 *
	 * @access protected
	 *
	 * @since  1.0.0
	 */
	public function __wakeup() {
		// Unserializing instances of the class is forbidden.
		_doing_it_wrong( __FUNCTION__, esc_html__( 'Cheatin&#8217; huh?', 'echodash' ), '1.0.0' );
	}

	/**
	 * If the method doesn't exist here, call it from the public class.
	 *
	 * @since  1.0.0
	 *
	 * @param  string $name      The method name.
	 * @param  array  $arguments The arguments.
	 * @return mixed  The returned value.
	 */
	public function __call( $name, $arguments ) {

		if ( ! method_exists( self::$instance, $name ) && method_exists( self::$instance->queue, $name ) ) {
			return call_user_func_array( array( self::$instance->queue, $name ), $arguments );
		}
	}

	/**
	 * Setup plugin constants.
	 *
	 * @access private
	 *
	 * @since  1.0.0
	 */
	private function setup_constants() {

		if ( ! defined( 'ECHODASH_DIR_PATH' ) ) {
			define( 'ECHODASH_DIR_PATH', plugin_dir_path( __FILE__ ) );
		}

		if ( ! defined( 'ECHODASH_PLUGIN_PATH' ) ) {
			define( 'ECHODASH_PLUGIN_PATH', plugin_basename( __FILE__ ) );
		}

		if ( ! defined( 'ECHODASH_DIR_URL' ) ) {
			define( 'ECHODASH_DIR_URL', plugin_dir_url( __FILE__ ) );
		}
	}


	/**
	 * Include required files.
	 *
	 * @access private
	 *
	 * @since  1.0.0
	 */
	private function includes() {

		require_once ECHODASH_DIR_PATH . 'includes/functions.php';
		require_once ECHODASH_DIR_PATH . 'includes/public/class-echodash-queue.php';
		require_once ECHODASH_DIR_PATH . 'includes/integrations/class-echodash-integration.php';

		if ( is_admin() ) {
			require_once ECHODASH_DIR_PATH . 'includes/admin/class-echodash-admin.php';
			require_once ECHODASH_DIR_PATH . 'includes/admin/admin-functions.php';
		}
	}

	/**
	 * Include plugin integration classes.
	 *
	 * @access private
	 *
	 * @since  1.0.0
	 */
	private function integrations_includes() {

		// Extend integrations for integrations that does not have files in WPF integrations folder.

		$integrations = array(
			'user'                   => 'WP_User',
			'presto-player'          => 'PrestoPlayer\Core',
			'abandoned-cart'         => 'WP_Fusion_Abandoned_Cart',
			'gravity-forms'          => 'GFForms',
			'affiliatewp'            => 'AffWP',
			'bbpress'                => 'bbPress',
			'buddypress'             => 'BuddyPress',
			'edd'                    => 'Easy_Digital_Downloads',
			'edd-software-licensing' => 'EDD_Software_Licensing',
			'edd-recurring'          => 'EDD_Recurring',
			'gamipress'              => 'GamiPress',
			'give'                   => 'Give',
			'learndash'              => 'SFWD_LMS',
			'lifterlms'              => 'LLMS',
			'woocommerce'            => 'WooCommerce',
			'woo-subscriptions'      => 'WC_Subscriptions_Product',
		);

		foreach ( $integrations as $filename => $dependency_class ) {

			$filename = sanitize_file_name( $filename );

			if ( class_exists( $dependency_class ) ) {
				require_once ECHODASH_DIR_PATH . 'includes/integrations/' . $filename . '/class-echodash-' . $filename . '.php';
			}
		}

		do_action( 'echodash_integrations_loaded' );
	}

	/**
	 * Helper for accessing a single integration.
	 *
	 * @since  1.0.0
	 *
	 * @param  string $integration_name The integration name.
	 * @return EchoDash_Integration|bool The integration class or false.
	 */
	public function integration( $integration_name ) {

		if ( isset( self::$instance->integrations->{ $integration_name } ) ) {
			return self::$instance->integrations->{ $integration_name };
		} else {
			return false;
		}
	}

	/**
	 * Check install.
	 *
	 * Checks if the minimum WordPress and PHP versions are met.
	 *
	 * @since  1.0.0
	 *
	 * @return mixed True on success, WP_Error on error
	 */
	public function check_install() {

		if ( version_compare( PHP_VERSION, '7.0.0', '<' ) ) {
			return new WP_Error( 'error', 'The EchoDash plugin requires PHP 7.0 or higher.' );
		}

		// Make sure WordPress is at least 6.0.
		if ( version_compare( get_bloginfo( 'version' ), '6.0', '<' ) ) {
			return new WP_Error( 'error', 'The EchoDash plugin requires WordPress 6.0 or higher.' );
		}
	}

	/**
	 * Show error message if install check failed.
	 *
	 * @since  1.0.0
	 *
	 * @return mixed error message.
	 */
	public function admin_notices() {

		$return = self::$instance->check_install();

		if ( is_wp_error( $return ) && 'error' === $return->get_error_code() ) {

			echo '<div class="notice notice-error">';
			echo '<p>' . wp_kses_post( $return->get_error_message() ) . '</p>';
			echo '</div>';

		}
	}
}


/**
 * The main function responsible for returning the one true EchoDash Instance
 * to functions everywhere.
 *
 * Use this function like you would a global variable, except without needing to
 * declare the global.
 *
 * @since  1.0.0
 *
 * @return object The one true EchoDash
 */
function echodash() {

	return EchoDash::instance();
}

add_action( 'plugins_loaded', 'echodash' );
