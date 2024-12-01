<?php

defined( 'ABSPATH' ) || exit;

/**
 * Gamipress integration.
 *
 * @since 1.2.0
 */
class EchoDash_GamiPress extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since 1.2.0
	 * @var string $slug
	 */
	public $slug = 'gamipress';

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 1.2.0
	 * @var string $name
	 */
	public $name = 'GamiPress';

	/**
	 * Get things started
	 *
	 * @access public
	 * @return void
	 */
	public function init() {

		// Points.
		add_action( 'gamipress_update_user_points', array( $this, 'points_updated' ), 10, 8 );

		// Achievements.
		add_action( 'gamipress_award_achievement', array( $this, 'user_complete_achievement' ), 10, 5 );
		add_action( 'gamipress_revoke_achievement_to_user', array( $this, 'user_revoke_achievement' ), 10, 3 );

		// Ranks.
		add_action( 'gamipress_update_user_rank', array( $this, 'update_user_rank' ), 10, 2 );
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
			'points_earned'       => array(
				'name'               => __( 'Points Earned', 'echodash' ),
				'description'        => __( 'Triggered each time that points are earned.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'points' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => 'Points Earned',
					'mappings' => array(
						'points_earned' => '{points:new_points}',
						'total_points'  => '{points:total_points}',
					),
				),
			),
			'rank_earned'         => array(
				'name'               => __( 'Rank Earned', 'echodash' ),
				'description'        => __( 'Triggered each time a rank is earned.', 'echodash' ),
				'post_types'         => array_keys( GamiPress()->rank_types ),
				'has_single'         => true,
				'has_global'         => true,
				'option_types'       => array( 'rank' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => 'Rank Earned',
					'mappings' => array(
						'rank_name'            => '{rank:rank_name}',
						'congratulations_text' => '{rank:congratulations_text}',
						'points_required'      => '{rank:points_to_unlock}',
					),
				),
			),
			'achievement_earned'  => array(
				'name'               => __( 'Achievement Earned', 'echodash' ),
				'description'        => __( 'Triggered each time that an achievement is earned.', 'echodash' ),
				'post_types'         => array_keys( GamiPress()->achievement_types ),
				'has_single'         => true,
				'has_global'         => true,
				'option_types'       => array( 'achievement' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => 'Achievement Earned',
					'mappings' => array(
						'achievement_name'     => '{achievement:achievement_name}',
						'congratulations_text' => '{achievement:congratulations_text}',
						'points_awarded'       => '{achievement:points_awarded}',
					),
				),
			),
			'achievement_revoked' => array(
				'name'         => __( 'Achievement Revoked', 'echodash' ),
				'description'  => __( 'Triggered each time that an achievement is revoked.', 'echodash' ),
				'post_types'   => array_keys( GamiPress()->achievement_types ),
				'has_single'   => true,
				'has_global'   => true,
				'option_types' => array( 'achievement' ),
			),
		);

		return $triggers;
	}

	/**
	 * Triggered when a rank has been updated.
	 *
	 * @since 1.2.0
	 *
	 * @param int     $user_id The user ID.
	 * @param WP_Post $rank    The rank.
	 */
	public function update_user_rank( $user_id, $rank ) {
		$this->track_event(
			'rank_earned',
			array(
				'rank' => $rank->ID,
				'user' => $user_id,
			)
		);
	}

	/**
	 * Triggered when a user complete an achievement.
	 *
	 * @since 1.2.0
	 *
	 * @param int    $user_id        The user ID.
	 * @param int    $achievement_id The achievement ID.
	 * @param string $trigger        The trigger.
	 * @param int    $site_id        The site ID.
	 * @param array  $args           The args.
	 */
	public function user_complete_achievement( $user_id, $achievement_id, $trigger, $site_id, $args ) {
		// Check if it's an achievement
		if ( ! get_post_type( $achievement_id ) || get_post_type( $achievement_id ) === 'points-award' ) {
			return;
		}

		$this->track_event(
			'achievement_earned',
			array(
				'achievement' => $achievement_id,
				'user'        => $user_id,
			)
		);
	}

	/**
	 * Triggered when an achievement has been revoked.
	 *
	 * @since 1.2.0
	 *
	 * @param int $user_id        The user ID.
	 * @param int $achievement_id The achievement ID.
	 * @param int $earning_id     The earning ID.
	 */
	public function user_revoke_achievement( $user_id, $achievement_id, $earning_id ) {
		// Check if it's an achievement
		if ( ! get_post_type( $achievement_id ) || get_post_type( $achievement_id ) === 'points-award' ) {
			return;
		}

		$this->track_event(
			'achievement_revoked',
			array(
				'achievement' => $achievement_id,
				'user'        => $user_id,
			)
		);
	}

	/**
	 * Triggered when points has been updated.
	 *
	 * @since 1.2.0
	 *
	 * @param int    $user_id        The user ID.
	 * @param int    $new_points     The points added.
	 * @param int    $total_points   The total points.
	 * @param int    $admin_id       The administrator ID.
	 * @param int    $achievement_id The achievement ID.
	 * @param string $points_type    The points type.
	 * @param string $reason         The reason.
	 * @param string $log_type       The log type.
	 */
	public function points_updated( $user_id, $new_points, $total_points, $admin_id, $achievement_id, $points_type, $reason, $log_type ) {
		$this->track_event(
			'points_earned',
			array(
				'user'   => $user_id,
				'points' => $new_points,
			),
			array(
				'points' => array(
					'total'  => $total_points,
					'type'   => $points_type,
					'reason' => $reason,
				),
			)
		);
	}


	/**
	 * Gets the rank options.
	 *
	 * @since  1.2.0
	 *
	 * @return array The rank options.
	 */
	public function get_rank_options() {

		return array(
			'name'    => __( 'Rank', 'wp-fus ion-event-tracking' ),
			'type'    => 'rank',
			'options' => array(
				array(
					'meta'        => 'rank_name',
					'preview'     => 'Rank Name',
					'placeholder' => __( 'The Rank name', 'echodash' ),
				),
				array(
					'meta'        => 'congratulations_text',
					'preview'     => 'Congratulations!',
					'placeholder' => __( 'The Congratulations Text', 'echodash' ),
				),
				array(
					'meta'        => 'points_to_unlock',
					'preview'     => 50,
					'placeholder' => __( 'The points to unlock the rank', 'echodash' ),
				),
				array(
					'meta'        => 'priority',
					'preview'     => 1,
					'placeholder' => __( 'The Rank Priority', 'echodash' ),
				),

			),
		);
	}


	/**
	 * Gets the rank variables.
	 *
	 * @since  1.2.0
	 *
	 * @param  int $rank_id The rank ID.
	 * @return array The rank variables.
	 */
	public function get_rank_vars( $rank_id ) {
		$rank        = get_post( $rank_id );
		$rank_fields = array(
			'rank_name'            => get_the_title( $rank_id ),
			'congratulations_text' => get_post_meta( $rank_id, '_gamipress_congratulations_text', true ),
			'points_to_unlock'     => get_post_meta( $rank_id, '_gamipress_points_to_unlock', true ),
			'priority'             => $rank->menu_order,
		);

		return array(
			'rank' => $rank_fields,
		);
	}

	/**
	 * Gets the achievement options.
	 *
	 * @since  1.2.0
	 *
	 * @return array The achievement options.
	 */
	public function get_achievement_options() {

		return array(
			'name'    => __( 'Achievement', 'wp-fus ion-event-tracking' ),
			'type'    => 'achievement',
			'options' => array(
				array(
					'meta'        => 'achievement_name',
					'preview'     => 'Ach Name',
					'placeholder' => __( 'The achievement name', 'echodash' ),
				),
				array(
					'meta'        => 'congratulations_text',
					'preview'     => 'Congratulations!',
					'placeholder' => __( 'The Congratulations Text', 'echodash' ),
				),
				array(
					'meta'        => 'points_awarded',
					'preview'     => 50,
					'placeholder' => __( 'The points awarded', 'echodash' ),
				),
				array(
					'meta'        => 'earned_by',
					'preview'     => 'admin',
					'placeholder' => __( 'Achievement earned by', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Gets the achievement variables.
	 *
	 * @since  1.2.0
	 *
	 * @param  int $achievement_id The achievement ID.
	 * @return array The achievement variables.
	 */
	public function get_achievement_vars( $achievement_id ) {
		$achievement_fields = array(
			'achievement_name'      => get_the_title( $achievement_id ),
			'congratulations_text'  => get_post_meta( $achievement_id, '_gamipress_congratulations_text', true ),
			'points_awarded'        => get_post_meta( $achievement_id, '_gamipress_points', true ),
			'earned_by'             => get_post_meta( $achievement_id, '_gamipress_earned_by', true ),
			'achievement_image_url' => ( has_post_thumbnail( $achievement_id ) ? get_the_post_thumbnail_url( $achievement_id ) : '' ),
		);

		return array(
			'achievement' => $achievement_fields,
		);
	}



	/**
	 * Gets the points options.
	 *
	 * @since  1.2.0
	 *
	 * @return array The points options.
	 */
	public function get_points_options() {

		return array(
			'name'    => __( 'Points', 'wp-fus ion-event-tracking' ),
			'type'    => 'points',
			'options' => array(
				array(
					'meta'        => 'new_points',
					'preview'     => 5,
					'placeholder' => __( 'The new points added', 'echodash' ),
				),
				array(
					'meta'        => 'total_points',
					'preview'     => 33,
					'placeholder' => __( 'The total points', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Gets the points variables.
	 *
	 * @since  1.2.0
	 *
	 * @param  int    $user_id The user ID.
	 * @param string $key The user meta key.
	 * @return array The points variables.
	 */
	public function get_points_vars( $user_id, $key ) {
		$points_fields = array(
			'new_points'   => get_user_meta( $user_id, $key . '_new_points', true ),
			'total_points' => get_user_meta( $user_id, $key . '_points', true ),
		);

		return array(
			'points' => $points_fields,
		);
	}
}

new EchoDash_GamiPress();
