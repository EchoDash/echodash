<?php

defined( 'ABSPATH' ) || exit;

/**
 * Abandoned Cart integration.
 *
 * @since 1.6.0
 */
class EchoDash_Abandoned_Cart extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since 1.6.0
	 * @var string $slug
	 */
	public $slug = 'abandoned-cart';

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 1.6.0
	 * @var string $name
	 */
	public $name = 'Abandoned Carts';

	/**
	 * Get things started
	 *
	 * @access public
	 * @return void
	 */
	public function init() {

		add_action( 'ecd_abandoned_cart_created', array( $this, 'cart_created' ), 10, 2 );
	}

	/**
	 * Gets the triggers for the integration.
	 *
	 * @access protected
	 *
	 * @since  1.6.0
	 *
	 * @return array The triggers.
	 */
	protected function setup_triggers() {

		$triggers = array(
			'cart_created' => array(
				'name'         => __( 'Abandoned Cart Created', 'echodash' ),
				'description'  => __( 'Triggered each time an abandoned cart has been created.', 'echodash' ),
				'has_global'   => true,
				'option_types' => array( 'cart' ),
			),
		);

		return $triggers;
	}


	/**
	 * Gets the cart options.
	 *
	 * @since  1.6.0
	 *
	 * @return array The cart options.
	 */
	public function get_cart_options() {

		return array(
			'name'    => __( 'Cart', 'echodash' ),
			'type'    => 'cart',
			'options' => array(
				array(
					'meta'        => 'cart_id',
					'preview'     => 32,
					'placeholder' => __( 'The cart ID', 'echodash' ),
				),
				array(
					'meta'        => 'recovery_url',
					'preview'     => home_url( '/checkout/?wpfrc=123' ),
					'placeholder' => __( 'The cart recovery URL', 'echodash' ),
				),
				array(
					'meta'        => 'source',
					'preview'     => 'woocommerce',
					'placeholder' => __( 'The cart source', 'echodash' ),
				),
				array(
					'meta'        => 'contact_id',
					'preview'     => 3,
					'placeholder' => __( 'The cart contact id', 'echodash' ),
				),
				array(
					'meta'        => 'first_name',
					'preview'     => 'John',
					'placeholder' => __( 'The user first name', 'echodash' ),
				),
				array(
					'meta'        => 'last_name',
					'preview'     => 'Doe',
					'placeholder' => __( 'The user last name', 'echodash' ),
				),
				array(
					'meta'        => 'user_email',
					'preview'     => 'example@email.com',
					'placeholder' => __( 'The user email address', 'echodash' ),
				),
				array(
					'meta'        => 'cart_value',
					'preview'     => 72,
					'placeholder' => __( 'the cart total value', 'echodash' ),
				),
				array(
					'meta'        => 'currency',
					'preview'     => 'USD',
					'placeholder' => __( 'the cart currency', 'echodash' ),
				),
			),
		);
	}


	/**
	 * Gets the cart variables.
	 *
	 * @since  1.6.0
	 *
	 * @param  array $args The cart arguments.
	 * @return array The cart variables.
	 */
	public function get_cart_vars( $args ) {
		$args['first_name'] = $args['user_data']['first_name'];
		$args['last_name']  = $args['user_data']['last_name'];
		$args['cart_value'] = $args['update_data']['cart_value'];

		return array(
			'cart' => $args,
		);
	}


	/**
	 * Fires when an abandoned cart is created.
	 *
	 * @param string|integer $contact_id The contact ID.
	 * @param array         $cart_args  The cart arguments.
	 */
	public function cart_created( $contact_id, $cart_args ) {
		$this->track_event(
			'cart_created',
			array(
				'contact' => $contact_id,
			),
			array(
				'cart' => array(
					'id'         => $cart_args['cart_id'],
					'value'      => $cart_args['update_data']['cart_value'],
					'currency'   => $cart_args['currency'],
					'source'     => $cart_args['source'],
					'email'      => $cart_args['user_email'],
					'first_name' => $cart_args['user_data']['first_name'],
					'last_name'  => $cart_args['user_data']['last_name'],
				),
			)
		);
	}

	/**
	 * Track cart abandonment.
	 *
	 * @since 1.0.0
	 *
	 * @param array $cart The cart data.
	 */
	public function cart_abandoned( $cart ) {
		$user = wp_get_current_user();

		$this->track_event(
			'cart_abandoned',
			array(
				'user' => $user->ID,
			),
			array(
				'cart' => array(
					'total'    => $cart['total'],
					'products' => $this->get_cart_products( $cart ),
					'email'    => $cart['email'],
				),
			)
		);
	}

	/**
	 * Track cart recovery.
	 *
	 * @since 1.0.0
	 *
	 * @param array $cart The cart data.
	 */
	public function cart_recovered( $cart ) {
		$user = wp_get_current_user();

		$this->track_event(
			'cart_recovered',
			array(
				'user' => $user->ID,
			),
			array(
				'cart' => array(
					'total'    => $cart['total'],
					'products' => $this->get_cart_products( $cart ),
					'email'    => $cart['email'],
				),
			)
		);
	}

	/**
	 * Get formatted cart products.
	 *
	 * @since 1.0.0
	 * @param array $cart The cart data.
	 * @return array Cart products.
	 */
	private function get_cart_products( $cart ) {
		$products = array();

		if ( ! empty( $cart['cart_contents'] ) ) {
			foreach ( $cart['cart_contents'] as $item ) {
				$products[] = array(
					'id'       => $item['product_id'],
					'name'     => $item['data']->get_name(),
					'quantity' => $item['quantity'],
					'price'    => $item['line_total'],
				);
			}
		}

		return $products;
	}
}

new EchoDash_Abandoned_Cart();
