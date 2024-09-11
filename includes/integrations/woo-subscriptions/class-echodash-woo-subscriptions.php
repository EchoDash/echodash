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
				'name'         => __( 'Renewal Payment Received', 'echodash' ),
				'description'  => __( 'Triggered each time a single renewal payment is received.', 'echodash' ),
				'post_types'   => array( 'product' ),
				'has_single'   => true,
				'has_global'   => true,
				'option_types' => array( 'product', 'order', 'subscription' ),
			),
			'subscriptions_status_updated' => array(
				'name'         => __( 'Subscription Status Changed', 'echodash' ),
				'description'  => __( 'Triggered when a subscription status has changed.', 'echodash' ),
				'post_types'   => array( 'product' ),
				'has_single'   => true,
				'has_global'   => true,
				'option_types' => array( 'product', 'subscription' ),
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

		$order_vars        = echodash()->integration( 'woocommerce' )->get_order_vars( $order->get_id() );
		$subscription_vars = $this->get_subscription_vars( $subscription->get_id() );

		foreach ( $subscription->get_items() as $item ) {

			$events = $this->get_events( 'renewal_payment', $item->get_product_id() );

			if ( ! empty( $events ) ) {

				$product_args  = echodash()->integration( 'woocommerce' )->get_product_vars( $item->get_product_id() );
				$combined_args = array_merge( $order_vars, $subscription_vars, $product_args );

				foreach ( $events as $event ) {

					$event = $this->replace_tags( $event, $combined_args );

					$this->track_event( $event, $order->get_billing_email() );

				}
			}
		}
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

		$user_id       = $subscription->get_user_id();
		$user          = get_user_by( 'id', $user_id );
		$email_address = $user->user_email;

		$subscription_vars = $this->get_subscription_vars( $subscription->get_id(), $old_status );

		foreach ( $subscription->get_items() as $item ) {

			$events = $this->get_events( 'subscriptions_status_updated', $item->get_product_id() );

			if ( ! empty( $events ) ) {

				$product_args  = echodash()->integration( 'woocommerce' )->get_product_vars( $item->get_product_id() );
				$combined_args = array_merge( $subscription_vars, $product_args );

				foreach ( $events as $event ) {

					$event = $this->replace_tags( $event, $combined_args );

					$this->track_event( $event, $email_address );

				}
			}
		}
	}


	/**
	 * Displays the event tracking fields on the single product settings panel.
	 *
	 * @since 1.2.0
	 *
	 * @param int $post_id The post ID.
	 */
	public function panel_content( $post_id ) {

		echo '<div class="options_group show_if_subscription show_if_variable wpf-event">';

		echo '<div class="form-field"><label for="wpf-track-events">' . esc_html__( 'Track event when renewal payment received', 'wp-fusion' ) . '</label>';

			$this->render_event_tracking_fields( 'renewal_payment', $post_id );

		echo '</div>';

		echo '<div class="form-field"><label for="wpf-track-events">' . esc_html__( 'Track event when subscription status changes', 'echodash' ) . '</label>';

			$this->render_event_tracking_fields( 'subscriptions_status_updated', $post_id );

		echo '</div>';

		echo '</div>';
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
