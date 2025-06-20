<?php

/**
 * EchoDash - Event Tracking and Activity Log
 *
 * @package EchoDash
 * @author  EchoDash
 * @license GPL-3.0-or-later
 * @link    https://echodash.com
 *
 * @wordpress-plugin
 * Plugin Name: EchoDash
 * Plugin URI:  https://echodash.com/
 * Description: Track events from WordPress plugins as real-time activities in the EchoDash platform.
 * Version:     1.2.0
 * Author:      EchoDash
 * Text Domain: echodash
 * Domain Path: /languages
 * License:     GPL-3.0-or-later
 * License URI: http://www.gnu.org/licenses/gpl-3.0.txt
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
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

define( 'ECHODASH_VERSION', '1.2.0' );

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
	 * @var EchoDash_Public
	 * @since 1.0.0
	 */
	public $public;

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
	 * For example echodash()->integration( 'woocommerce' )->get_events().
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

		if ( ! isset( self::$instance ) ) {

			self::$instance = new EchoDash();

			self::$instance->setup_constants();

			if ( ! is_wp_error( self::$instance->check_install() ) ) {

				self::$instance->includes();

				// Initialize classes
				self::$instance->public = new EchoDash_Public();

				if ( is_admin() ) {
					self::$instance->admin = new EchoDash_Admin();
				}

				self::$instance->integrations = new stdClass();
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

		if ( ! method_exists( self::$instance, $name ) && method_exists( self::$instance->public, $name ) ) {
			return call_user_func_array( array( self::$instance->public, $name ), $arguments );
		}
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

		if ( ! defined( 'ECHODASH_WP_PLUGIN_DIR' ) ) {
			define( 'ECHODASH_WP_PLUGIN_DIR', dirname( plugin_dir_path( __FILE__ ) ) );
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
		require_once ECHODASH_DIR_PATH . 'includes/public/class-echodash-public.php';
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
			'wordpress'               => 'WP',
			'user'                    => 'WP_User',
			'presto-player'           => 'PrestoPlayer\Core',
			'abandoned-cart'          => 'WP_Fusion_Abandoned_Cart',
			'gravity-forms'           => 'GFForms',
			'affiliatewp'             => 'AffWP',
			'bbpress'                 => 'bbPress',
			'buddypress'              => 'BuddyPress',
			'edd'                     => 'Easy_Digital_Downloads',
			'edd-software-licensing'  => 'EDD_Software_Licensing',
			'edd-recurring'           => 'EDD_Recurring',
			'edd-cancellation-survey' => 'edd_cancellation_survey_load',
			'gamipress'               => 'GamiPress',
			'give'                    => 'Give',
			'learndash'               => 'SFWD_LMS',
			'lifterlms'               => 'LLMS',
			'woocommerce'             => 'WooCommerce',
			'woo-subscriptions'       => 'WC_Subscriptions_Product',
		);

		foreach ( $integrations as $filename => $dependency ) {

			$filename = sanitize_file_name( $filename );

			if ( class_exists( $dependency ) || function_exists( $dependency ) ) {
				require_once ECHODASH_DIR_PATH . 'includes/integrations/' . $filename . '/class-echodash-' . $filename . '.php';
			}
		}

		do_action( 'echodash_integrations_loaded' );
	}

	/**
	 * Show error message if install check failed.
	 *
	 * @since  1.0.0
	 */
	public function admin_notices() {
		$return = self::$instance->check_install();

		if ( is_wp_error( $return ) && 'error' === $return->get_error_code() ) {
			printf(
				'<div class="notice notice-error"><p>%s</p></div>',
				wp_kses_post( $return->get_error_message() )
			);
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
			return new WP_Error( 'error', esc_html__( 'The EchoDash plugin requires PHP 7.0 or higher.', 'echodash' ) );
		}

		// Make sure WordPress is at least 6.0.
		if ( version_compare( get_bloginfo( 'version' ), '6.0', '<' ) ) {
			return new WP_Error( 'error', esc_html__( 'The EchoDash plugin requires WordPress 6.0 or higher.', 'echodash' ) );
		}

		return true;
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
