<?php

defined( 'ABSPATH' ) || exit;

/**
 * Gravity Forms integration.
 *
 * @since 1.0.0
 */
class EchoDash_Gravity_Forms extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since 1.0.0
	 * @var string $slug
	 */

	public $slug = 'gravity-forms';

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 1.0.0
	 * @var string $name
	 */
	public $name = 'Gravity Forms';

	/**
	 * Get things started.
	 *
	 * @since 1.0.0
	 */
	public function init() {

		if ( ! method_exists( 'GFForms', 'include_feed_addon_framework' ) ) {
			return;
		}

		add_action( 'gform_after_submission', array( $this, 'after_submission' ), 10, 2 );

		require_once ECHODASH_DIR_PATH . 'includes/integrations/gravity-forms/class-echodash-gravity-forms-feed.php';

		GFAddOn::register( 'EchoDash_Gravity_Forms_Feed' );

		new EchoDash_Gravity_Forms_Feed();
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
			'form_submitted' => array(
				'name'         => __( 'Form Submitted', 'echodash' ),
				'description'  => __( 'Triggered each time a form is submitted.', 'echodash' ),
				'has_single'   => true,
				'has_global'   => true,
				'option_types' => array( 'form' ),
			),

		);

		return $triggers;
	}

	/**
	 * Gets the instance of the feed addon.
	 *
	 * @since  1.0.0
	 *
	 * @return EchoDash_Gravity_Forms_Feed The instance.
	 */
	public function get_instance() {
		return EchoDash_Gravity_Forms_Feed::get_instance();
	}


	/**
	 * Gets the form variables.
	 *
	 * @since  1.0.0
	 *
	 * @param  int $form_id The form ID.
	 * @return array The form variables.
	 */
	public function get_form_vars( $form_id ) {

		$form = GFAPI::get_form( $form_id );

		return array(
			'form' => array(
				'title' => $form['title'],
			),
		);
	}


	/**
	 * Gets all events bound to a particular trigger.
	 *
	 * @since  1.1.0
	 *
	 * @param  string $trigger The trigger.
	 * @return array The events.
	 */
	public function get_single_events( $trigger ) {

		$events = array();

		$feeds = GFAPI::get_feeds( null, null, 'echodash' );

		if ( ! empty( $feeds ) && ! is_wp_error( $feeds ) ) {

			foreach ( $feeds as $feed ) {

				$form = GFAPI::get_form( $feed['form_id'] );

				$event = array(
					'trigger'    => $trigger,
					'post_id'    => $feed['form_id'],
					'post_title' => $form['title'],
					'edit_url'   => admin_url( 'admin.php?page=gf_edit_forms&view=settings&subview=echodash&id=' . $feed['form_id'] . '&fid=' . $feed['id'] ),
				);

				$event    = array_merge( $event, $feed['meta']['form_submitted'] );
				$events[] = $event;
			}
		}

		return $events;
	}

	/**
	 * Gets the form options.
	 *
	 * @since  1.1.0
	 *
	 * @return array The form options.
	 */
	public function get_form_options( $options, $form_id = false ) {

		$options = array(
			'name'    => __( 'Form', 'echodash' ),
			'type'    => 'form',
			'options' => array(),
		);

		if ( $form_id ) {
			$form   = GFAPI::get_form( $form_id );
			$fields = $form['fields'];
		} else {
			$fields = null;
		}

		foreach ( GFCommon::get_merge_tags( $fields, null ) as $tag_group ) {

			foreach ( $tag_group['tags'] as $merge_tag ) {

				if ( false !== strpos( $merge_tag['tag'], 'user:' ) || false !== strpos( $merge_tag['tag'], 'ip:' ) ) {
					continue; // the core integration already handles these.
				}

				$id = str_replace( '{', '', $merge_tag['tag'] );
				$id = str_replace( '}', '', $id );

				$options['options'][] = array(
					'meta'        => $id,
					'preview'     => $merge_tag['label'],
					'placeholder' => $merge_tag['label'],
				);
			}
		}

		return $options;
	}

	/**
	 * Process any global events on forms that don't have feeds configured.
	 *
	 * @since 1.1.0
	 *
	 * @param array $entry  The entry.
	 * @param array $form   The form.
	 */
	public function after_submission( $entry, $form ) {
		if ( 'spam' === $entry['status'] ) {
			return;
		}

		// Get email from user or form
		$email = '';
		$user  = wp_get_current_user();
		if ( $user->exists() ) {
			$email = $user->user_email;
		} else {
			foreach ( $entry as $field ) {
				if ( is_email( $field ) ) {
					$email = $field;
					break;
				}
			}
		}

		// Track the event
		$this->track_event(
			'form_submitted',
			array(
				'form' => $form['id'],
				'user' => $user->ID,
			),
			array(
				'form' => array(
					'title' => $form['title'],
					'email' => $email,
				),
			)
		);
	}

	/**
	 * Gets the settings for a form from its feeds.
	 *
	 * @since  1.0.0
	 * @param  int $form_id The form ID.
	 * @return array The settings.
	 */
	public function get_settings( $form_id ) {
		$settings = array(
			'form_submitted' => false,
		);

		// Get all feeds for this form
		$feeds = GFAPI::get_feeds( null, $form_id, 'echodash' );

		if ( ! empty( $feeds ) && ! is_wp_error( $feeds ) ) {
			foreach ( $feeds as $feed ) {
				if ( ! empty( $feed['meta']['form_submitted'] ) ) {
					// If we find a feed with form_submitted settings, use it
					$settings['form_submitted'] = $feed['meta']['form_submitted'];
					break; // Use first matching feed
				}
			}
		}

		return $settings;
	}
}

new EchoDash_Gravity_Forms();
