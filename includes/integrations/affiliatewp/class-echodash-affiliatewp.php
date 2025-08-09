<?php

defined( 'ABSPATH' ) || exit;

/**
 * Affiliate WP integration.
 *
 * @since 1.6.0
 */
class EchoDash_AffiliateWP extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since 1.6.0
	 * @var string $slug
	 */

	public $slug = 'affiliatewp';

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 1.6.0
	 * @var string $name
	 */
	public $name = 'AffiliateWP';

	/**
	 * The icon background color for EchoDash's module tracking.
	 *
	 * @since 2.0.0
	 * @var string $icon_background_color
	 */
	protected $icon_background_color = '#e54e44';

	/**
	 * Get things started.
	 *
	 * @since 1.6.0
	 */
	public function init() {

		add_action( 'affwp_insert_affiliate', array( $this, 'add_affiliate' ), 15 );

		add_action( 'affwp_set_affiliate_status', array( $this, 'affiliate_status_updated' ), 10, 2 );

		add_action( 'affwp_post_insert_visit', array( $this, 'add_visit' ), 10, 3 );

		add_action( 'affwp_referral_accepted', array( $this, 'add_referral' ), 10, 2 );
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
			'affiliate_created'        => array(
				'name'               => __( 'New Affiliate', 'echodash' ),
				'description'        => __( 'Triggered each time an affiliate registers.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'affiliate' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => 'New Affiliate Registration',
					'mappings' => array(
						'payment_email' => '{affiliate:payment_email}',
						'rate'          => '{affiliate:rate}',
						'status'        => '{affiliate:status}',
					),
				),
			),
			'affiliate_status_updated' => array(
				'name'               => __( 'Affiliate Status Updated', 'echodash' ),
				'description'        => __( 'Triggered each time an affiliate\'s status is updated.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'affiliate' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => 'Affiliate Status Changed',
					'mappings' => array(
						'payment_email' => '{affiliate:payment_email}',
						'status'        => '{affiliate:status}',
					),
				),
			),
			'link_visited'             => array(
				'name'               => __( 'New Visit', 'echodash' ),
				'description'        => __( 'Triggered each time a referral visits a link.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'affiliate', 'visit' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => 'Affiliate Link Visited',
					'mappings' => array(
						'visited_url' => '{visit:url}',
					),
				),
			),
			'referral_earned'          => array(
				'name'               => __( 'Referral Earned', 'echodash' ),
				'description'        => __( 'Triggered each time a referral is earned.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'affiliate', 'visit', 'referral' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => 'Referral Earned',
					'mappings' => array(
						'referral_amount' => '{referral:amount}',
						'referral_type'   => '{referral:type}',
						'referral_status' => '{referral:status}',
						'customer_email'  => '{referral:customer_email}',
					),
				),
			),
		);

		return $triggers;
	}



	/**
	 * Gets the affiliate options.
	 *
	 * @since  1.6.0
	 *
	 * @return array The order options.
	 */
	public function get_affiliate_options() {
		return array(
			'name'    => __( 'Affiliate', 'echodash' ),
			'type'    => 'affiliate',
			'options' => array(
				array(
					'meta'        => 'affiliate_id',
					'preview'     => 33,
					'placeholder' => __( 'The affiliate ID', 'echodash' ),
				),
				array(
					'meta'        => 'payment_email',
					'preview'     => 'affiliate@paypal.com',
					'placeholder' => __( 'The affiliate paypal email', 'echodash' ),
				),
				array(
					'meta'        => 'rate',
					'preview'     => '10',
					'placeholder' => __( 'The referral rate', 'echodash' ),
				),
				array(
					'meta'        => 'earnings',
					'preview'     => '500',
					'placeholder' => __( 'The total earnings', 'echodash' ),
				),
				array(
					'meta'        => 'referrals',
					'preview'     => '21',
					'placeholder' => __( 'The total number of referrals', 'echodash' ),
				),
				array(
					'meta'        => 'visits',
					'preview'     => '55',
					'placeholder' => __( 'The total number of visits', 'echodash' ),
				),
				array(
					'meta'        => 'status',
					'preview'     => 'Active',
					'placeholder' => __( 'The affiliate status', 'echodash' ),
				),

			),
		);
	}

	/**
	 * Gets the affiliate variables.
	 *
	 * @since  1.6.0
	 *
	 * @param  int $affiliate_id The affiliate ID.
	 * @return array The affiliate variables.
	 */
	public function get_affiliate_vars( $affiliate_id ) {

		$affiliate = affwp_get_affiliate( $affiliate_id );
		if ( empty( $affiliate ) ) {
			return array();
		}

		$affiliate_fields = array();

		$meta_column = array_column( $this->get_affiliate_options()['options'], 'meta' );

		if ( $affiliate->rate == '' ) {
			$affiliate->rate = affiliate_wp()->settings->get( 'referral_rate', 20 );
		}

		// Post/meta fields.
		foreach ( $meta_column as $meta_key ) {
			if ( isset( $affiliate->$meta_key ) && $affiliate->$meta_key != '' ) {
				$affiliate_fields[ $meta_key ] = $affiliate->$meta_key;
			}
		}

		return array(
			'affiliate' => $affiliate_fields,
		);
	}



	/**
	 * Fires when an affiliate has been added or registered.
	 *
	 * @since  1.6.0
	 *
	 * @param integer $affiliate_id
	 */
	public function add_affiliate( $affiliate_id ) {
		$affiliate = affwp_get_affiliate( $affiliate_id );

		$this->track_event(
			'affiliate_created',
			array(
				'affiliate' => $affiliate_id,
				'user'      => $affiliate->user_id,
			)
		);
	}

	/**
	 * Fires when an affiliate's status is updated.
	 *
	 * @since  1.6.0
	 *
	 * @param int    $affiliate_id The affiliate ID.
	 * @param string $status       The affiliate status.
	 */
	public function affiliate_status_updated( $affiliate_id = 0, $status = '' ) {
		$affiliate = affwp_get_affiliate( $affiliate_id );

		$this->track_event(
			'affiliate_status_updated',
			array(
				'affiliate' => $affiliate_id,
				'user'      => $affiliate->user_id,
			),
			array(
				'affiliate' => array(
					'status' => ucwords( $status ),
				),
			)
		);
	}

	/**
	 * Gets the link visits options.
	 *
	 * @since  1.6.0
	 *
	 * @return array the link visits options.
	 */
	public function get_visit_options() {

		return array(
			'name'    => __( 'Link Visit', 'echodash' ),
			'type'    => 'visit',
			'options' => array(
				array(
					'meta'        => 'visit_id',
					'preview'     => 33,
					'placeholder' => __( 'The visit ID', 'echodash' ),
				),
				array(
					'meta'        => 'url',
					'preview'     => home_url( '/example-page/' ),
					'placeholder' => __( 'The visited page', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Gets the visit variables.
	 *
	 * @since  1.6.0
	 *
	 * @param  int $visit_id The visit ID.
	 * @return array The visit variables.
	 */
	public function get_visit_vars( $visit_id ) {

		$visit = affwp_get_visit( $visit_id );

		if ( empty( $visit ) ) {
			return array();
		}

		$visits_fields = array();

		$meta_column = array_column( $this->get_visit_options()['options'], 'meta' );

		// Post/meta fields.
		foreach ( $meta_column as $meta_key ) {
			if ( isset( $visit->$meta_key ) && $visit->$meta_key != '' ) {
				$visits_fields[ $meta_key ] = $visit->$meta_key;
			}
		}

		return array(
			'visit' => $visits_fields,
		);
	}

	/**
	 * Fires when a referral visits a link.
	 *
	 * @since  1.6.0
	 *
	 * @param integer $visit_id
	 * @param array   $data
	 */
	public function add_visit( $visit_id, $data ) {
		$affiliate = affwp_get_affiliate( $data['affiliate_id'] );

		$this->track_event(
			'link_visited',
			array(
				'affiliate' => $data['affiliate_id'],
				'visit'     => $visit_id,
				'user'      => $affiliate->user_id,
			)
		);
	}


	/**
	 * Gets the referral options.
	 *
	 * @since  1.6.0
	 *
	 * @return array the referral options.
	 */
	public function get_referral_options() {

		return array(
			'name'    => __( 'Referral', 'echodash' ),
			'type'    => 'referral',
			'options' => array(
				array(
					'meta'        => 'referral_id',
					'preview'     => 33,
					'placeholder' => __( 'The referral ID', 'echodash' ),
				),
				array(
					'meta'        => 'status',
					'preview'     => 'Pending',
					'placeholder' => __( 'The referral status', 'echodash' ),
				),
				array(
					'meta'        => 'amount',
					'preview'     => '50',
					'placeholder' => __( 'The referral earned amount', 'echodash' ),
				),
				array(
					'meta'        => 'currency',
					'preview'     => 'USD',
					'placeholder' => __( 'The referral currency', 'echodash' ),
				),
				array(
					'meta'        => 'context',
					'preview'     => 'woocommerce',
					'placeholder' => __( 'The referral context', 'echodash' ),
				),
				array(
					'meta'        => 'reference',
					'preview'     => '5',
					'placeholder' => __( 'The referral reference', 'echodash' ),
				),
				array(
					'meta'        => 'customer_id',
					'preview'     => '3',
					'placeholder' => __( 'The referral customer id', 'echodash' ),
				),
				array(
					'meta'        => 'customer_email',
					'preview'     => 'customer@email.com',
					'placeholder' => __( 'The referral customer email', 'echodash' ),
				),
				array(
					'meta'        => 'type',
					'preview'     => 'sale',
					'placeholder' => __( 'The referral type (Sale, Lead, Optin)', 'echodash' ),
				),
				array(
					'meta'        => 'date',
					'preview'     => '2024-07-24 22:36:31',
					'placeholder' => __( 'The referral date', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Gets the referral variables.
	 *
	 * @since  1.6.0
	 *
	 * @param  int $referral_id The referral ID.
	 * @return array The referral variables.
	 */
	public function get_referral_vars( $referral_id ) {

		$referral = affwp_get_referral( $referral_id );

		if ( empty( $referral ) ) {
			return array();
		}

		$referrals_fields = array();

		$meta_column = array_column( $this->get_referral_options()['options'], 'meta' );

		// Add customer email.
		if ( $referral->customer_id != '' ) {
			$customer = get_user_by( 'id', $referral->customer_id );
			if ( $customer ) {
				$referral->customer_email = $customer->user_email;
			}
		}

		foreach ( $meta_column as $meta_key ) {
			if ( isset( $referral->$meta_key ) && $referral->$meta_key != '' ) {
				$referrals_fields[ $meta_key ] = $referral->$meta_key;
			}
		}

		return array(
			'referral' => $referrals_fields,
		);
	}

	/**
	 * Fires when a referral has been accepted.
	 *
	 * @since  1.6.0
	 *
	 * @param integer $affiliate_id
	 * @param object  $referral
	 */
	public function add_referral( $affiliate_id, $referral ) {
		$affiliate = affwp_get_affiliate( $affiliate_id );

		$this->track_event(
			'referral_earned',
			array(
				'affiliate' => $affiliate_id,
				'referral'  => $referral->referral_id,
				'visit'     => $referral->visit_id,
				'user'      => $affiliate->user_id,
			),
			array(
				'referral' => array(
					'amount' => $referral->amount,
					'type'   => $referral->type,
				),
			)
		);
	}
}

new EchoDash_AffiliateWP();
