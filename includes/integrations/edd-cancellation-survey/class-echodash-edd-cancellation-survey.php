<?php

defined( 'ABSPATH' ) || exit;
/**
 * EDD Cancellation Survey integration.
 *
 * @since 1.2.0
 */
class EchoDash_EDD_Cancellation_Survey extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since 1.2.0
	 * @var string $slug
	 */
	public $slug = 'edd-cancellation-survey';

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 1.2.0
	 * @var string $name
	 */
	public $name = 'EDD Cancellation Survey';

	/**
	 * Get things started.
	 *
	 * @since 1.2.0
	 */
	public function init() {
		// Hook into the EDD subscription cancellation action
		add_action( 'edd_subscription_cancelled', array( $this, 'track_cancellation_survey' ), 15, 2 );
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
			'subscription_cancelled' => array(
				'name'               => __( 'Subscription Cancelled with Survey', 'echodash' ),
				'description'        => __( 'Triggered when a subscription is cancelled and a survey reason is provided.', 'echodash' ),
				'post_types'         => array(), // No post types needed for this global trigger
				'has_single'         => false,
				'has_global'         => true,
				'option_types'       => array( 'cancellation' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => 'Subscription Cancelled',
					'mappings' => array(
						'reason'          => '{cancellation:reason}',
						'reason_value'    => '{cancellation:reason_value}',
						'subscription_id' => '{cancellation:subscription_id}',
						'customer_email'  => '{cancellation:customer_email}',
						'customer_name'   => '{cancellation:customer_name}',
					),
				),
			),
		);

		return $triggers;
	}

	/**
	 * Track events when a subscription is cancelled with a survey response.
	 *
	 * @since 1.2.0
	 *
	 * @param int                   $sub_id The subscription ID.
	 * @param EDD_Subscription|null $sub    The subscription object.
	 */
	public function track_cancellation_survey( $sub_id, $sub ) {

		// Only proceed if a cancellation reason was provided
		if ( ! isset( $_GET['cancellation_reason'] ) ) {
			return;
		}

		$reason_value = sanitize_text_field( $_GET['cancellation_reason'] );

		// Get the user-friendly reason text
		$reason_text = $this->get_reason_text( $reason_value );

		// Get customer information
		$customer_email = '';
		$customer_name  = '';

		if ( $sub ) {
			$customer_id    = $sub->customer_id;
			$customer       = new EDD_Customer( $customer_id );
			$customer_email = $customer->email;
			$customer_name  = $customer->name;
		}

		$this->track_event(
			'subscription_cancelled',
			array(
				'cancellation' => $sub_id,
			),
			array(
				'cancellation' => array(
					'reason'          => $reason_text,
					'reason_value'    => $reason_value,
					'subscription_id' => $sub_id,
					'customer_email'  => $customer_email,
					'customer_name'   => $customer_name,
				),
			)
		);
	}

	/**
	 * Gets the cancellation reason text from its value.
	 *
	 * @since 1.2.0
	 *
	 * @param string $reason_value The reason value.
	 * @return string The reason text.
	 */
	private function get_reason_text( $reason_value ) {
		if ( ! function_exists( 'edd_cancellation_get_reasons' ) ) {
			return $reason_value;
		}

		$reasons = edd_cancellation_get_reasons();

		if ( empty( $reasons ) ) {
			return $reason_value;
		}

		foreach ( $reasons as $reason ) {
			if ( $reason['value'] === $reason_value ) {
				return $reason['name'];
			}
		}

		return $reason_value;
	}

	/**
	 * Gets the cancellation options.
	 *
	 * @since  1.2.0
	 *
	 * @return array The cancellation options.
	 */
	public function get_cancellation_options() {
		return array(
			'name'    => __( 'Cancellation', 'echodash' ),
			'type'    => 'cancellation',
			'options' => array(
				array(
					'meta'        => 'reason',
					'preview'     => __( 'It is too expensive', 'echodash' ),
					'placeholder' => __( 'The reason given for cancellation', 'echodash' ),
				),
				array(
					'meta'        => 'reason_value',
					'preview'     => 'expensive',
					'placeholder' => __( 'The reason value/code for cancellation', 'echodash' ),
				),
				array(
					'meta'        => 'subscription_id',
					'preview'     => '123',
					'placeholder' => __( 'The ID of the cancelled subscription', 'echodash' ),
				),
				array(
					'meta'        => 'customer_email',
					'preview'     => 'customer@example.com',
					'placeholder' => __( 'The email of the customer who cancelled', 'echodash' ),
				),
				array(
					'meta'        => 'customer_name',
					'preview'     => 'John Doe',
					'placeholder' => __( 'The name of the customer who cancelled', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Gets the details from the cancellation for merging.
	 *
	 * @since  1.2.0
	 *
	 * @param  int $subscription_id The subscription ID.
	 * @return array The cancellation variables.
	 */
	public function get_cancellation_vars( $subscription_id ) {
		// This method is called by the event tracking system
		// The actual data is passed directly in track_cancellation_survey()
		// For consistency, we should implement this method

		$vars = array(
			'cancellation' => array(
				'subscription_id' => $subscription_id,
			),
		);

		return $vars;
	}
}

new EchoDash_EDD_Cancellation_Survey();
