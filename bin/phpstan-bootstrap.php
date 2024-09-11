<?php
/**
 * PHP Stan bootstrap file.
 *
 * @package EchoDash
 */

if ( ! defined( 'ABSPATH' ) ) {
	/**
	 * Absolute path to WordPress.
	 *
	 * @phpstan-type string $abspath
	 * @var string $abspath
	 */
	define( 'ABSPATH', '/path/to/wordpress/' );
}

if ( ! defined( 'ECHODASH_DIR_PATH' ) ) {
	/**
	 * Directory path where EchoDash is located.
	 *
	 * @phpstan-type string $dir_path
	 * @var string $dir_path
	 */
	define( 'ECHODASH_DIR_PATH', 'path/to/echodash' );
}

if ( ! defined( 'ECHODASH_PLUGIN_PATH' ) ) {
	/**
	 * Full plugin path for EchoDash.
	 *
	 * @phpstan-type string $plugin_path
	 * @var string $plugin_path
	 */
	define( 'ECHODASH_PLUGIN_PATH', 'path/to/echodash' );
}

if ( ! defined( 'ECHODASH_DIR_URL' ) ) {
	/**
	 * URL for the EchoDash directory.
	 *
	 * @phpstan-type string $dir_url
	 * @var string $dir_url
	 */
	define( 'ECHODASH_DIR_URL', 'https://site.com/path/to/echodash' );
}
