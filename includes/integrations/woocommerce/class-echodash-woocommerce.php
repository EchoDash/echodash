<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

/**
 * WooCommerce integration.
 *
 * @since 1.0.0
 */
class EchoDash_WooCommerce extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since 1.0.0
	 * @var string $slug
	 */

	public $slug = 'woocommerce';

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 1.0.0
	 * @var string $name
	 */
	public $name = 'WooCommerce';

	/**
	 * Get things started.
	 *
	 * @since 1.0.0
	 */
	public function init() {

		add_action( 'woocommerce_payment_complete', array( $this, 'order_placed' ), 10, 3 );
		add_action( 'woocommerce_new_order_item', array( $this, 'purchased_product' ), 10, 3 );
		add_action( 'woocommerce_order_status_changed', array( $this, 'order_status_changed' ), 10, 4 );
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
			'order_placed'         => array(
				'name'               => __( 'Order Placed', 'echodash' ),
				'description'        => __( 'Triggered each time a WooCommerce order is placed.', 'echodash' ),
				'has_global'         => true,
				'placeholder'        => 'Order',
				'option_types'       => array( 'order' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => 'Order Placed',
					'mappings' => array(
						'order_id'       => '{order:id}',
						'total'          => '{order:total}',
						'subtotal'       => '{order:subtotal}',
						'customer_email' => '{order:billing_email}',
						'payment_method' => '{order:payment_method}',
					),
				),
			),
			'purchased_product'    => array(
				'name'               => __( 'Purchased Product', 'echodash' ),
				'description'        => __( 'Triggered each time a single product is purchased.', 'echodash' ),
				'post_types'         => array( 'product' ),
				'has_single'         => true,
				'has_global'         => true,
				'option_types'       => array( 'product', 'order' ),
				'enabled_by_default' => false,
				'default_event'      => array(
					'name'     => 'Product Purchase',
					'mappings' => array(
						'product_id'     => '{product:id}',
						'product_name'   => '{product:title}',
						'product_price'  => '{product:price}',
						'order_id'       => '{order:id}',
						'customer_email' => '{order:billing_email}',
					),
				),
			),
			'order_status_changed' => array(
				'name'               => __( 'Order Status Changed', 'echodash' ),
				'description'        => __( 'Triggered when a WooCommerce order status changes.', 'echodash' ),
				'has_global'         => true,
				'placeholder'        => 'Order',
				'option_types'       => array( 'order' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => 'Order Status Update',
					'mappings' => array(
						'order_id'       => '{order:id}',
						'old_status'     => '{order:old_status}',
						'new_status'     => '{order:status}',
						'total'          => '{order:total}',
						'customer_email' => '{order:billing_email}',
					),
				),
			),
		);

		return $triggers;
	}


	/**
	 * Track event when a new order is placed.
	 *
	 * @since 1.0.0
	 *
	 * @param int $order_id The order ID.
	 */
	public function order_placed( $order_id ) {

		$order = wc_get_order( $order_id );

		$this->track_event(
			'order_placed',
			array(
				'order' => $order_id,
				'user'  => $order->get_user_id(),
			)
		);
	}

	/**
	 * Triggered when a new order item is added.
	 *
	 * @since 1.0.0
	 */
	public function purchased_product( $item_id, $item, $item_order_id ) {

		if ( ! is_a( $item, 'WC_Order_Item_Product' ) ) {
			return;
		}

		$this->track_event(
			'purchased_product',
			array(
				'product' => $item->get_product_id(),
				'order'   => $item_order_id,
			)
		);
	}

	/**
	 * Triggered when a WooCommerce order status changes.
	 *
	 * @since 1.0.0
	 *
	 * @param int      $order_id   The order ID.
	 * @param string   $old_status The order's previous status.
	 * @param string   $new_status The order status.
	 * @param WC_Order $order      The order.
	 */
	public function order_status_changed( $order_id, $old_status, $new_status, $order ) {

		$this->track_event(
			'order_status_changed',
			array(
				'order' => $order_id,
				'user'  => $order->get_user_id(),
			),
			array(
				'order' => array(
					'old_status' => $old_status,
					'new_status' => $new_status,
				),
			)
		);
	}

	/**
	 * Gets the order options.
	 *
	 * @since  1.0.0
	 *
	 * @return array The order options.
	 */
	public function get_order_options() {

		return array(
			'name'    => __( 'Order', 'echodash' ),
			'type'    => 'order',
			'options' => array(
				array(
					'meta'        => 'id',
					'preview'     => 33,
					'placeholder' => __( 'The order ID', 'echodash' ),
				),
				array(
					'meta'        => 'date_created',
					'preview'     => gmdate( 'Y-m-d', strtotime( 'yesterday' ) ),
					'placeholder' => __( 'The date the order was created', 'echodash' ),
				),
				array(
					'meta'        => 'date_modified',
					'preview'     => gmdate( 'Y-m-d', strtotime( '-3 hours' ) ),
					'placeholder' => __( 'The order\'s last modified date', 'echodash' ),
				),
				array(
					'meta'        => 'status',
					'preview'     => 'processing',
					'placeholder' => __( 'The order status', 'echodash' ),
				),
				array(
					'meta'        => 'old_status',
					'preview'     => 'pending',
					'placeholder' => __( 'The order\'s previous status', 'echodash' ),
				),
				array(
					'meta'        => 'currency',
					'preview'     => 'USD',
					'placeholder' => __( 'The order currency', 'echodash' ),
				),
				array(
					'meta'        => 'discount_total',
					'preview'     => '52.00',
					'placeholder' => __( 'The total amount of discount', 'echodash' ),
				),
				array(
					'meta'        => 'shipping_total',
					'preview'     => '33.00',
					'placeholder' => __( 'The total amount of shipping', 'echodash' ),
				),
				array(
					'meta'        => 'total',
					'preview'     => '235.00',
					'placeholder' => __( 'The total amount of order', 'echodash' ),
				),
				array(
					'meta'        => 'subtotal',
					'preview'     => '215.00',
					'placeholder' => __( 'The order subtotal', 'echodash' ),
				),
				array(
					'meta'        => 'billing_first_name',
					'preview'     => 'John',
					'placeholder' => __( 'The Customer billing first Name', 'echodash' ),
				),
				array(
					'meta'        => 'billing_last_name',
					'preview'     => 'Doe',
					'placeholder' => __( 'The Customer billing last Name', 'echodash' ),
				),
				array(
					'meta'        => 'billing_email',
					'preview'     => 'john.doe@email.com',
					'placeholder' => __( 'The Customer billing email address', 'echodash' ),
				),
				array(
					'meta'        => 'billing_address',
					'preview'     => '906 Second Avenue',
					'placeholder' => __( 'The Customer billing address', 'echodash' ),
				),
				array(
					'meta'        => 'billing_city',
					'preview'     => 'New York',
					'placeholder' => __( 'The Customer billing city', 'echodash' ),
				),
				array(
					'meta'        => 'billing_country',
					'preview'     => 'United States',
					'placeholder' => __( 'The Customer billing country', 'echodash' ),
				),
				array(
					'meta'        => 'payment_method',
					'preview'     => 'Cash on Delivery',
					'placeholder' => __( 'The order payment method', 'echodash' ),
				),
				array(
					'meta'        => 'customer_note',
					'preview'     => 'Note Example',
					'placeholder' => __( 'The Customer order note', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Gets the order variables.
	 *
	 * @since  1.0.0
	 *
	 * @param  int $order_id The order ID.
	 * @return array The order variables.
	 */
	public function get_order_vars( $order_id ) {

		$order = wc_get_order( $order_id );

		if ( empty( $order ) ) {
			return array();
		}

		$data = $order->get_data();

		return array(
			'order' => array(
				'id'                 => $data['id'],
				'date_created'       => $data['date_created']->date_i18n(),
				'date_modified'      => $data['date_modified']->date_i18n(),
				'status'             => $data['status'],
				'old_status'         => $data['status'],
				'currency'           => $data['currency'],
				'discount_total'     => $data['discount_total'],
				'shipping_total'     => $data['shipping_total'],
				'total'              => $order->get_total(),
				'subtotal'           => $order->get_subtotal(),
				'billing_first_name' => $data['billing']['first_name'],
				'billing_last_name'  => $data['billing']['last_name'],
				'billing_email'      => $data['billing']['email'],
				'billing_address'    => $data['billing']['address_1'],
				'billing_city'       => $data['billing']['city'],
				'billing_country'    => $data['billing']['country'],
				'payment_method'     => $data['payment_method'],
				'customer_note'      => $data['customer_note'],
			),
		);
	}

	/**
	 * Gets the product options.
	 *
	 * @since  1.0.0
	 *
	 * @return array The product options.
	 */
	public function get_product_options() {

		return array(
			'name'    => __( 'Product', 'echodash' ),
			'type'    => 'product',
			'options' => array(
				array(
					'meta'        => 'id',
					'preview'     => 55,
					'placeholder' => __( 'The product ID', 'echodash' ),
				),
				array(
					'meta'        => 'title',
					'preview'     => 'T-shirt',
					'placeholder' => __( 'The product title', 'echodash' ),
				),
				array(
					'meta'        => 'date_created',
					'preview'     => gmdate( 'Y-m-d', strtotime( '-1 year' ) ),
					'placeholder' => __( 'The date the product was created', 'echodash' ),
				),
				array(
					'meta'        => 'date_modified',
					'preview'     => gmdate( 'Y-m-d', strtotime( 'yesterday' ) ),
					'placeholder' => __( 'The product\'s last modified date', 'echodash' ),
				),
				array(
					'meta'        => 'short_description',
					'preview'     => 'This product is cool.',
					'placeholder' => __( 'The product short description', 'echodash' ),
				),
				array(
					'meta'        => 'sku',
					'preview'     => 'KA21',
					'placeholder' => __( 'The product SKU', 'echodash' ),
				),
				array(
					'meta'        => 'price',
					'preview'     => '52.00',
					'placeholder' => __( 'The product price', 'echodash' ),
				),
				array(
					'meta'        => 'sale_price',
					'preview'     => '33.00',
					'placeholder' => __( 'The product sale price', 'echodash' ),
				),
				array(
					'meta'        => 'total_sales',
					'preview'     => 64,
					'placeholder' => __( 'The total number of times the product has been sold', 'echodash' ),
				),
				array(
					'meta'        => 'stock_quantity',
					'preview'     => 55,
					'placeholder' => __( 'The product\'s stock quantity', 'echodash' ),
				),
				array(
					'meta'        => 'stock_status',
					'preview'     => 'instock',
					'placeholder' => __( 'The product\'s stock status', 'echodash' ),
				),
				array(
					'meta'        => 'categories',
					'preview'     => 'Clothing, Music',
					'placeholder' => __( 'The product categories (comma separated)', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Gets the product variables.
	 *
	 * @since  1.0.0
	 *
	 * @param  int $product_id The product ID.
	 * @return array The product variables.
	 */
	public function get_product_vars( $product_id ) {

		$product = wc_get_product( $product_id );

		if ( empty( $product ) ) {
			return array();
		}

		$data  = $product->get_data();
		$terms = wp_get_post_terms( $product_id, 'product_cat', array( 'fields' => 'names' ) );
		$vars  = array(
			'product' => array(
				'id'                => $data['id'],
				'title'             => $data['name'],
				'name'              => $data['name'],
				'slug'              => $data['slug'],
				'featured'          => $data['featured'],
				'short_description' => $data['short_description'],
				'sku'               => $data['sku'],
				'price'             => $data['price'],
				'regular_price'     => $data['regular_price'],
				'sale_price'        => $data['sale_price'],
				'total_sales'       => $data['total_sales'],
				'stock_quantity'    => $data['stock_quantity'],
				'stock_status'      => $data['stock_status'],
				'categories'        => implode( ', ', $terms ),
			),
		);

		if ( ! empty( $data['date_created'] ) ) {
			$vars['product']['date_created']  = $data['date_created']->date_i18n();
			$vars['product']['date_modified'] = $data['date_modified']->date_i18n();
		}

		return $vars;
	}
}

new EchoDash_WooCommerce();
