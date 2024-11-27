<?php

defined( 'ABSPATH' ) || exit;
/**
 * Presto Player integration.
 *
 * @since 1.2.0
 */
class EchoDash_Presto_Player extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since 1.2.0
	 * @var string $slug
	 */

	public $slug = 'presto-player';

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 1.2.0
	 * @var string $name
	 */
	public $name = 'Presto Player';

	/**
	 * Get things started.
	 *
	 * @since 1.2.0
	 */
	public function init() {
		add_action( 'presto_player_progress', array( $this, 'video_progress' ), 10, 3 );
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
			'video_play'     => array(
				'name'         => __( 'Video Play', 'echodash' ),
				'description'  => __( 'Triggered when a video is played.', 'echodash' ),
				'post_types'   => array( 'pp_video_block' ),
				'has_single'   => true,
				'has_global'   => true,
				'option_types' => array( 'video' ),
			),
			'video_complete' => array(
				'name'         => __( 'Video Complete', 'echodash' ),
				'description'  => __( 'Triggered when a video is watched to completion.', 'echodash' ),
				'post_types'   => array( 'pp_video_block' ),
				'has_single'   => true,
				'has_global'   => true,
				'option_types' => array( 'video' ),
			),
		);

		return $triggers;
	}

	/**
	 * Track video progression.
	 *
	 * @since  1.2.0
	 * @param integer $video_id The video id.
	 * @param integer $percent The video precentage.
	 * @param integer $visit_time The visit time.
	 */
	public function video_progress( $video_id, $percent, $visit_time ) {
		$user = wp_get_current_user();

		if ( ! $user->exists() ) {
			return;
		}

		$post_id = $this->get_post_id( $video_id );

		if ( 0 === $post_id ) {
			return;
		}

		// Video Play
		if ( 0 === $percent ) {
			$this->track_event(
				'video_play',
				array(
					'video' => $video_id,
					'post'  => $post_id,
					'user'  => $user->ID,
				)
			);
		}

		// Video Complete
		if ( 100 === $percent ) {
			$this->track_event(
				'video_complete',
				array(
					'video' => $video_id,
					'post'  => $post_id,
					'user'  => $user->ID,
				)
			);
		}
	}

	/**
	 * Get post ID by video ID.
	 *
	 * @since  1.2.0
	 * @param int $video_id The video id.
	 * @return int The post ID.
	 */
	public function get_post_id( $video_id ) {
		$post_id = wp_cache_get( $video_id, 'ecd_pp_vids' );

		if ( false !== $post_id ) {
			return $post_id;
		}

		global $wpdb;
		$sql     = $wpdb->prepare(
			"SELECT post_id FROM {$wpdb->prefix}presto_player_videos WHERE id = %d",
			absint( $video_id )
		);
		$post_id = intval( $wpdb->get_var( $sql ) );

		wp_cache_set( $video_id, $post_id, 'ecd_pp_vids', 3600 ); // 1 hour in seconds

		return $post_id;
	}


	/**
	 * Gets the video options.
	 *
	 * @since  1.2.0
	 *
	 * @return array The video options.
	 */
	public function get_video_options() {

		return array(
			'name'    => __( 'Video Play', 'echodash' ),
			'type'    => 'video',
			'options' => array(
				array(
					'meta'        => 'ID',
					'preview'     => 33,
					'placeholder' => __( 'The video ID', 'echodash' ),
				),
				array(
					'meta'        => 'post_title',
					'preview'     => 'Video Title',
					'placeholder' => __( 'The video title', 'echodash' ),
				),
				array(
					'meta'        => 'post_status',
					'preview'     => 'published',
					'placeholder' => __( 'The video status', 'echodash' ),
				),
				array(
					'meta'        => 'post_date',
					'preview'     => gmdate( 'Y-m-d', strtotime( 'yesterday' ) ),
					'placeholder' => __( 'The date the video was created', 'echodash' ),
				),
				array(
					'meta'        => 'post_modified',
					'preview'     => gmdate( 'Y-m-d', strtotime( '-3 hours' ) ),
					'placeholder' => __( 'The video\'s last modified date', 'echodash' ),
				),
				array(
					'meta'        => 'src',
					'preview'     => home_url() . '/video.mp4',
					'placeholder' => __( 'The video src', 'echodash' ),
				),
				array(
					'meta'        => 'video_id',
					'preview'     => 35,
					'placeholder' => __( 'The video ID', 'echodash' ),
				),

				array(
					'meta'        => 'video_poster',
					'preview'     => home_url() . '/poster.png',
					'placeholder' => __( 'The video poster', 'echodash' ),
				),

			),
		);
	}

	/**
	 * Gets the details from the video for merging.
	 *
	 * @since  1.2.0
	 *
	 * @param  int $post_id The post ID.
	 * @param  int $video_id The video ID.
	 * @return array The video variables.
	 */
	public function get_video_vars( $post_id, $video_id = false ) {
		$post = get_post( $post_id, 'ARRAY_A' );
		if ( empty( $post ) ) {
			return array();
		}

		// Post fields.
		$meta_column  = array_column( $this->get_video_options()['options'], 'meta' );
		$video_fields = wp_array_slice_assoc( $post, $meta_column );

		// Custom fields.
		$blocks = parse_blocks( $post['post_content'] );
		foreach ( $blocks as $block ) {
			// inside wrapper block.
			if ( 'presto-player/reusable-edit' === $block['blockName'] && ! empty( $block['innerBlocks'] ) ) {
				foreach ( $block['innerBlocks'] as $inner_block ) {
					// Sometimes one post has multiple videos that's why we passed $video_id to get the correct values.
					if ( false !== $video_id && intval( $inner_block['attrs']['id'] ) !== intval( $video_id ) ) {
						continue;
					}
					if ( ! empty( $inner_block['attrs']['id'] ) ) {
						$video_fields['video_id'] = $inner_block['attrs']['id'];
					}
					if ( ! empty( $inner_block['attrs']['src'] ) ) {
						$video_fields['src'] = $inner_block['attrs']['src'];
					}
					if ( ! empty( $inner_block['attrs']['poster'] ) ) {
						$video_fields['poster'] = $inner_block['attrs']['poster'];
					}
					break;
				}
			}
		}

		return array(
			'video' => $video_fields,
		);
	}
}

new EchoDash_Presto_Player();
