<?php
/**
 * Easy Digital Downloads integration for EchoDash.
 *
 * @package EchoDash
 */

defined( 'ABSPATH' ) || exit;

/**
 * Easy Digital Downloads integration.
 *
 * @since 1.0.0
 */
class EchoDash_EDD extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since 1.0.0
	 * @var string $slug
	 */

	public $slug = 'edd';

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 1.0.0
	 * @var string $name
	 */
	public $name = 'Easy Digital Downloads';

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
	 * @since 1.0.0
	 */
	public function init() {

		add_action( 'edd_complete_purchase', array( $this, 'complete_purchase' ), 15 ); // 15 so it runs after the main plugin.
		add_action( 'edd_free_downloads_post_complete_payment', array( $this, 'complete_purchase' ), 15 );
		add_action( 'edd_process_verified_download', array( $this, 'process_download' ), 10, 4 );
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
			'purchased_download'  => array(
				'name'               => __( 'Completed Purchase', 'echodash' ),
				'description'        => __( 'Triggered each time a purchase is completed.', 'echodash' ),
				'post_types'         => array( 'download' ),
				'has_single'         => true,
				'has_global'         => true,
				'option_types'       => array( 'download', 'payment' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => __( 'Download Purchase', 'echodash' ),
					'mappings' => array(
						'download_name'  => '{download:title}',
						'download_price' => '{download:price}',
						'payment_id'     => '{payment:id}',
						'payment_total'  => '{payment:total}',
						'payment_method' => '{payment:payment_method}',
					),
				),
			),
			'downloaded_download' => array(
				'name'               => __( 'Downloaded Download', 'echodash' ),
				'description'        => __( 'Triggered each time a file is downloaded.', 'echodash' ),
				'post_types'         => array( 'download' ),
				'has_single'         => true,
				'has_global'         => true,
				'option_types'       => array( 'download', 'file' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => __( 'File Download', 'echodash' ),
					'mappings' => array(
						'download_name' => '{download:title}',
						'file_name'     => '{file:name}',
						'file_path'     => '{file:file}',
					),
				),
			),
			'discount_used'       => array(
				'name'               => __( 'Discount Used', 'echodash' ),
				'description'        => __( 'Triggered when a discount is used on a completed EDD purchase.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'discount', 'payment' ),
				'enabled_by_default' => false,
				'default_event'      => array(
					'name'     => __( 'Discount Used', 'echodash' ),
					'mappings' => array(
						'discount_code'   => '{discount:code}',
						'discount_amount' => '{discount:amount}',
						'payment_total'   => '{payment:total}',
					),
				),
			),
		);

		return $triggers;
	}

	/**
	 * Triggered when an order is completed.
	 *
	 * @since 1.0.0
	 *
	 * @param int $payment_id The payment ID.
	 */
	public function complete_purchase( $payment_id ) {
		$payment = new EDD_Payment( $payment_id );

		if ( ! $payment->ID || empty( $payment->downloads ) ) {
			return;
		}

		foreach ( $payment->downloads as $download ) {
			$this->track_event(
				'purchased_download',
				array(
					'download' => $download['id'],
					'payment'  => $payment_id,
				)
			);
		}

		// Track discount usage if discounts were used.
		if ( ! empty( $payment->discounts ) ) {
			$discounts = $payment->discounts;
			if ( ! is_array( $discounts ) ) {
				$discounts = array_map( 'trim', explode( ',', (string) $discounts ) );
			} else {
				$discounts = array_map( 'trim', $discounts );
			}
			$discounts = array_filter( array_unique( $discounts ) );
			foreach ( $discounts as $discount_code ) {
				// Remove "none" (EDD sometimes adds this).
				if ( '' === $discount_code || 0 === strcasecmp( $discount_code, 'none' ) ) {
					continue;
				}
				$this->track_event(
					'discount_used',
					array(
						'discount' => $discount_code,
						'payment'  => $payment_id,
					)
				);
			}
		}
	}

	/**
	 * Triggered when a file is downloaded.
	 *
	 * @since 1.0.0
	 *
	 * @param int    $download_id The download ID.
	 * @param string $email       The customer email.
	 * @param int    $payment     The payment ID.
	 * @param array  $args        The download args.
	 */
	public function process_download( $download_id, $email, $payment, $args ) {
		$this->track_event(
			'downloaded_download',
			array(
				'download' => $download_id,
				'file'     => $args['file_key'],
			)
		);
	}

	/**
	 * Gets the payment options.
	 *
	 * @since  1.4.3
	 *
	 * @return array The download options.
	 */
	public function get_payment_options() {

		return array(
			'name'    => __( 'Payment', 'echodash' ),
			'type'    => 'payment',
			'options' => array(
				array(
					'meta'        => 'id',
					'preview'     => 33,
					'placeholder' => __( 'The payment ID', 'echodash' ),
				),
				array(
					'meta'        => 'date_created',
					'preview'     => gmdate( 'Y-m-d', strtotime( 'yesterday' ) ),
					'placeholder' => __( 'The date the payment was created', 'echodash' ),
				),
				array(
					'meta'        => 'status',
					'preview'     => 'processing',
					'placeholder' => __( 'The payment status', 'echodash' ),
				),
				array(
					'meta'        => 'currency',
					'preview'     => 'USD',
					'placeholder' => __( 'The payment currency', 'echodash' ),
				),
				array(
					'meta'        => 'discount_total',
					'preview'     => '52.00',
					'placeholder' => __( 'The total discount amount', 'echodash' ),
				),
				array(
					'meta'        => 'total',
					'preview'     => '235.00',
					'placeholder' => __( 'The payment total', 'echodash' ),
				),
				array(
					'meta'        => 'subtotal',
					'preview'     => '215.00',
					'placeholder' => __( 'The payment subtotal', 'echodash' ),
				),
				array(
					'meta'        => 'payment_method',
					'preview'     => 'Stripe',
					'placeholder' => __( 'The order payment method', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Gets the payment variables.
	 *
	 * @since  1.0.0
	 *
	 * @param  int $payment_id The payment ID.
	 * @return array The payment variables.
	 */
	public function get_payment_vars( $payment_id ) {

		$payment = new EDD_Payment( $payment_id );

		if ( 0 === $payment->ID ) {
			return array();
		}

		return array(
			'payment' => array(
				'id'             => $payment_id,
				'date_created'   => $payment->completed_date,
				'status'         => $payment->status,
				'currency'       => $payment->currency,
				'discount_total' => $payment->discounted_amount,
				'total'          => round( $payment->total, 2 ),
				'subtotal'       => round( $payment->subtotal, 2 ),
				'payment_method' => $payment->gateway,
			),
		);
	}

	/**
	 * Gets the download options.
	 *
	 * @since  1.0.0
	 *
	 * @return array The download options.
	 */
	public function get_download_options() {

		return array(
			'name'    => __( 'Download', 'echodash' ),
			'type'    => 'download',
			'options' => array(
				array(
					'meta'        => 'id',
					'preview'     => 55,
					'placeholder' => __( 'The download ID', 'echodash' ),
				),
				array(
					'meta'        => 'title',
					'preview'     => 'Filename',
					'placeholder' => __( 'The download title', 'echodash' ),
				),
				array(
					'meta'        => 'date_created',
					'preview'     => gmdate( 'Y-m-d', strtotime( '-1 year' ) ),
					'placeholder' => __( 'The date the download was created', 'echodash' ),
				),
				array(
					'meta'        => 'date_modified',
					'preview'     => gmdate( 'Y-m-d', strtotime( '-1 year' ) ),
					'placeholder' => __( 'The download\'s last modified date', 'echodash' ),
				),
				array(
					'meta'        => 'short_description',
					'preview'     => 'This download is cool.',
					'placeholder' => __( 'The download short description', 'echodash' ),
				),
				array(
					'meta'        => 'sku',
					'preview'     => 'KA21',
					'placeholder' => __( 'The download SKU', 'echodash' ),
				),
				array(
					'meta'        => 'price',
					'preview'     => '52.00',
					'placeholder' => __( 'The download price', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Gets the details from the download for merging.
	 *
	 * @since  1.0.0
	 *
	 * @param  int $download_id The download ID.
	 * @return array The product variables.
	 */
	public function get_download_vars( $download_id ) {

		$download = new EDD_Download( $download_id );
		$terms    = wp_get_post_terms( $download_id, 'download_category', array( 'fields' => 'names' ) );

		return array(
			'download' => array(
				'id'            => $download_id,
				'title'         => $download->get_name(),
				'sku'           => $download->sku,
				'date_created'  => $download->post_date,
				'date_modified' => $download->post_modified,
				'price'         => $download->get_price(),
				'categories'    => implode( ', ', $terms ),
			),
		);
	}

	/**
	 * Gets the file options.
	 *
	 * @since  1.0.0
	 *
	 * @return array The product options.
	 */
	public function get_file_options() {

		return array(
			'name'    => __( 'File', 'echodash' ),
			'type'    => 'file',
			'options' => array(
				array(
					'meta'        => 'name',
					'preview'     => 'myfile',
					'placeholder' => __( 'The downloaded file name.', 'echodash' ),
				),
				array(
					'meta'        => 'file',
					'preview'     => 'myfile-1.0.0.zip',
					'placeholder' => __( 'The downloaded file.', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Gets the details from the file for merging.
	 *
	 * @since  1.0.0
	 *
	 * @param  int         $download_id The download ID.
	 * @param  string|bool $file_key    The file key.
	 * @return array       The product variables.
	 */
	public function get_file_vars( $download_id, $file_key = false ) {

		$download = new EDD_Download( $download_id );
		$files    = $download->get_files();

		if ( empty( $files ) ) { // no files yet.
			return array( 'file' => array() );
		}

		if ( $file_key ) {
			$file = $files[ $file_key ];
		} else {
			$file = reset( $files );
		}

		return array(
			'file' => array(
				'name' => $file['name'],
				'file' => basename( $file['file'] ),
			),
		);
	}

	/**
	 * Gets the discount options.
	 *
	 * @since  2.0.0
	 *
	 * @return array The discount options.
	 */
	public function get_discount_options() {

		return array(
			'name'    => __( 'Discount', 'echodash' ),
			'type'    => 'discount',
			'options' => array(
				array(
					'meta'        => 'code',
					'preview'     => 'SAVE20',
					'placeholder' => __( 'The discount code', 'echodash' ),
				),
				array(
					'meta'        => 'amount',
					'preview'     => '20.00',
					'placeholder' => __( 'The discount amount', 'echodash' ),
				),
				array(
					'meta'        => 'type',
					'preview'     => 'percent',
					'placeholder' => __( 'The discount type', 'echodash' ),
				),
				array(
					'meta'        => 'status',
					'preview'     => 'active',
					'placeholder' => __( 'The discount status', 'echodash' ),
				),
				array(
					'meta'        => 'uses',
					'preview'     => 5,
					'placeholder' => __( 'Number of times the discount has been used', 'echodash' ),
				),
				array(
					'meta'        => 'max_uses',
					'preview'     => 100,
					'placeholder' => __( 'The discount usage limit', 'echodash' ),
				),
				array(
					'meta'        => 'min_price',
					'preview'     => '50.00',
					'placeholder' => __( 'The minimum order amount required', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Gets the discount variables.
	 *
	 * @since  2.0.0
	 *
	 * @param  string $discount_code The discount code.
	 * @return array The discount variables.
	 */
	public function get_discount_vars( $discount_code ) {

		$discount_id = edd_get_discount_id_by_code( $discount_code );

		if ( ! $discount_id ) {
			return array();
		}

		$discount = edd_get_discount( $discount_id );

		if ( ! $discount ) {
			return array();
		}

		return array(
			'discount' => array(
				'code'      => $discount->code,
				'amount'    => $discount->amount,
				'type'      => $discount->type,
				'status'    => $discount->status,
				'uses'      => $discount->uses,
				'max_uses'  => $discount->max_uses,
				'min_price' => $discount->min_price,
			),
		);
	}
}

new EchoDash_EDD();
