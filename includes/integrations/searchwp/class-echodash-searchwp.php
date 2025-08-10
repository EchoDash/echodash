<?php
/**
 * SearchWP integration for EchoDash.
 *
 * Provides comprehensive tracking for SearchWP events including:
 * - Search queries with results
 * - Zero-result searches
 *
 * @package EchoDash
 */

defined( 'ABSPATH' ) || exit;

/**
 * SearchWP integration.
 *
 * @since 2.0.0
 */
class EchoDash_SearchWP extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since 2.0.0
	 * @var string $slug
	 */
	public $slug = 'searchwp';

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 2.0.0
	 * @var string $name
	 */
	public $name = 'SearchWP';

	/**
	 * The icon background color for the integration.
	 *
	 * @since 2.0.0
	 * @var string $icon_background_color
	 */
	protected $icon_background_color = '#fafbfb';

	/**
	 * Get things started.
	 *
	 * @since 2.0.0
	 */
	public function init() {
		add_action( 'searchwp\query\ran', array( $this, 'search_query_performed' ), 10, 1 );
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
			'search_performed'  => array(
				'name'               => __( 'Search Performed', 'echodash' ),
				'description'        => __( 'Triggered when a user performs a search using SearchWP.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'search' ),
				'enabled_by_default' => false,
				'default_event'      => array(
					'name'     => __( 'Search Query', 'echodash' ),
					'mappings' => array(
						'search_terms'  => '{search:search_terms}',
						'results_count' => '{search:results_count}',
						'engine_name'   => '{search:engine_name}',
					),
				),
			),
			'search_no_results' => array(
				'name'               => __( 'Search No Results', 'echodash' ),
				'description'        => __( 'Triggered when a user performs a search that returns zero results.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'search' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => __( 'Search No Results', 'echodash' ),
					'mappings' => array(
						'search_terms'  => '{search:search_terms}',
						'engine_name'   => '{search:engine_name}',
					),
				),
			),
		);

		return $triggers;
	}

	/**
	 * Gets the search options.
	 *
	 * @since  2.0.0
	 *
	 * @return array The search options.
	 */
	public function get_search_options() {
		return array(
			'name'    => __( 'SearchWP Query', 'echodash' ),
			'type'    => 'search',
			'options' => array(
				array(
					'meta'        => 'search_terms',
					'preview'     => __( 'wordpress tutorial', 'echodash' ),
					'placeholder' => __( 'The search terms entered by the user', 'echodash' ),
				),
				array(
					'meta'        => 'results_count',
					'preview'     => '42',
					'placeholder' => __( 'The number of results found', 'echodash' ),
				),
				array(
					'meta'        => 'query_time',
					'preview'     => '0.125',
					'placeholder' => __( 'Search execution time in seconds', 'echodash' ),
				),
				array(
					'meta'        => 'engine_name',
					'preview'     => __( 'default', 'echodash' ),
					'placeholder' => __( 'The SearchWP engine used', 'echodash' ),
				),
				array(
					'meta'        => 'timestamp',
					'preview'     => gmdate( 'Y-m-d H:i:s' ),
					'placeholder' => __( 'When the search was performed', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Handle search query performed event.
	 *
	 * @since 2.0.0
	 *
	 * @param object $query The SearchWP Query object.
	 */
	public function search_query_performed( $query ) {
		if ( empty( $query ) || ! method_exists( $query, 'get_keywords' ) ) {
			return;
		}

		// Get search data.
		$search_terms  = $query->get_keywords();
		$results_count = isset( $query->found_results ) ? (int) $query->found_results : 0;
		$query_time    = isset( $query->query_time ) ? (float) $query->query_time : 0;
		$engine_name   = method_exists( $query, 'get_engine' ) && method_exists( $query->get_engine(), 'get_name' ) ? $query->get_engine()->get_name() : 'default';

		// Create search data array.
		$search_data = array(
			'search_terms'  => $search_terms,
			'results_count' => $results_count,
			'query_time'    => $query_time,
			'engine_name'   => $engine_name,
			'timestamp'     => current_time( 'mysql' ),
		);

		// Determine which trigger to fire.
		if ( $results_count > 0 ) {
			// Track successful search.
			$this->track_event(
				'search_performed',
				array(),
				array(
					'search' => $search_data,
				)
			);
		} else {
			// Track zero results search.
			$this->track_event(
				'search_no_results',
				array(),
				array(
					'search' => $search_data,
				)
			);
		}
	}
}

new EchoDash_SearchWP();
