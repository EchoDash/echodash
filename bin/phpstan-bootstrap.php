<?php
/**
 * PHP Stan bootstrap file.
 *
 * @package EchoDash
 */

// WordPress core constants
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/../../' );
}

if ( ! defined( 'WP_PLUGIN_DIR' ) ) {
	define( 'WP_PLUGIN_DIR', ABSPATH . 'wp-content/plugins' );
}

// EchoDash constants
if ( ! defined( 'ECHODASH_DIR_PATH' ) ) {
	/**
	 * Directory path where EchoDash is located.
	 *
	 * @phpstan-type string $dir_path
	 * @var string $dir_path
	 */
	define( 'ECHODASH_DIR_PATH', __DIR__ . '/' );
}

if ( ! defined( 'ECHODASH_PLUGIN_PATH' ) ) {
	/**
	 * Full plugin path for EchoDash.
	 *
	 * @phpstan-type string $plugin_path
	 * @var string $plugin_path
	 */
	define( 'ECHODASH_PLUGIN_PATH', __DIR__ );
}

if ( ! defined( 'ECHODASH_DIR_URL' ) ) {
	/**
	 * URL for the EchoDash directory.
	 *
	 * @phpstan-type string $dir_url
	 * @var string $dir_url
	 */
	define( 'ECHODASH_DIR_URL', 'https://example.com/wp-content/plugins/echodash/' );
}

// WordPress Core stubs
if ( ! defined( 'COOKIEPATH' ) ) {
	/**
	 * Cookie path.
	 */
	define( 'COOKIEPATH', 'path' );
}

if ( ! defined( 'COOKIEDOMAIN' ) ) {
	/**
	 * Cookie domain.
	 */
	define( 'COOKIEDOMAIN', 'domain' );
}
