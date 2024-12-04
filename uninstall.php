<?php
/**
 * Uninstall EchoDash
 *
 * This file runs ONLY when the plugin is deleted through the WordPress admin.
 * It will not run when the plugin is deactivated.
 *
 * @package EchoDash
 */

// If uninstall not called from WordPress, exit
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Delete plugin options
delete_option( 'echodash_options' );
delete_option( 'echodash_endpoint' );

// Delete post meta
global $wpdb;
$wpdb->delete( $wpdb->postmeta, array( 'meta_key' => 'echodash_settings' ) );
