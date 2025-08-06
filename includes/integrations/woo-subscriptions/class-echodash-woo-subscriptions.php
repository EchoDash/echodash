<?php

defined( 'ABSPATH' ) || exit;

/**
 * Woo_Subscriptions integration.
 *
 * @since 1.2.0
 */
class EchoDash_Woo_Subscriptions extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since 1.2.0
	 * @var string $slug
	 */

	public $slug = 'woo-subscriptions';

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 1.2.0
	 * @var string $name
	 */
	public $name = 'WooCommerce Subscriptions';

	/**
	 * The background color for the integration icon.
	 *
	 * @since 2.0.0
	 * @var string $icon_background_color
	 */
	protected $icon_background_color = '#873EFF';

	/**
	 * Get things started.
	 *
	 * @since 1.2.0
	 */
	public function init() {

		add_action( 'echodash_woocommerce_meta_box', array( $this, 'meta_box_callback' ) );

		add_action( 'woocommerce_subscription_status_updated', array( $this, 'subscription_status_updated' ), 20, 3 );

		add_action( 'woocommerce_subscription_renewal_payment_complete', array( $this, 'subscription_renewal' ), 10, 2 );
	}

	/**
	 * Gets the triggers for the integration.
	 *
	 * @access protected
	 *
	 * @since  1.2.0
	 *
	 * @return array The triggers.
	 */
	protected function setup_triggers() {

		$triggers = array(
			'renewal_payment'              => array(
				'name'               => __( 'Renewal Payment Received', 'echodash' ),
				'description'        => __( 'Triggered each time a single renewal payment is received.', 'echodash' ),
				'post_types'         => array( 'product' ),
				'has_single'         => true,
				'has_global'         => true,
				'option_types'       => array( 'product', 'order', 'subscription' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => 'Subscription Renewed',
					'mappings' => array(
						'renewal_date'   => '{subscription:renewal_date}',
						'order_id'       => '{order:id}',
						'payment_total'  => '{order:total}',
						'payment_method' => '{order:payment_method}',
					),
				),
			),
			'subscriptions_status_updated' => array(
				'name'               => __( 'Subscription Status Changed', 'echodash' ),
				'description'        => __( 'Triggered when a subscription status has changed.', 'echodash' ),
				'post_types'         => array( 'product' ),
				'has_single'         => true,
				'has_global'         => true,
				'option_types'       => array( 'product', 'subscription' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => 'Subscription Status Changed',
					'mappings' => array(
						'old_status'   => '{subscription:old_status}',
						'new_status'   => '{subscription:status}',
						'renewal_date' => '{subscription:renewal_date}',
					),
				),
			),
		);

		return $triggers;
	}

	/**
	 * Override the add_meta_boxes function in the parent class.
	 *
	 * @since 1.2.0
	 */
	public function add_meta_boxes() {}

	/**
	 * Triggered when a subscription renewal payment is recieved.
	 *
	 * @since 1.2.0
	 *
	 * @param WC_Subscription $subscription The subscription module.
	 * @param WC_Order        $order        The last order.
	 */
	public function subscription_renewal( $subscription, $order ) {
		$this->track_event(
			'renewal_payment',
			array(
				'subscription' => $subscription->get_id(),
				'order'        => $order->get_id(),
				'user'         => $order->get_user_id(),
			)
		);
	}

	/**
	 * Triggered when a subscription status has changed.
	 *
	 * @since 1.2.0
	 *
	 * @param WC_Subscription $subscription The subscription.
	 * @param string          $status       The new status.
	 * @param string          $old_status   The old status.
	 */
	public function subscription_status_updated( $subscription, $status, $old_status ) {
		if ( $status === $old_status ) {
			return;
		}

		$this->track_event(
			'subscriptions_status_updated',
			array(
				'subscription' => $subscription->get_id(),
				'user'         => $subscription->get_user_id(),
			),
			array(
				'subscription' => array(
					'old_status' => $old_status,
					'new_status' => $status,
				),
			)
		);
	}

	/**
	 * Gets the subscription options.
	 *
	 * @since  1.2.0
	 *
	 * @return array The subscription options.
	 */
	public function get_subscription_options() {

		return array(
			'name'    => __( 'Subscription', 'echodash' ),
			'type'    => 'subscription',
			'options' => array(
				array(
					'meta'        => 'id',
					'preview'     => '123',
					'placeholder' => __( 'The subscription ID', 'echodash' ),
				),
				array(
					'meta'        => 'parent_id',
					'preview'     => '456',
					'placeholder' => __( 'The subscription parent order ID', 'echodash' ),
				),
				array(
					'meta'        => 'renewal_date',
					'preview'     => gmdate( 'Y-m-d', strtotime( '+1 year' ) ),
					'placeholder' => __( 'The subscription renewal date', 'echodash' ),
				),
				array(
					'meta'        => 'start_date',
					'preview'     => gmdate( 'Y-m-d', strtotime( 'today' ) ),
					'placeholder' => __( 'The subscription start date', 'echodash' ),
				),
				array(
					'meta'        => 'end_date',
					'preview'     => gmdate( 'Y-m-d', strtotime( '+1 year' ) ),
					'placeholder' => __( 'The subscription end date', 'echodash' ),
				),
				array(
					'meta'        => 'status',
					'preview'     => 'active',
					'placeholder' => __( 'The subscription status', 'echodash' ),
				),
				array(
					'meta'        => 'old_status',
					'preview'     => 'on-hold',
					'placeholder' => __( 'The subscription\'s previous status', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Gets the subscription variables.
	 *
	 * @since  1.2.0
	 *
	 * @param  int  $subscription_id The subscription ID.
	 * @param  bool $old_status      The old status.
	 * @return array The subscription variables.
	 */
	public function get_subscription_vars( $subscription_id, $old_status = false ) {

		$subscription = wcs_get_subscription( $subscription_id );

		if ( empty( $subscription ) ) {
			return array();
		}

		return array(
			'subscription' => array(
				'id'           => $subscription->get_id(),
				'parent_id'    => $subscription->get_parent_id(),
				'renewal_date' => $subscription->get_date( 'next_payment' ),
				'start_date'   => $subscription->get_date( 'date_created' ),
				'end_date'     => $subscription->get_date( 'end' ),
				'status'       => $subscription->get_status(),
				'old_status'   => $old_status,
			),
		);
	}
}

new EchoDash_Woo_Subscriptions();
