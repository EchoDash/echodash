<?php
/**
 * EDD Recurring Subscription integration.
 *
 * @package EchoDash
 */

defined( 'ABSPATH' ) || exit;
/**
 * Easy Digital Downloads Recurring Subscription.
 *
 * @since 1.3.0
 */
class EchoDash_EDD_Recurring extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since 1.3.0
	 * @var string $slug
	 */

	public $slug = 'edd-recurring';

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 1.3.0
	 * @var string $name
	 */
	public $name = 'EDD Recurring Payments';

	/**
	 * The icon background color for EchoDash's module tracking.
	 *
	 * @since 2.0.0
	 * @var string $icon_background_color
	 */
	protected $icon_background_color = '#35495c';

	/**
	 * Get things started.
	 *
	 * @since 1.3.0
	 */
	public function init() {

		add_action( 'edd_subscription_status_change', array( $this, 'subscription_change' ), 10, 3 );
		add_action( 'echodash_edd_meta_box', array( $this, 'meta_box_callback' ) );
	}

	/**
	 * Gets the triggers for the integration.
	 *
	 * @access protected
	 *
	 * @since  1.3.0
	 *
	 * @return array The triggers.
	 */
	protected function setup_triggers() {

		$triggers = array(
			'edd_subscription_status_changed' => array(
				'name'         => __( ' Subscription Status Changed', 'echodash' ),
				'description'  => __( 'Triggered each time a subscription status changes.', 'echodash' ),
				'post_types'   => array( 'download' ),
				'has_single'   => true,
				'has_global'   => true,
				'option_types' => array( 'download', 'subscription' ),
			),
		);

		return $triggers;
	}

	/**
	 * Override the add_meta_boxes function in the parent class.
	 *
	 * @since 1.3.0
	 */
	public function add_meta_boxes() {}

	/**
	 * Triggered when a subscription status has changed.
	 *
	 * @since 1.3.0
	 *
	 * @param string           $old_status   The old status.
	 * @param string           $new_status   The new status.
	 * @param EDD_Subscription $subscription The subscription.
	 */
	public function subscription_change( $old_status, $new_status, $subscription ) {

		if ( empty( $subscription->customer ) ) {
			return; // new subs initially have an empty customer.
		}

		$this->track_event(
			'edd_subscription_status_changed',
			array(
				'download'     => $subscription->product_id,
				'subscription' => $subscription->id,
			),
			array(
				'subscription' => array(
					'old_status' => $old_status,
					'new_status' => $new_status,
				),
			)
		);
	}

	/**
	 * Get subscription options
	 *
	 * @since 1.3.0
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
					'preview'     => 55,
					'placeholder' => __( 'The subscription ID.', 'echodash' ),
				),
				array(
					'meta'        => 'period',
					'preview'     => 'month',
					'placeholder' => __( 'The recurring period.', 'echodash' ),
				),
				array(
					'meta'        => 'initial_amount',
					'preview'     => '9.99',
					'placeholder' => __( 'The initial amount paid.', 'echodash' ),
				),
				array(
					'meta'        => 'recurring_amount',
					'preview'     => '9.99',
					'placeholder' => __( 'The recurring amount of the subscription.', 'echodash' ),
				),
				array(
					'meta'        => 'status',
					'preview'     => 'active',
					'placeholder' => __( 'The subscription status.', 'echodash' ),
				),
				array(
					'meta'        => 'created',
					'preview'     => gmdate( 'Y-m-d', strtotime( '-1 year' ) ),
					'placeholder' => __( 'The subscription created date.', 'echodash' ),
				),
				array(
					'meta'        => 'expiration',
					'preview'     => gmdate( 'Y-m-d', strtotime( '+1 year' ) ),
					'placeholder' => __( 'The subscription expiration date.', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Gets the details from the subscription.
	 *
	 * @since  1.3.0
	 *
	 * @param  int $subscirption_id The subscription ID.
	 * @return array The subscription variables.
	 */
	public function get_subscription_vars( $subscirption_id ) {

		$subscription = new EDD_Subscription( $subscirption_id );
		return array(
			'subscription' => array(
				'id'               => $subscirption_id,
				'period'           => $subscription->period,
				'initial_amount'   => $subscription->initial_amount,
				'recurring_amount' => $subscription->recurring_amount,
				'created'          => $subscription->created,
				'expiration'       => $subscription->expiration,
				'status'           => $subscription->status,
			),
		);
	}
}

new EchoDash_EDD_Recurring();
