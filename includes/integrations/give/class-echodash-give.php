<?php
/**
 * Give integration for EchoDash.
 *
 * @package EchoDash
 */

defined( 'ABSPATH' ) || exit;

/**
 * Give WP integration.
 *
 * @since 1.6.0
 */
class EchoDash_Give extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since 1.6.0
	 * @var string $slug
	 */

	public $slug = 'give';

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 1.6.0
	 * @var string $name
	 */
	public $name = 'GiveWP';

	/**
	 * Get things started.
	 *
	 * @since 1.6.0
	 */
	public function init() {
		add_action( 'give_insert_payment', array( $this, 'new_donation' ) );
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
			'new_donation' => array(
				'name'               => __( 'New Donation', 'echodash' ),
				'description'        => __( 'Triggered each time a donation has been made.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'donation' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => 'Donation Made',
					'mappings' => array(
						'donation_id'     => '{donation:ID}',
						'donor_name'      => '{donation:first_name} {donation:last_name}',
						'donor_email'     => '{donation:email}',
						'donation_amount' => '{donation:subtotal}',
						'payment_method'  => '{donation:payment_gateway}',
						'donation_status' => '{donation:status}',
						'form_title'      => '{donation:form_title}',
					),
				),
			),
		);

		return $triggers;
	}



	/**
	 * Gets the donation options.
	 *
	 * @since  1.6.0
	 *
	 * @return array The donation options.
	 */
	public function get_donation_options() {
		return array(
			'name'    => __( 'Donation', 'echodash' ),
			'type'    => 'donation',
			'options' => array(
				array(
					'meta'        => 'ID',
					'preview'     => 33,
					'placeholder' => __( 'The donation ID', 'echodash' ),
				),
				array(
					'meta'        => 'first_name',
					'preview'     => 'Jon',
					'placeholder' => __( 'The donor first name', 'echodash' ),
				),
				array(
					'meta'        => 'last_name',
					'preview'     => 'Doe',
					'placeholder' => __( 'The donor last name', 'echodash' ),
				),
				array(
					'meta'        => 'email',
					'preview'     => 'jon@email.com',
					'placeholder' => __( 'The donor email address', 'echodash' ),
				),
				array(
					'meta'        => 'country',
					'preview'     => 'United States',
					'placeholder' => __( 'The donor country', 'echodash' ),
				),
				array(
					'meta'        => 'city',
					'preview'     => 'New York',
					'placeholder' => __( 'The donor city', 'echodash' ),
				),
				array(
					'meta'        => 'subtotal',
					'preview'     => '100',
					'placeholder' => __( 'The donation amount', 'echodash' ),
				),
				array(
					'meta'        => 'currency',
					'preview'     => 'USD',
					'placeholder' => __( 'The donation currency', 'echodash' ),
				),
				array(
					'meta'        => 'status',
					'preview'     => 'pending',
					'placeholder' => __( 'The donation payment status', 'echodash' ),
				),
				array(
					'meta'        => 'payment_gateway',
					'preview'     => 'Paypal',
					'placeholder' => __( 'The payment gateway', 'echodash' ),
				),
				array(
					'meta'        => 'form_title',
					'preview'     => 'Donation Form',
					'placeholder' => __( 'The donation form title', 'echodash' ),
				),

			),
		);
	}

	/**
	 * Gets the donation variables.
	 *
	 * @since  1.6.0
	 *
	 * @param  int $donation_id The donation ID.
	 * @return array The donation variables.
	 */
	public function get_donation_vars( $donation_id ) {
		$donation = new Give_Payment( $donation_id );

		if ( ! $donation->ID ) {
			return array();
		}

		$donation_fields = array();

		$meta_column = array_column( $this->get_donation_options()['options'], 'meta' );

		$payment_meta              = $donation->payment_meta;
		$donation->payment_gateway = $payment_meta['_give_payment_gateway'];
		$donation->country         = $payment_meta['_give_donor_billing_country'];
		$donation->city            = $payment_meta['_give_donor_billing_city'];
		$donation->form_title      = $payment_meta['_give_payment_form_title'];

		// Post/meta fields.
		foreach ( $meta_column as $meta_key ) {
			if ( isset( $donation->$meta_key ) && '' !== $donation->$meta_key ) {
				$donation_fields[ $meta_key ] = $donation->$meta_key;
			}
		}

		return array(
			'donation' => $donation_fields,
		);
	}



	/**
	 * Fires when a donation payment has been made.
	 *
	 * @since  1.6.0
	 *
	 * @param int $donation_id The donation ID.
	 */
	public function new_donation( $donation_id ) {
		$donation = new Give_Payment( $donation_id );

		$this->track_event(
			'new_donation',
			array(
				'donation' => $donation_id,
				'user'     => $donation->user_id,
			),
			array(
				'donation' => array(
					'amount'  => $donation->subtotal,
					'gateway' => $donation->payment_gateway,
					'status'  => $donation->status,
				),
			)
		);
	}
}

new EchoDash_Give();
