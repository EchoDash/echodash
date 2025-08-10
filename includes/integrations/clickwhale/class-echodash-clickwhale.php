<?php
/**
 * ClickWhale integration for EchoDash.
 *
 * Provides comprehensive tracking for ClickWhale events including:
 * - Outbound link clicks and redirects
 *
 * @package EchoDash
 */

defined( 'ABSPATH' ) || exit;

/**
 * ClickWhale integration.
 *
 * @since 2.0.0
 */
class EchoDash_ClickWhale extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since 2.0.0
	 * @var string $slug
	 */
	public $slug = 'clickwhale';

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 2.0.0
	 * @var string $name
	 */
	public $name = 'ClickWhale';

	/**
	 * The icon background color for the integration.
	 *
	 * @since 2.0.0
	 * @var string $icon_background_color
	 */
	protected $icon_background_color = '#fdd131';

	/**
	 * Get things started.
	 *
	 * @since 2.0.0
	 */
	public function init() {
		add_action( 'clickwhale/link_clicked', array( $this, 'outbound_link_clicked' ), 10, 3 );
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
				'description'        => __( 'Triggered when a user clicks on a ClickWhale shortened link.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'link' ),
				'enabled_by_default' => false,
				'default_event'      => array(
					'name'     => __( 'Outbound Link Click', 'echodash' ),
					'mappings' => array(
						'link_title'    => '{link:title}',
						'short_url'     => '{link:short_url}',
						'target_url'    => '{link:target_url}',
						'click_count'   => '{link:click_count}',
						'category_name' => '{link:category_name}',
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
			'name'    => __( 'ClickWhale Link', 'echodash' ),
			'type'    => 'link',
			'options' => array(
				array(
					'meta'        => 'title',
					'preview'     => __( 'My Awesome Link', 'echodash' ),
					'placeholder' => __( 'The link title', 'echodash' ),
				),
				array(
					'meta'        => 'short_url',
					'preview'     => home_url( '/go/awesome-link' ),
					'placeholder' => __( 'The shortened ClickWhale URL', 'echodash' ),
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
					'meta'        => 'description',
					'preview'     => __( 'A description of this link...', 'echodash' ),
					'placeholder' => __( 'The link description', 'echodash' ),
				),
				array(
					'meta'        => 'category_name',
					'preview'     => __( 'Marketing Links', 'echodash' ),
					'placeholder' => __( 'The category this link belongs to', 'echodash' ),
				),
				array(
					'meta'        => 'created_at',
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
	 * @param array $link    The complete link data array from ClickWhale.
	 * @param int   $link_id The ClickWhale link ID.
	 * @param int   $user_id The user ID who clicked the link (0 if not logged in).
	 */
	public function outbound_link_clicked( $link, $link_id, $user_id ) {
		if ( empty( $link_id ) || empty( $link ) ) {
			return;
		}

		$this->track_event(
			'outbound_link_clicked',
			array(
				'link' => $link_id,
				'user' => $user_id,
			)
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
		if ( empty( $link_id ) || ! function_exists( 'clickwhale' ) ) {
			return array();
		}

		// Use ClickWhale's built-in helper method to get link data.
		if ( ! class_exists( 'clickwhale\includes\helpers\Links_Helper' ) ) {
			return array();
		}

		$link = clickwhale\includes\helpers\Links_Helper::get_by_id( $link_id );

		if ( empty( $link ) ) {
			return array();
		}

		// Build the short URL.
		$short_url = home_url( '/' . ( $link['slug'] ?? '' ) );

		// Get category names if available (categories are stored as comma-separated IDs).
		$category_name = '';
		if ( ! empty( $link['categories'] ) && class_exists( 'clickwhale\includes\helpers\Categories_Helper' ) ) {
			$category_ids   = array_map( 'trim', explode( ',', $link['categories'] ) );
			$category_names = array();

			foreach ( $category_ids as $category_id ) {
				if ( ! empty( $category_id ) && is_numeric( $category_id ) ) {
					$category = clickwhale\includes\helpers\Categories_Helper::get_by_id( (int) $category_id );
					if ( ! empty( $category['title'] ) ) {
						$category_names[] = $category['title'];
					}
				}
			}

			if ( ! empty( $category_names ) ) {
				$category_name = implode( ', ', $category_names );
			}
		}

		// Get click count from database since it's not in the hook data.
		// Uses ClickWhale's track table with event_type='click' filter.
		$click_count = 0;
		global $wpdb;
		$track_table = $wpdb->prefix . 'clickwhale_track';
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$click_count = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM %i WHERE link_id = %d AND event_type = 'click'",
				$track_table,
				$link_id
			)
		);

		return array(
			'link' => array(
				'title'         => $link['title'],
				'short_url'     => $short_url,
				'target_url'    => $link['url'],
				'click_count'   => $click_count,
				'description'   => $link['description'],
				'category_name' => $category_name,
				'created_at'    => $link['created_at'],
			),
		);
	}
}

new EchoDash_ClickWhale();
