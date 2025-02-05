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
				'name'               => __( 'Logged In', 'echodash' ),
				'description'        => __( 'Triggered each time a user logs in.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'user' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => 'User Login',
					'mappings' => array(
						'email'        => '{user:user_email}',
						'display_name' => '{user:display_name}',
						'roles'        => '{user:roles}',
					),
				),
			),
		);

		return $triggers;
	}

	/**
	 * Sets the user ID to the current one if the integration hasn't provided one.
	 *
	 * @since 1.0.0
	 *
	 * @param array  $objects The objects.
	 * @param string $trigger The trigger.
	 * @return array The objects.
	 */
	public function event_objects( $objects, $trigger ) {

		if ( ! isset( $objects['user'] ) ) {
			$objects['user'] = get_current_user_id();
		}

		return $objects;
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
		// Get current user data for previews
		$current_user = wp_get_current_user();
		$user_meta    = array();

		if ( $current_user->ID ) {
			$user_meta = $this->get_user_vars( $current_user->ID )['user'];
		}

		$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_url( sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) ) : '/login/';
		$referer     = isset( $_SERVER['HTTP_REFERER'] ) ? sanitize_url( sanitize_text_field( wp_unslash( $_SERVER['HTTP_REFERER'] ) ) ) : home_url( '/previous-page/' );

		return array(
			'name'    => __( 'User', 'echodash' ),
			'type'    => 'user',
			'meta'    => $user_meta,
			'options' => array(
				array(
					'meta'        => 'id',
					'preview'     => isset( $current_user->ID ) ? $current_user->ID : 9,
					'placeholder' => __( 'The user ID', 'echodash' ),
				),
				array(
					'meta'        => 'user_email',
					'preview'     => isset( $current_user->user_email ) ? $current_user->user_email : 'example@email.com',
					'placeholder' => __( 'The user\'s email address', 'echodash' ),
				),
				array(
					'meta'        => 'display_name',
					'preview'     => isset( $current_user->display_name ) ? $current_user->display_name : 'Jane Doe',
					'placeholder' => __( 'The user\'s display name', 'echodash' ),
				),
				array(
					'meta'        => 'first_name',
					'preview'     => isset( $current_user->first_name ) ? $current_user->first_name : 'Jane',
					'placeholder' => __( 'The user\'s first name', 'echodash' ),
				),
				array(
					'meta'        => 'last_name',
					'preview'     => isset( $current_user->last_name ) ? $current_user->last_name : 'Doe',
					'placeholder' => __( 'The user\'s last name', 'echodash' ),
				),
				array(
					'meta'        => 'user_login',
					'preview'     => isset( $current_user->user_login ) ? $current_user->user_login : 'janeDoe',
					'placeholder' => __( 'The user\'s username', 'echodash' ),
				),
				array(
					'meta'        => 'roles',
					'preview'     => isset( $user_meta['roles'] ) ? $user_meta['roles'] : 'Editor, Shop Manager',
					'placeholder' => __( 'The user\'s roles', 'echodash' ),
				),
				array(
					'meta'        => '*meta*',
					'preview'     => __( 'No user meta found', 'echodash' ),
					'placeholder' => __( 'Any user meta key', 'echodash' ),
				),
				array(
					'meta'        => 'current_url',
					'preview'     => esc_url( home_url( $request_uri ) ),
					'placeholder' => __( 'The user\'s current URL', 'echodash' ),
				),
				array(
					'meta'        => 'referer',
					'preview'     => esc_url( $referer ),
					'placeholder' => __( 'The user\'s previous URL', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Gets the details from the user for merging.
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

		if ( empty( $user_meta ) ) {
			return array();
		}

		$user_meta = array_map(
			function ( $a ) {
				return maybe_unserialize( $a[0] );
			},
			$user_meta
		);

		$userdata = get_userdata( $user_id );

		if ( false === $userdata ) {
			return array();
		}

		$user_meta['id']              = $user_id;
		$user_meta['user_id']         = $user_id;
		$user_meta['user_login']      = $userdata->user_login;
		$user_meta['user_email']      = $userdata->user_email;
		$user_meta['user_registered'] = $userdata->user_registered;
		$user_meta['user_nicename']   = $userdata->user_nicename;
		$user_meta['user_url']        = $userdata->user_url;
		$user_meta['display_name']    = $userdata->display_name;

		if ( is_array( $userdata->roles ) ) {
			$user_meta['role'] = reset( $userdata->roles );
		}

		$user_meta['roles'] = ! empty( $userdata->roles ) ? implode( ', ', $userdata->roles ) : '';

		if ( ! empty( $userdata->caps ) ) {
			$user_meta[ $userdata->cap_key ] = array_keys( $userdata->caps );
		}

		foreach ( $user_meta as $key => $value ) {
			// WP Fusion support.
			if ( false !== strpos( $key, '_tags' ) && is_array( $value ) && function_exists( 'wpf_get_tag_label' ) ) {
				$user_meta[ $key ] = array_map( 'wpf_get_tag_label', $value );
			}
		}

		foreach ( $user_meta as $key => $value ) {
			if ( is_array( $value ) ) {
				// Recursively flatten array and filter out non-scalar values
				$flatten = function ( $arr ) use ( &$flatten ) {
					$result = array();
					foreach ( $arr as $item ) {
						if ( is_array( $item ) ) {
							$result = array_merge( $result, $flatten( $item ) );
						} elseif ( is_scalar( $item ) ) {
							$result[] = $item;
						}
					}
					return $result;
				};

				$flattened = $flatten( $value );
				if ( ! empty( $flattened ) ) {
					$user_meta[ $key ] = implode( ', ', $flattened );
				} else {
					unset( $user_meta[ $key ] );
				}
			} elseif ( is_object( $value ) ) {
				unset( $user_meta[ $key ] );
			}
		}

		// Page / leadsource stuff.
		if ( ! empty( $_SERVER['REQUEST_URI'] ) ) {
			$user_meta['current_url'] = home_url( sanitize_url( sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) ) );
		}

		if ( ! empty( $_SERVER['HTTP_REFERER'] ) ) {
			$user_meta['referer'] = sanitize_url( sanitize_text_field( wp_unslash( $_SERVER['HTTP_REFERER'] ) ) );
		}

		return array(
			'user' => $user_meta,
		);
	}
}

new EchoDash_User();
