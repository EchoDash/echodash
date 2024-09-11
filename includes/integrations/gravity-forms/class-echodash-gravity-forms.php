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

		$events = $this->get_global_events( 'form_submitted' );

		if ( ! empty( $events ) ) {

			$user = wp_get_current_user();

			if ( $user ) {
				$email_address = $user->user_email;
			} else {
				// If the person isn't identified, check the form.
				foreach ( $entry as $field ) {
					if ( is_email( $field ) ) {
						$email_address = $field;
						break;
					}
				}
			}

			foreach ( $events as $event ) {

				// Replace the leading "form:" from the global settings.

				$event['name'] = str_replace( 'form:', '', $event['name'] );
				$event['name'] = GFCommon::replace_variables( $event['name'], $form, $entry, false, false, false, 'text' );

				// Multi key.
				if ( is_array( $event['value'] ) ) {
					foreach ( $event['value'] as $key => $event_val ) {
						$event_val['value']              = str_replace( 'form:', '', $event_val['value'] );
						$event['value'][ $key ]['value'] = GFCommon::replace_variables( $event_val['value'], $form, $entry, false, false, false, 'text' );
					}
				} else {
					$event['value'] = str_replace( 'form:', '', $event['value'] );
					$event['value'] = GFCommon::replace_variables( $event['value'], $form, $entry, false, false, false, 'text' );
				}

				$this->track_event( $event, $email_address );

			}
		}
	}
}

new EchoDash_Gravity_Forms();
