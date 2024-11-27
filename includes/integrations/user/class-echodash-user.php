<?php

defined( 'ABSPATH' ) || exit;
/**
 * User integration.
 *
 * @since 1.1.0
 */
class EchoDash_User extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since 1.1.0
	 * @var string $slug
	 */

	public $slug = 'user';

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 1.1.0
	 * @var string $name
	 */
	public $name = 'User';

	/**
	 * Stores any global options which are shared across integrations.
	 *
	 * @since 1.1.0
	 * @var  array $global_options
	 */
	public $global_option_types = array( 'user' );

	/**
	 * Get things started.
	 *
	 * @since 1.1.0
	 */
	public function init() {

		add_action( 'wp_login', array( $this, 'login' ), 5 ); // 5 so it runs before the WishList Member plugin.
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
			'logged_in' => array(
				'name'         => __( 'Logged In', 'echodash' ),
				'description'  => __( 'Triggered each time a user logs in.', 'echodash' ),
				'has_global'   => true,
				'option_types' => array( 'user' ),
			),
		);

		return $triggers;
	}

	/**
	 * Track an event on login.
	 *
	 * @since 1.1.0
	 *
	 * @param string $user_login The user login.
	 */
	public function login( $user_login ) {
		$user = get_user_by( 'login', $user_login );

		$this->track_event(
			'logged_in',
			array(
				'user' => $user->ID,
			)
		);
	}

	/**
	 * Gets the user options.
	 *
	 * @since  1.1.0
	 *
	 * @return array The download options.
	 */
	public function get_user_options() {

		return array(
			'name'    => __( 'User', 'echodash' ),
			'type'    => 'user',
			'options' => array(
				array(
					'meta'        => 'id',
					'preview'     => 9,
					'placeholder' => __( 'The user ID', 'echodash' ),
				),
				array(
					'meta'        => 'user_email',
					'preview'     => 'example@email.com',
					'placeholder' => __( 'The user\'s email address', 'echodash' ),
				),
				array(
					'meta'        => 'display_name',
					'preview'     => 'Jane Doe',
					'placeholder' => __( 'The user\'s display name', 'echodash' ),
				),
				array(
					'meta'        => 'first_name',
					'preview'     => 'Jane',
					'placeholder' => __( 'The user\'s first name', 'echodash' ),
				),
				array(
					'meta'        => 'last_name',
					'preview'     => 'Doe',
					'placeholder' => __( 'The user\'s last name', 'echodash' ),
				),
				array(
					'meta'        => 'user_login',
					'preview'     => 'janeDoe',
					'placeholder' => __( 'The the user\'s username', 'echodash' ),
				),
				array(
					'meta'        => 'roles',
					'preview'     => 'Editor, Shop Manager',
					'placeholder' => __( 'The user\'s roles', 'echodash' ),
				),
				array(
					'meta'        => '*meta*',
					'placeholder' => __( 'Any user meta key', 'echodash' ),
				),
				array(
					'meta'        => 'current_url',
					'preview'     => home_url( '/login/' ),
					'placeholder' => __( 'The user\'s current URL', 'echodash' ),
				),
				array(
					'meta'        => 'referer',
					'preview'     => home_url( '/previous-page/' ),
					'placeholder' => __( 'The user\'s previous URL', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Gets the details from the user for merging.
	 *
	 * At the moment this passes the product ID in the admin when editing a
	 * WooCommerce product. Will have to find a way to fix that later.
	 *
	 * @since  1.1.0
	 *
	 * @param  bool|int $user_id The user ID.
	 * @return array    The user data.
	 */
	public function get_user_vars( $user_id = false ) {

		if ( empty( $user_id ) || empty( get_user_by( 'id', $user_id ) ) ) {

			$user_id = get_current_user_id();
		}

		$user_meta = get_user_meta( $user_id );

		$user_meta = array_map(
			function ( $a ) {
				return maybe_unserialize( $a[0] );
			},
			$user_meta
		);

		foreach ( $user_meta as $key => $value ) {

			if ( 'wp_capabilities' === $key ) {
				$user_meta['role'] = implode( ', ', $value );
			}

			if ( is_array( $value ) ) {
				unset( $user_meta[ $key ] ); // no arrays for now.
			}
		}

		// Page / leadsource stuff.

		if ( ! empty( $_SERVER['REQUEST_URI'] ) ) {
			$user_meta['current_url'] = home_url( $_SERVER['REQUEST_URI'] );
		}

		if ( ! empty( $_SERVER['HTTP_REFERER'] ) ) {
			$user_meta['referer'] = $_SERVER['HTTP_REFERER'];
		}

		$user_meta['id'] = $user_id;

		return array(
			'user' => $user_meta,
		);
	}
}

new EchoDash_User();
