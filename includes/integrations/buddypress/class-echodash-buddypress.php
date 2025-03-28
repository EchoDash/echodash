<?php

defined( 'ABSPATH' ) || exit;

/**
 * BuddyPress integration.
 *
 * @since 1.2.0
 */
class EchoDash_BuddyPress extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since 1.2.0
	 * @var string $slug
	 */

	public $slug = 'buddypress';

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 1.2.0
	 * @var string $name
	 */
	public $name = 'BuddyPress';

	/**
	 * Get things started.
	 *
	 * @since 1.2.0
	 */
	public function init() {

		// // Groups metabox.
		add_action( 'bp_groups_admin_meta_boxes', array( $this, 'add_meta_box_groups' ) );
		add_action( 'bp_group_admin_edit_after', array( $this, 'save_groups_data' ), 20 );

		// Profile updates.
		add_filter( 'xprofile_pc_user_progress_formatted', array( $this, 'profile_completed' ), 5 ); // so it runs before the core WP Fusion updates the DB.
		add_action( 'xprofile_avatar_uploaded', array( $this, 'profile_photo_updated' ), 10, 3 );
		add_action( 'xprofile_cover_image_uploaded', array( $this, 'cover_photo_updated' ), 10, 3 );

		// Group joins and leaves.
		add_action( 'groups_join_group', array( $this, 'join_group' ), 10, 2 );
		add_action( 'groups_leave_group', array( $this, 'leave_group' ), 10, 2 );
		add_action( 'groups_remove_member', array( $this, 'leave_group' ), 10, 2 );
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
			// Groups.
			'joined_group'          => array(
				'name'         => __( 'Joined Group', 'echodash' ),
				'description'  => __( 'Triggered when a user joins a social group.', 'echodash' ),
				'placeholder'  => 'Joined social group',
				'has_single'   => true,
				'has_global'   => true,
				'option_types' => array( 'group' ),
			),

			'left_group'            => array(
				'name'         => __( 'Left Group', 'echodash' ),
				'description'  => __( 'Triggered when a user leaves a social group.', 'echodash' ),
				'placeholder'  => 'Left social group',
				'has_single'   => true,
				'has_global'   => true,
				'option_types' => array( 'group' ),
			),

			// Profile.
			'updated_profile_photo' => array(
				'name'        => __( 'Updated Profile Photo', 'echodash' ),
				'description' => __( 'Triggered when a user changes their profile photo.', 'echodash' ),
				'has_global'  => true,
			),

			'updated_cover_photo'   => array(
				'name'        => __( 'Updated Cover Photo', 'echodash' ),
				'description' => __( 'Triggered when a user changes their cover photo.', 'echodash' ),
				'has_global'  => true,
			),

			'profile_completed'     => array(
				'name'        => __( 'Profile Completed', 'echodash' ),
				'description' => __( 'Triggered when a user completes their profile.', 'echodash' ),
				'has_global'  => true,
			),

		);

		return $triggers;
	}

	/**
	 * Overrides EchoDash_Integration::get_settings() and gets the settings
	 * out of groupmeta instead of postmeta.
	 *
	 * @since  1.2.0
	 *
	 * @param  int $group_id   The post ID.
	 * @return array The settings.
	 */
	public function get_settings( $group_id ) {

		$defaults = array(
			'joined_group' => false,
			'left_group'   => false,
		);

		$settings = groups_get_groupmeta( $group_id, 'echodash_settings' );

		return wp_parse_args( $settings, $defaults );
	}


	/**
	 * User completed his profile.
	 */
	public function profile_completed( $progress_details ) {
		if ( 100 === (int) $progress_details['completion_percentage'] ) {
			$user = wp_get_current_user();
			if ( ! $user->exists() || ! empty( get_user_meta( $user->ID, 'echodash_bp_profile_complete', true ) ) ) {
				return $progress_details;
			}

			$this->track_event(
				'profile_completed',
				array(
					'user' => $user->ID,
				)
			);
		}
		return $progress_details;
	}

	/**
	 * User updated his profile photo.
	 */
	public function profile_photo_updated( $user_id, $avatar_type, $avatar_data ) {
		$this->track_event(
			'updated_profile_photo',
			array(
				'user' => $user_id,
			)
		);
	}

	/**
	 * User updates his cover photo.
	 */
	public function cover_photo_updated( $user_id, $name, $cover_url ) {
		$this->track_event(
			'updated_cover_photo',
			array(
				'user' => $user_id,
			)
		);
	}

	/**
	 * User has left a group.
	 */
	public function leave_group( $group_id, $user_id ) {
		$this->track_event(
			'left_group',
			array(
				'group' => $group_id,
				'user'  => $user_id,
			)
		);
	}

	/**
	 * User has joined a group.
	 */
	public function join_group( $group_id, $user_id ) {
		$this->track_event(
			'joined_group',
			array(
				'group' => $group_id,
				'user'  => $user_id,
			)
		);
	}

	/**
	 * Registers meta box.
	 *
	 * @since  1.0.0
	 */
	public function add_meta_box_groups() {
		add_meta_box(
			'echodash',
			__( 'EchoDash - Event Tracking', 'echodash' ),
			array(
				$this,
				'meta_box_callback',
			),
			get_current_screen()->id
		);
	}

	/**
	 * Displays the meta box content.
	 *
	 * @since 1.0.0
	 *
	 * @param BP_Groups_Group $group  The group.
	 */
	public function meta_box_callback( $group ) {
		// Add nonce field
		wp_nonce_field( 'echodash_save_groups', 'echodash_groups_nonce' );

		echo '<table class="form-table echodash"><tbody>';

		echo '<tr>';

		echo '<th scope="row">';
		echo '<label for="joined_group">' . esc_html__( 'Joined Group', 'echodash' ) . ':</label>';
		echo '<span class="description">' . esc_html__( 'This event will be triggered when a user has joined the social group.', 'echodash' ) . '</span>';
		echo '</th>';
		echo '<td>';

			$this->render_event_tracking_fields( 'joined_group', $group->id );

		echo '</td>';
		echo '</tr>';

		echo '<tr>';

		echo '<th scope="row">';
		echo '<label for="left_group">' . esc_html__( 'Left Group', 'echodash' ) . ':</label>';
		echo '<span class="description">' . esc_html__( 'This event will be triggered when a user has left the social group.', 'echodash' ) . '</span>';
		echo '</th>';
		echo '<td>';

			$this->render_event_tracking_fields( 'left_group', $group->id );

		echo '</td>';
		echo '</tr>';

		echo '</table>';

		do_action( 'echodash_bp_groups_meta_box', $group->id );
	}


	/**
	 * Runs when WPF meta box is saved.
	 *
	 * @param integer $post_id The post id.
	 */
	public function save_groups_data( $post_id ) {
		// Verify nonce
		if ( ! isset( $_POST['echodash_groups_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['echodash_groups_nonce'] ), 'echodash_save_groups' ) ) {
			return;
		}

		// Verify user can edit groups
		if ( ! current_user_can( 'bp_moderate' ) ) {
			return;
		}

		$data = ! empty( $_POST['echodash_settings'] ) ? echodash_clean( wp_unslash( $_POST['echodash_settings'] ) ) : array();

		// Update or delete the group meta
		if ( ! empty( $data ) ) {
			groups_update_groupmeta( $post_id, 'echodash_settings', $data );
		} else {
			groups_delete_groupmeta( $post_id, 'echodash_settings' );
		}
	}


	/**
	 * Gets the group options.
	 *
	 * @since  1.2.0
	 *
	 * @return array The order options.
	 */
	public function get_group_options() {

		return array(
			'name'    => __( 'Social Groups', 'echodash' ),
			'type'    => 'group',
			'options' => array(
				array(
					'meta'        => 'id',
					'preview'     => 33,
					'placeholder' => __( 'The group ID', 'echodash' ),
				),
				array(
					'meta'        => 'name',
					'preview'     => 'Sample Group',
					'placeholder' => __( 'The group title', 'echodash' ),
				),
				array(
					'meta'        => 'description',
					'preview'     => 'Description',
					'placeholder' => __( 'The group description', 'echodash' ),
				),
				array(
					'meta'        => 'status',
					'preview'     => 'public',
					'placeholder' => __( 'The group status', 'echodash' ),
				),
				array(
					'meta'        => 'date_created',
					'preview'     => gmdate( 'Y-m-d', strtotime( '-1 year' ) ),
					'placeholder' => __( 'The date the group was created', 'echodash' ),
				),
				array(
					'meta'        => 'group_creator_name',
					'preview'     => 'Admin',
					'placeholder' => __( 'The group creator name', 'echodash' ),
				),
				array(
					'meta'        => 'group_creator_email',
					'preview'     => 'john@email.com',
					'placeholder' => __( 'The group creator email', 'echodash' ),
				),

			),
		);
	}

	/**
	 * Gets the group variables.
	 *
	 * @since  1.2.0
	 *
	 * @param  int $group_id The group ID.
	 * @return array The group variables.
	 */
	public function get_group_vars( $group_id ) {

		$group = groups_get_group( $group_id );

		if ( empty( $group ) ) {
			return array();
		}

		$group_fields = array(
			'id'           => $group->id,
			'name'         => $group->name,
			'description'  => $group->description,
			'status'       => $group->status,
			'date_created' => $group->date_created,
		);

		// Creator info.
		$user                                = get_user_by( 'id', $group->creator_id );
		$group_fields['group_creator_name']  = $user->display_name;
		$group_fields['group_creator_email'] = $user->user_email;

		return array(
			'group' => $group_fields,
		);
	}

	/**
	 * Override get_single_events() to handle BuddyPress group meta.
	 *
	 * @since  1.0.0
	 * @param  string $trigger The trigger.
	 * @return array  The events.
	 */
	public function get_single_events( $trigger ) {
		$events = array();
		global $wpdb;
		$bp = buddypress();

		$table_name     = $bp->groups->table_name_groupmeta;
		$cache_key      = 'echodash_group_meta';
		$cached_results = wp_cache_get( $cache_key, 'echodash' );

		if ( false === $cached_results ) {
			$results = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT group_id, meta_value FROM {$table_name} WHERE meta_key = %s",
					'echodash_settings'
				)
			);
			wp_cache_set( $cache_key, $results, 'echodash', 3600 ); // Cache for 1 hour
		} else {
			$results = $cached_results;
		}

		if ( ! empty( $results ) ) {
			foreach ( $results as $result ) {
				$settings = maybe_unserialize( $result->meta_value );

				if ( ! empty( $settings[ $trigger ] ) ) {
					// Build up events array
					$event = array(
						'trigger'    => $trigger,
						'post_id'    => $result->group_id, // We'll use post_id for consistency
						'edit_url'   => bp_get_admin_url( 'admin.php?page=bp-groups&gid=' . $result->group_id . '&action=edit' ),
						'post_title' => bp_get_group_name( groups_get_group( $result->group_id ) ),
					);

					$event    = array_merge( $event, $settings[ $trigger ] );
					$events[] = $event;
				}
			}
		}

		return $events;
	}
}

new EchoDash_BuddyPress();
