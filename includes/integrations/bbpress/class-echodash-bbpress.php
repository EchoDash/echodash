<?php
/**
 * BbPress integration for EchoDash.
 *
 * @package EchoDash
 */

defined( 'ABSPATH' ) || exit;

/**
 * BbPress integration.
 *
 * @since 1.2.0
 */
class EchoDash_BbPress extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since 1.2.0
	 * @var string $slug
	 */

	public $slug = 'bbpress';

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 1.2.0
	 * @var string $name
	 */
	public $name = 'bbPress';

	/**
	 * The icon background color for EchoDash's module tracking.
	 *
	 * @since 2.0.0
	 * @var string $icon_background_color
	 */
	protected $icon_background_color = '#8fc970';

	/**
	 * Get things started.
	 *
	 * @since 1.2.0
	 */
	public function init() {

		add_action( 'bbp_new_topic', array( $this, 'topic_created' ), 10, 4 );
		add_action( 'bbp_new_reply', array( $this, 'reply_created' ), 10, 5 );
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
			'topic_created'       => array(
				'name'               => __( 'New Topic', 'echodash' ),
				'description'        => __( 'Triggered each time a single topic is created.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'topic', 'forum' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => 'Forum Topic Created',
					'mappings' => array(
						'topic_title' => '{topic:post_title}',
						'forum_name'  => '{forum:post_title}',
					),
				),
			),
			'topic_reply_created' => array(
				'name'               => __( 'New Reply', 'echodash' ),
				'description'        => __( 'Triggered each time a single topic reply is created.', 'echodash' ),
				'post_types'         => array( 'reply' ),
				'has_single'         => true,
				'has_global'         => true,
				'option_types'       => array( 'reply', 'topic', 'forum' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => 'Topic Reply Created',
					'mappings' => array(
						'reply_title' => '{reply:post_title}',
						'topic_title' => '{topic:post_title}',
						'forum_name'  => '{forum:post_title}',
					),
				),
			),
			'forum_topic_created' => array(
				'name'         => __( 'New Forum Topic', 'echodash' ),
				'description'  => __( 'Triggered each time a single topic is created in the selected forum.', 'echodash' ),
				'has_single'   => true,
				'post_types'   => array( 'forum' ),
				'option_types' => array( 'topic', 'forum' ),
			),
		);

		return $triggers;
	}

	/**
	 * Track when a new topic is created.
	 *
	 * @since 1.2.0
	 *
	 * @param int $topic_id The topic ID.
	 */
	public function topic_created( $topic_id ) {
		$topic = get_post( $topic_id );

		$this->track_event(
			'topic_created',
			array(
				'topic' => $topic_id,
				'forum' => $topic->post_parent,
				'user'  => $topic->post_author,
			)
		);
	}

	/**
	 * Track when a new reply is created.
	 *
	 * @since 1.2.0
	 *
	 * @param int $reply_id The reply ID.
	 */
	public function reply_created( $reply_id ) {
		$reply = get_post( $reply_id );
		$topic = get_post( $reply->post_parent );

		$this->track_event(
			'reply_created',
			array(
				'reply' => $reply_id,
				'topic' => $reply->post_parent,
				'forum' => $topic->post_parent,
				'user'  => $reply->post_author,
			)
		);
	}


	/**
	 * Gets the topic options.
	 *
	 * @since  1.2.0
	 *
	 * @return array The order options.
	 */
	public function get_topic_options() {

		return array(
			'name'    => __( 'Topic', 'echodash' ),
			'type'    => 'topic',
			'options' => array(
				array(
					'meta'        => 'ID',
					'preview'     => 33,
					'placeholder' => __( 'The topic ID', 'echodash' ),
				),
				array(
					'meta'        => 'post_title',
					'preview'     => 'Topic Title',
					'placeholder' => __( 'The topic title', 'echodash' ),
				),
				array(
					'meta'        => 'post_content',
					'preview'     => 'Topic body',
					'placeholder' => __( 'The topic body', 'echodash' ),
				),
				array(
					'meta'        => 'post_status',
					'preview'     => 'open',
					'placeholder' => __( 'The topic status', 'echodash' ),
				),
				array(
					'meta'        => 'post_date',
					'preview'     => gmdate( 'Y-m-d', strtotime( 'yesterday' ) ),
					'placeholder' => __( 'The date the topic was created', 'echodash' ),
				),
				array(
					'meta'        => 'post_modified',
					'preview'     => gmdate( 'Y-m-d', strtotime( '-3 hours' ) ),
					'placeholder' => __( 'The topic\'s last modified date', 'echodash' ),
				),

			),
		);
	}

	/**
	 * Gets the topic variables.
	 *
	 * @since  1.2.0
	 *
	 * @param  int $topic_id The topic ID.
	 * @return array The topic variables.
	 */
	public function get_topic_vars( $topic_id ) {

		$topic = get_post( $topic_id, 'ARRAY_A' );
		if ( empty( $topic ) ) {
			return array();
		}

		$topic_fields = array();

		$meta_column = array_column( $this->get_topic_options()['options'], 'meta' );

		// Post/meta fields.
		foreach ( $meta_column as $meta_key ) {
			if ( isset( $topic[ $meta_key ] ) && '' !== $topic[ $meta_key ] ) {
				$topic_fields[ $meta_key ] = $topic[ $meta_key ];
			}
		}

		return array(
			'topic' => $topic_fields,
		);
	}

	/**
	 * Gets the reply options.
	 *
	 * @since  1.2.0
	 *
	 * @return array The reply options.
	 */
	public function get_reply_options() {

		return array(
			'name'    => __( 'Reply', 'echodash' ),
			'type'    => 'reply',
			'options' => array(
				array(
					'meta'        => 'ID',
					'preview'     => 33,
					'placeholder' => __( 'The reply ID', 'echodash' ),
				),
				array(
					'meta'        => 'post_title',
					'preview'     => 'Reply title',
					'placeholder' => __( 'The reply topic title', 'echodash' ),
				),
				array(
					'meta'        => 'post_content',
					'preview'     => 'Reply body',
					'placeholder' => __( 'The Reply body', 'echodash' ),
				),
				array(
					'meta'        => 'post_status',
					'preview'     => 'open',
					'placeholder' => __( 'The Reply status', 'echodash' ),
				),
				array(
					'meta'        => 'post_date',
					'preview'     => gmdate( 'Y-m-d', strtotime( 'yesterday' ) ),
					'placeholder' => __( 'The date the reply was created', 'echodash' ),
				),
				array(
					'meta'        => 'post_modified',
					'preview'     => gmdate( 'Y-m-d', strtotime( '-3 hours' ) ),
					'placeholder' => __( 'The reply\'s last modified date', 'echodash' ),
				),

			),
		);
	}

	/**
	 * Gets the reply variables.
	 *
	 * @since  1.2.0
	 *
	 * @param  int $reply_id The reply ID.
	 * @return array The reply variables.
	 */
	public function get_reply_vars( $reply_id ) {

		$reply = get_post( $reply_id, 'ARRAY_A' );
		if ( empty( $reply ) ) {
			return array();
		}

		$reply_fields = array();

		$meta_column = array_column( $this->get_reply_options()['options'], 'meta' );

		// Post/meta fields.
		foreach ( $meta_column as $meta_key ) {
			if ( isset( $reply[ $meta_key ] ) && '' !== $reply[ $meta_key ] ) {
				$reply_fields[ $meta_key ] = $reply[ $meta_key ];
			}
		}

		return array(
			'reply' => $reply_fields,
		);
	}

	/**
	 * Gets the forum options.
	 *
	 * @since  1.2.0
	 *
	 * @return array The order options.
	 */
	public function get_forum_options() {

		return array(
			'name'    => __( 'Forum', 'echodash' ),
			'type'    => 'forum',
			'options' => array(
				array(
					'meta'        => 'ID',
					'preview'     => 33,
					'placeholder' => __( 'The forum ID', 'echodash' ),
				),
				array(
					'meta'        => 'post_title',
					'preview'     => 'Forum Title',
					'placeholder' => __( 'The forum title', 'echodash' ),
				),
				array(
					'meta'        => '_bbp_status',
					'preview'     => 'open',
					'placeholder' => __( 'The forum status', 'echodash' ),
				),
				array(
					'meta'        => 'post_date',
					'preview'     => gmdate( 'Y-m-d', strtotime( 'yesterday' ) ),
					'placeholder' => __( 'The date the forum was created', 'echodash' ),
				),
				array(
					'meta'        => 'post_modified',
					'preview'     => gmdate( 'Y-m-d', strtotime( '-3 hours' ) ),
					'placeholder' => __( 'The forum\'s last modified date', 'echodash' ),
				),

			),
		);
	}

	/**
	 * Gets the forum variables.
	 *
	 * @since  1.2.0
	 *
	 * @param  int $forum_id The forum ID.
	 * @return array The forum variables.
	 */
	public function get_forum_vars( $forum_id ) {

		$forum = get_post( $forum_id, 'ARRAY_A' );

		if ( empty( $forum ) ) {
			return array();
		}

		$forum_fields = array();

		$meta_column = array_column( $this->get_forum_options()['options'], 'meta' );

		// Post/meta fields.
		foreach ( $meta_column as $meta_key ) {
			if ( isset( $forum[ $meta_key ] ) && '' !== $forum[ $meta_key ] ) {
				$forum_fields[ $meta_key ] = $forum[ $meta_key ];
			}
		}

		$forum_fields['_bbp_status'] = get_post_meta( $forum_id, '_bbp_status', true );

		if ( empty( $forum_fields['_bbp_status'] ) ) {
			$forum_fields['_bbp_status'] = 'open';
		}

		return array(
			'forum' => $forum_fields,
		);
	}
}

new EchoDash_BbPress();
