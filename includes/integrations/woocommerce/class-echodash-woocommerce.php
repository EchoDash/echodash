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

		add_action( 'ecd_woocommerce_payment_complete', array( $this, 'new_order' ), 10, 3 );
		add_action( 'woocommerce_order_status_changed', array( $this, 'order_status_changed' ), 10, 4 );
	}

	/**
	 * Gets the triggers for the integration.
	 *
	 * @access protected
	 *
	 * @since  1.0.0
	 *
	 * @return array The triggers.
	 */
	protected function setup_triggers() {

		$triggers = array(
			'purchased_product'    => array(
				'name'         => __( 'Purchased Product', 'echodash' ),
				'description'  => __( 'Triggered each time a single product is purchased.', 'echodash' ),
				'post_types'   => array( 'product' ),
				'has_single'   => true,
				'has_global'   => true,
				'option_types' => array( 'product', 'order' ),
			),
			'order_placed'         => array(
				'name'         => __( 'Order Placed', 'echodash' ),
				'description'  => __( 'Triggered each time a WooCommerce order is placed.', 'echodash' ),
				'has_global'   => true,
				'placeholder'  => 'Order',
				'option_types' => array( 'order' ),
			),
			'order_status_changed' => array(
				'name'         => __( 'Order Status Changed', 'echodash' ),
				'description'  => __( 'Triggered when a WooCommerce order status changes.', 'echodash' ),
				'has_global'   => true,
				'placeholder'  => 'Order',
				'option_types' => array( 'order' ),
			),
		);

		return $triggers;
	}

	/**
	 * Track event when a new order is placed.
	 *
	 * @since 1.0.0
	 *
	 * @param int    $order_id   The order ID.
	 * @param string $contact_id The contact ID created or updated in the CRM.
	 */
	public function new_order( $order_id, $contact_id ) {

		$order = wc_get_order( $order_id );

		// Get user args.
		$user_id = $order->get_user_id();

		if ( ! empty( $user_id ) ) {
			$args = echodash()->integration( 'user' )->get_user_vars( $user_id );
		} else {
			$args = array(
				'user' => array(
					'first_name'   => $order->get_billing_first_name(),
					'last_name'    => $order->get_billing_last_name(),
					'display_name' => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
					'user_email'   => $order->get_billing_email(),
				),
			);
		}

		$order_args = $this->get_order_vars( $order_id );
		$args       = array_merge( $args, $order_args );

		foreach ( $order->get_items() as $item ) {

			$events = $this->get_events( 'purchased_product', $item->get_product_id() );

			if ( ! empty( $events ) ) {

				$product_vars = $this->get_product_vars( $item->get_product_id() );
				$args         = array_merge( $args, $product_vars );

				foreach ( $events as $event ) {
					$event = $this->replace_tags( $event, $args );
					$this->track_event( $event, $order->get_billing_email() );
				}
			} elseif ( $this->get_global_events( 'purchased_product' ) ) {

				// See if any are configured globally.

				$product_vars = $this->get_product_vars( $item->get_product_id() );
				$args         = array_merge( $args, $product_vars );

				foreach ( $this->get_global_events( 'purchased_product' ) as $event ) {

					$event = $this->replace_tags( $event, $args );
					$this->track_event( $event, $order->get_billing_email() );
				}
			}
		}

		// Global.
		if ( ! empty( $this->get_global_events( 'order_placed' ) ) ) {

			foreach ( $this->get_global_events( 'order_placed' ) as $event ) {

				$event = $this->replace_tags( $event, $args );
				$this->track_event( $event, $order->get_billing_email() );
			}
		}
	}

	/**
	 * Triggered when a WooCommerce order status changes.
	 *
	 * @since 1.4.4
	 *
	 * @param int      $order_id   The order ID.
	 * @param string   $old_status The order's previous status.
	 * @param string   $new_status The order status.
	 * @param WC_Order $order      The order.
	 */
	public function order_status_changed( $order_id, $old_status, $new_status, $order ) {

		$order_vars = $this->get_order_vars( $order->get_id() );

		$order_vars['order']['old_status'] = $old_status;

		foreach ( $this->get_events( 'order_status_changed', $order->get_id() ) as $event ) {
			$event = $this->replace_tags( $event, $order_vars );
			$this->track_event( $event, $order->get_billing_email() );
		}
	}


	/**
	 * Displays the event tracking fields on the single product settings panel.
	 *
	 * @since 1.0.0
	 *
	 * @param int   $post_id The post ID.
	 */
	public function panel_content( $post_id ) {

		echo '<div class="options_group wpf-event">';

		echo '<div class="form-field"><label><strong>' . esc_html__( 'Event Tracking', 'echodash' ) . '</strong></label></div>';

		echo '<div class="form-field"><label for="wpf-track-events">' . esc_html__( 'Track event when purchased', 'wp-fusion' ) . '</label>';

			$this->render_event_tracking_fields( 'purchased_product', $post_id );

		echo '</div>';

		echo '</div>';
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
