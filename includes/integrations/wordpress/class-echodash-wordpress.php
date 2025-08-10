<?php
/**
 * WordPress core integration for EchoDash.
 *
 * Provides comprehensive tracking for WordPress core events including:
 * - Comment posting and replies
 * - Post publishing, updates, and status changes
 * - WordPress core and plugin updates
 *
 * @package EchoDash
 */

defined( 'ABSPATH' ) || exit;

/**
 * WordPress core integration.
 *
 * @since 1.1.0
 */
class EchoDash_WordPress extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since 1.1.0
	 * @var string $slug
	 */
	public $slug = 'wordpress'; // phpcs:disable WordPress.WP.CapitalPDangit.MisspelledInText

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 1.1.0
	 * @var string $name
	 */
	public $name = 'WordPress';

	/**
	 * Cache for post IDs that have already fired events in this request.
	 *
	 * @since 2.0.0
	 * @var array $processed_posts
	 */
	private $processed_posts = array();

	/**
	 * Get things started.
	 *
	 * @since 1.1.0
	 */
	public function init() {
		add_action( 'upgrader_process_complete', array( $this, 'upgrader_process_complete' ), 10, 2 );
		add_action( 'comment_post', array( $this, 'comment_post' ), 10, 3 );
		add_action( 'wp_insert_comment', array( $this, 'wp_insert_comment' ), 10, 2 );
		add_action( 'publish_post', array( $this, 'post_published' ), 10, 2 );
		add_action( 'post_updated', array( $this, 'post_updated' ), 10, 3 );
		add_action( 'transition_post_status', array( $this, 'post_status_changed' ), 10, 3 );
	}

	/**
	 * Gets the triggers for the integration.
	 *
	 * @access protected
	 *
	 * @since  1.1.0
	 *
	 * @return array The triggers.
	 */
	protected function setup_triggers() {
		$triggers = array(
			'core_updated'        => array(
				'name'               => __( 'WordPress Core Updated', 'echodash' ),
				'description'        => __( 'Triggered when WordPress core is updated.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'wordpress' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => __( 'WordPress Core Update', 'echodash' ),
					'mappings' => array(
						'old_version' => '{wordpress:old_version}',
						'new_version' => '{wordpress:new_version}',
					),
				),
			),
			'plugin_updated'      => array(
				'name'               => __( 'Plugin Updated', 'echodash' ),
				'description'        => __( 'Triggered when a plugin is updated.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'wordpress' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => __( 'Plugin Update', 'echodash' ),
					'mappings' => array(
						'plugin_name'        => '{wordpress:plugin_name}',
						'plugin_description' => '{wordpress:plugin_description}',
						'old_version'        => '{wordpress:old_version}',
						'new_version'        => '{wordpress:new_version}',
					),
				),
			),
			'comment_posted'      => array(
				'name'               => __( 'New Blog Post Comment', 'echodash' ),
				'description'        => __( 'Triggered when a new comment is posted on a blog post.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'comment', 'post' ),
				'enabled_by_default' => false,
				'default_event'      => array(
					'name'     => __( 'New Comment Posted', 'echodash' ),
					'mappings' => array(
						'comment_author'       => '{comment:comment_author}',
						'comment_author_email' => '{comment:comment_author_email}',
						'comment_content'      => '{comment:comment_content}',
						'post_title'           => '{post:post_title}',
						'post_url'             => '{post:post_url}',
					),
				),
			),
			'comment_reply'       => array(
				'name'               => __( 'New Comment Reply', 'echodash' ),
				'description'        => __( 'Triggered when a reply is posted to an existing comment.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'comment', 'post' ),
				'enabled_by_default' => false,
				'default_event'      => array(
					'name'     => __( 'Comment Reply Posted', 'echodash' ),
					'mappings' => array(
						'comment_author'         => '{comment:comment_author}',
						'comment_author_email'   => '{comment:comment_author_email}',
						'comment_content'        => '{comment:comment_content}',
						'parent_comment_author'  => '{comment:parent_comment_author}',
						'parent_comment_content' => '{comment:parent_comment_content}',
						'post_title'             => '{post:post_title}',
						'post_url'               => '{post:post_url}',
					),
				),
			),
			'post_published'      => array(
				'name'               => __( 'Post Published', 'echodash' ),
				'description'        => __( 'Triggered when a post, page, or custom post type is published for the first time.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'post', 'author' ),
				'enabled_by_default' => false,
				'default_event'      => array(
					'name'     => __( 'Post Published', 'echodash' ),
					'mappings' => array(
						'post_title'    => '{post:post_title}',
						'post_excerpt'  => '{post:post_excerpt}',
						'post_url'      => '{post:post_url}',
						'post_type'     => '{post:post_type}',
						'author_name'   => '{author:display_name}',
						'author_email'  => '{author:user_email}',
					),
				),
			),
			'post_updated'        => array(
				'name'               => __( 'Post Updated', 'echodash' ),
				'description'        => __( 'Triggered when an existing post, page, or custom post type is updated.', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'post', 'author' ),
				'enabled_by_default' => false,
				'default_event'      => array(
					'name'     => __( 'Post Updated', 'echodash' ),
					'mappings' => array(
						'post_title'    => '{post:post_title}',
						'post_excerpt'  => '{post:post_excerpt}',
						'post_url'      => '{post:post_url}',
						'post_type'     => '{post:post_type}',
						'author_name'   => '{author:display_name}',
						'author_email'  => '{author:user_email}',
					),
				),
			),
			'post_status_changed' => array(
				'name'               => __( 'Post Status Changed', 'echodash' ),
				'description'        => __( 'Triggered when a post status changes (draft to published, published to draft, etc.).', 'echodash' ),
				'has_global'         => true,
				'option_types'       => array( 'post', 'author' ),
				'enabled_by_default' => false,
				'default_event'      => array(
					'name'     => __( 'Post Status Changed', 'echodash' ),
					'mappings' => array(
						'post_title'   => '{post:post_title}',
						'post_url'     => '{post:post_url}',
						'post_type'    => '{post:post_type}',
						'old_status'   => '{post:old_status}',
						'new_status'   => '{post:new_status}',
						'author_name'  => '{author:display_name}',
						'author_email' => '{author:user_email}',
					),
				),
			),
		);

		return $triggers;
	}

	/**
	 * Gets the WordPress options.
	 *
	 * @since  1.1.0
	 *
	 * @return array The WordPress options.
	 */
	public function get_wordpress_options() {
		return array(
			'name'    => __( 'WordPress', 'echodash' ),
			'type'    => 'wordpress',
			'options' => array(
				array(
					'meta'        => 'old_version',
					'preview'     => '6.3.2',
					'placeholder' => __( 'The previous version', 'echodash' ),
				),
				array(
					'meta'        => 'new_version',
					'preview'     => '6.4.0',
					'placeholder' => __( 'The new version', 'echodash' ),
				),
				array(
					'meta'        => 'plugin_name',
					'preview'     => __( 'WooCommerce', 'echodash' ),
					'placeholder' => __( 'The plugin name', 'echodash' ),
				),
				array(
					'meta'        => 'plugin_description',
					'preview'     => __( 'An ecommerce toolkit that helps you sell anything. Beautifully.', 'echodash' ),
					'placeholder' => __( 'The plugin description', 'echodash' ),
				),
				array(
					'meta'        => 'old_status',
					'preview'     => __( 'draft', 'echodash' ),
					'placeholder' => __( 'The previous post status', 'echodash' ),
				),
				array(
					'meta'        => 'new_status',
					'preview'     => __( 'publish', 'echodash' ),
					'placeholder' => __( 'The new post status', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Gets the author options.
	 *
	 * @since 2.0.0
	 *
	 * @return array The author options.
	 */
	public function get_author_options() {
		return array(
			'name'    => __( 'Post Author', 'echodash' ),
			'type'    => 'author',
			'options' => array(
				array(
					'meta'        => 'display_name',
					'preview'     => __( 'John Doe', 'echodash' ),
					'placeholder' => __( 'The author display name', 'echodash' ),
				),
				array(
					'meta'        => 'user_login',
					'preview'     => 'johndoe',
					'placeholder' => __( 'The author username', 'echodash' ),
				),
				array(
					'meta'        => 'user_email',
					'preview'     => 'john@example.com',
					'placeholder' => __( 'The author email address', 'echodash' ),
				),
				array(
					'meta'        => 'first_name',
					'preview'     => 'John',
					'placeholder' => __( 'The author first name', 'echodash' ),
				),
				array(
					'meta'        => 'last_name',
					'preview'     => 'Doe',
					'placeholder' => __( 'The author last name', 'echodash' ),
				),
				array(
					'meta'        => 'user_url',
					'preview'     => 'https://johndoe.com',
					'placeholder' => __( 'The author website URL', 'echodash' ),
				),
				array(
					'meta'        => 'description',
					'preview'     => __( 'Author bio and description...', 'echodash' ),
					'placeholder' => __( 'The author biographical info', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Gets the comment options.
	 *
	 * @since 2.0.0
	 *
	 * @return array The comment options.
	 */
	public function get_comment_options() {
		return array(
			'name'    => __( 'Comment', 'echodash' ),
			'type'    => 'comment',
			'options' => array(
				array(
					'meta'        => 'comment_author',
					'preview'     => __( 'John Doe', 'echodash' ),
					'placeholder' => __( 'The comment author name', 'echodash' ),
				),
				array(
					'meta'        => 'comment_author_email',
					'preview'     => 'john@example.com',
					'placeholder' => __( 'The comment author email', 'echodash' ),
				),
				array(
					'meta'        => 'comment_author_url',
					'preview'     => 'https://johndoe.com',
					'placeholder' => __( 'The comment author website URL', 'echodash' ),
				),
				array(
					'meta'        => 'comment_content',
					'preview'     => __( 'This is a great post! Thanks for sharing.', 'echodash' ),
					'placeholder' => __( 'The comment content', 'echodash' ),
				),
				array(
					'meta'        => 'comment_date',
					'preview'     => gmdate( 'Y-m-d H:i:s' ),
					'placeholder' => __( 'The comment date', 'echodash' ),
				),
				array(
					'meta'        => 'parent_comment_author',
					'preview'     => __( 'Jane Smith', 'echodash' ),
					'placeholder' => __( 'The parent comment author name', 'echodash' ),
				),
				array(
					'meta'        => 'parent_comment_content',
					'preview'     => __( 'Original comment content being replied to.', 'echodash' ),
					'placeholder' => __( 'The parent comment content', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Gets the post options.
	 *
	 * @since 2.0.0
	 *
	 * @return array The post options.
	 */
	public function get_post_options() {
		return array(
			'name'    => __( 'Post', 'echodash' ),
			'type'    => 'post',
			'options' => array(
				array(
					'meta'        => 'post_title',
					'preview'     => __( 'Sample Blog Post Title', 'echodash' ),
					'placeholder' => __( 'The post title', 'echodash' ),
				),
				array(
					'meta'        => 'post_content',
					'preview'     => __( 'This is the post content with HTML and formatting...', 'echodash' ),
					'placeholder' => __( 'The post content', 'echodash' ),
				),
				array(
					'meta'        => 'post_excerpt',
					'preview'     => __( 'This is a brief excerpt of the post...', 'echodash' ),
					'placeholder' => __( 'The post excerpt', 'echodash' ),
				),
				array(
					'meta'        => 'post_url',
					'preview'     => 'https://example.com/sample-post/',
					'placeholder' => __( 'The post permalink URL', 'echodash' ),
				),
				array(
					'meta'        => 'post_type',
					'preview'     => 'post',
					'placeholder' => __( 'The post type (post, page, etc.)', 'echodash' ),
				),
				array(
					'meta'        => 'post_date',
					'preview'     => gmdate( 'Y-m-d H:i:s' ),
					'placeholder' => __( 'The post publish date', 'echodash' ),
				),
				array(
					'meta'        => 'post_status',
					'preview'     => 'publish',
					'placeholder' => __( 'The post status', 'echodash' ),
				),
				array(
					'meta'        => 'old_status',
					'preview'     => __( 'draft', 'echodash' ),
					'placeholder' => __( 'The previous post status', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Handle new blog post comment.
	 *
	 * @since 2.0.0
	 *
	 * @param int        $comment_id     The comment ID.
	 * @param int|string $comment_approved 1 if approved, 0 if not, 'spam' if spam.
	 * @param array      $commentdata    Comment data.
	 */
	public function comment_post( $comment_id, $comment_approved, $commentdata ) {
		// Only track approved comments.
		if ( 1 !== $comment_approved ) {
			return;
		}

		$comment = get_comment( $comment_id );
		$post    = get_post( $comment->comment_post_ID );

		if ( ! $comment || ! $post ) {
			return;
		}

		// Check if this is a reply to another comment.
		if ( ! empty( $comment->comment_parent ) ) {
			$this->handle_comment_reply( $comment_id );
			return;
		}

		$this->track_event(
			'comment_posted',
			array(
				'comment' => $comment_id,
				'post'    => $post->ID,
				'user'    => $post->post_author,
			)
		);
	}

	/**
	 * Handle comment replies via wp_insert_comment hook.
	 *
	 * @since 2.0.0
	 *
	 * @param int        $comment_id The comment ID.
	 * @param WP_Comment $comment    Comment object.
	 */
	public function wp_insert_comment( $comment_id, $comment ) {
		// Only handle this if it's a reply and the comment is approved.
		if ( empty( $comment->comment_parent ) || '1' !== $comment->comment_approved ) {
			return;
		}

		$this->handle_comment_reply( $comment_id );
	}

	/**
	 * Handle comment reply tracking.
	 *
	 * @since 2.0.0
	 *
	 * @param int $comment_id The comment ID.
	 */
	private function handle_comment_reply( $comment_id ) {
		$comment        = get_comment( $comment_id );
		$parent_comment = get_comment( $comment->comment_parent );
		$post           = get_post( $comment->comment_post_ID );

		if ( ! $comment || ! $parent_comment || ! $post ) {
			return;
		}

		$this->track_event(
			'comment_reply',
			array(
				'comment' => $comment_id,
				'post'    => $post->ID,
				'user'    => $post->post_author,
			),
			array(
				'comment' => array(
					'parent_comment_author'  => $parent_comment->comment_author,
					'parent_comment_content' => $parent_comment->comment_content,
				),
			)
		);
	}

	/**
	 * Handle post published.
	 *
	 * @since 2.0.0
	 *
	 * @param int     $post_id The post ID.
	 * @param WP_Post $post    Post object.
	 */
	public function post_published( $post_id, $post ) {
		// Skip auto-drafts and revisions.
		if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
			return;
		}

		// Prevent duplicate events for the same post in this request.
		if ( in_array( $post_id, $this->processed_posts, true ) ) {
			return;
		}
		$this->processed_posts[] = $post_id;

		$this->track_event(
			'post_published',
			array(
				'post'   => $post_id,
				'author' => $post->post_author,
			)
		);
	}

	/**
	 * Handle post updated.
	 *
	 * @since 2.0.0
	 *
	 * @param int     $post_id      The post ID.
	 * @param WP_Post $post_after   Post object after the update.
	 * @param WP_Post $post_before  Post object before the update.
	 */
	public function post_updated( $post_id, $post_after, $post_before ) {
		// Skip auto-drafts and revisions.
		if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
			return;
		}

		// Skip if post was just published (handled by post_published).
		if ( 'publish' !== $post_before->post_status && 'publish' === $post_after->post_status ) {
			return;
		}

		// Skip if no real content changed.
		if ( $post_before->post_title === $post_after->post_title &&
			$post_before->post_content === $post_after->post_content &&
			$post_before->post_excerpt === $post_after->post_excerpt ) {
			return;
		}

		// Prevent duplicate events for the same post in this request.
		if ( in_array( $post_id, $this->processed_posts, true ) ) {
			return;
		}
		$this->processed_posts[] = $post_id;

		$this->track_event(
			'post_updated',
			array(
				'post'   => $post_id,
				'author' => $post_after->post_author,
			)
		);
	}

	/**
	 * Handle post status changes.
	 *
	 * @since 2.0.0
	 *
	 * @param string  $new_status New post status.
	 * @param string  $old_status Old post status.
	 * @param WP_Post $post       Post object.
	 */
	public function post_status_changed( $new_status, $old_status, $post ) {
		// Skip if status didn't actually change.
		if ( $new_status === $old_status ) {
			return;
		}

		// Skip auto-drafts and revisions.
		if ( wp_is_post_revision( $post->ID ) || wp_is_post_autosave( $post->ID ) ) {
			return;
		}

		// Skip auto-drafts and inherit statuses.
		if ( in_array( $new_status, array( 'auto-draft', 'inherit' ), true ) ||
			in_array( $old_status, array( 'auto-draft', 'inherit' ), true ) ) {
			return;
		}

		// Prevent duplicate events for the same post in this request.
		if ( in_array( $post->ID, $this->processed_posts, true ) ) {
			return;
		}
		$this->processed_posts[] = $post->ID;

		$this->track_event(
			'post_status_changed',
			array(
				'post'   => $post->ID,
				'author' => $post->post_author,
			),
			array(
				'post' => array(
					'old_status' => $old_status,
					'new_status' => $new_status,
				),
			)
		);
	}

	/**
	 * Gets the author variables.
	 *
	 * @since 2.0.0
	 *
	 * @param int $author_id The author user ID.
	 * @return array The author variables.
	 */
	public function get_author_vars( $author_id ) {
		$author = get_userdata( $author_id );

		if ( ! $author ) {
			return array();
		}

		return array(
			'author' => array(
				'display_name' => $author->display_name,
				'user_login'   => $author->user_login,
				'user_email'   => $author->user_email,
				'first_name'   => $author->first_name,
				'last_name'    => $author->last_name,
				'user_url'     => $author->user_url,
				'description'  => $author->description,
			),
		);
	}

	/**
	 * Gets the comment variables.
	 *
	 * @since 2.0.0
	 *
	 * @param int $comment_id The comment ID.
	 * @return array The comment variables.
	 */
	public function get_comment_vars( $comment_id ) {
		$comment = get_comment( $comment_id );

		if ( ! $comment ) {
			return array();
		}

		return array(
			'comment' => array(
				'comment_author'       => $comment->comment_author,
				'comment_author_email' => $comment->comment_author_email,
				'comment_author_url'   => $comment->comment_author_url,
				'comment_content'      => $comment->comment_content,
				'comment_date'         => $comment->comment_date,
			),
		);
	}

	/**
	 * Gets the post variables.
	 *
	 * @since 2.0.0
	 *
	 * @param int $post_id The post ID.
	 * @return array The post variables.
	 */
	public function get_post_vars( $post_id ) {
		$post = get_post( $post_id );

		if ( ! $post ) {
			return array();
		}

		return array(
			'post' => array(
				'post_title'   => $post->post_title,
				'post_content' => $post->post_content,
				'post_excerpt' => $post->post_excerpt,
				'post_url'     => get_permalink( $post_id ),
				'post_type'    => $post->post_type,
				'post_date'    => $post->post_date,
				'post_status'  => $post->post_status,
			),
		);
	}

	/**
	 * Handle WordPress core and plugin updates.
	 *
	 * @since 1.1.0
	 *
	 * @param WP_Upgrader $upgrader   WP_Upgrader instance.
	 * @param array       $hook_extra Array of bulk item update data.
	 */
	public function upgrader_process_complete( $upgrader, $hook_extra ) {
		global $wp_version;

		if ( ! empty( $hook_extra['type'] ) && 'core' === $hook_extra['type'] ) {
			$old_version = ! empty( $upgrader->skin->options['old_version'] ) ? $upgrader->skin->options['old_version'] : '';

			$this->track_event(
				'core_updated',
				array(),
				array(
					'wordpress' => array(
						'old_version' => $old_version,
						'new_version' => $wp_version,
					),
				)
			);
		} elseif ( ! empty( $hook_extra['type'] ) && 'plugin' === $hook_extra['type'] ) {
			// Single plugin update.
			if ( ! empty( $hook_extra['plugin'] ) ) {
				$plugin_file = $hook_extra['plugin'];
			} elseif ( ! empty( $hook_extra['plugins'] ) && is_array( $hook_extra['plugins'] ) ) { // Bulk plugin update.
				$plugin_file = current( $hook_extra['plugins'] );
			}

			if ( empty( $plugin_file ) ) {
				return;
			}

			if ( ! function_exists( 'get_plugin_data' ) ) {
				require_once ABSPATH . 'wp-admin/includes/plugin.php';
			}

			$plugin_dir  = defined( 'ECHODASH_WP_PLUGIN_DIR' ) ? ECHODASH_WP_PLUGIN_DIR : dirname( plugin_dir_path( __FILE__ ) );
			$plugin_data = get_plugin_data( $plugin_dir . '/' . $plugin_file );

			$old_version = ! empty( $upgrader->skin->plugin_info['Version'] ) ? $upgrader->skin->plugin_info['Version'] : '';

			$this->track_event(
				'plugin_updated',
				array(),
				array(
					'wordpress' => array(
						'plugin_name'        => $plugin_data['Name'],
						'plugin_description' => wp_strip_all_tags( $plugin_data['Description'] ),
						'old_version'        => $old_version,
						'new_version'        => $plugin_data['Version'],
					),
				)
			);
		}
	}
}

new EchoDash_WordPress();
