<?php
/**
 * PrettyLinks integration for EchoDash.
 *
 * Provides comprehensive tracking for PrettyLinks events including:
 * - Outbound link clicks and redirects
 *
 * @package EchoDash
 */

defined( 'ABSPATH' ) || exit;

/**
 * PrettyLinks integration.
 *
 * @since 2.0.0
 */
class EchoDash_Pretty_Links extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since 2.0.0
	 * @var string $slug
	 */
	public $slug = 'pretty-links';

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 2.0.0
	 * @var string $name
	 */
	public $name = 'Pretty Links';

	/**
	 * The icon background color for the integration.
	 *
	 * @since 2.0.0
	 * @var string $icon_background_color
	 */
	protected $icon_background_color = '#004af2';

	/**
	 * Get things started.
	 *
	 * @since 2.0.0
	 */
	public function init() {
		add_action( 'prli_record_click', array( $this, 'outbound_link_clicked' ), 10 );
	}

	/**
	 * Gets the triggers for the integration.
	 *
	 * @access protected
	 *
	 * @since  2.0.0
	 *
	 * @return array The triggers.
	 */
	protected function setup_triggers() {
		$triggers = array(
			'outbound_link_clicked' => array(
				'name'               => __( 'Outbound Link Clicked', 'echodash' ),
				'description'        => __( 'Triggered when a user clicks on a PrettyLinks shortened URL.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'link' ),
				'enabled_by_default' => false,
				'default_event'      => array(
					'name'     => __( 'Outbound Link Click', 'echodash' ),
					'mappings' => array(
						'link_name'   => '{link:name}',
						'short_url'   => '{link:short_url}',
						'target_url'  => '{link:target_url}',
						'click_count' => '{link:click_count}',
					),
				),
			),
		);

		return $triggers;
	}

	/**
	 * Gets the link options.
	 *
	 * @since  2.0.0
	 *
	 * @return array The link options.
	 */
	public function get_link_options() {
		return array(
			'name'    => __( 'Pretty Link', 'echodash' ),
			'type'    => 'link',
			'options' => array(
				array(
					'meta'        => 'name',
					'preview'     => __( 'My Awesome Link', 'echodash' ),
					'placeholder' => __( 'The link name or title', 'echodash' ),
				),
				array(
					'meta'        => 'short_url',
					'preview'     => home_url( '/go/link' ),
					'placeholder' => __( 'The shortened PrettyLink URL', 'echodash' ),
				),
				array(
					'meta'        => 'target_url',
					'preview'     => 'https://destination.com/page',
					'placeholder' => __( 'The target destination URL', 'echodash' ),
				),
				array(
					'meta'        => 'click_count',
					'preview'     => '42',
					'placeholder' => __( 'The total click count for this link', 'echodash' ),
				),
				array(
					'meta'        => 'created_date',
					'preview'     => gmdate( 'Y-m-d H:i:s' ),
					'placeholder' => __( 'The date the link was created', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Handle outbound link click event.
	 *
	 * @since 2.0.0
	 *
	 * @param array $click_data Click data array with link_id, click_id, and url.
	 */
	public function outbound_link_clicked( $click_data ) {
		if ( empty( $click_data['link_id'] ) ) {
			return;
		}

		$this->track_event(
			'outbound_link_clicked',
			array(
				'link' => $click_data['link_id'],
			),
		);
	}

	/**
	 * Gets the link variables.
	 *
	 * @since 2.0.0
	 *
	 * @param int $link_id The link ID.
	 * @return array The link variables.
	 */
	public function get_link_vars( $link_id ) {
		global $prli_link;

		if ( empty( $link_id ) || ! isset( $prli_link ) ) {
			return array();
		}

		// Use PrettyLinks built-in method to get link data with stats.
		$link = $prli_link->getOne( $link_id, OBJECT, true );

		if ( ! $link ) {
			return array();
		}

		// Use PrettyLinks built-in function to get the pretty URL.
		$short_url = function_exists( 'prli_get_pretty_link_url' ) ? prli_get_pretty_link_url( $link_id ) : $link->pretty_url;

		return array(
			'link' => array(
				'name'         => ! empty( $link->name ) ? $link->name : $link->slug,
				'short_url'    => $short_url,
				'target_url'   => $link->url,
				'click_count'  => isset( $link->clicks ) ? (int) $link->clicks : 0,
				'created_date' => $link->created_at,
			),
		);
	}
}

new EchoDash_Pretty_Links();
