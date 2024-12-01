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

		add_action( 'gform_after_submission', array( $this, 'after_submission' ) );

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
				'option_types' => array( 'entry' ),
			),

		);

		return $triggers;
	}


	/**
	 * Gets the form variables.
	 *
	 * @since  1.0.0
	 *
	 * @param  int $form_id The form ID.
	 * @return array The form variables.
	 */
	public function get_entry_vars( $entry_id ) {

		$entry = GFAPI::get_entry( $entry_id );
		$form  = GFAPI::get_form( $entry['form_id'] );

		$entry_data = array();

		// Add standard entry fields
		$entry_data = array(
			'id'         => $entry['id'],
			'form_id'    => $entry['form_id'],
			'date'       => $entry['date_created'],
			'ip'         => $entry['ip'],
			'user_agent' => $entry['user_agent'],
		);

		// Get all available merge tags
		foreach ( GFCommon::get_merge_tags( $form['fields'], null ) as $tag_group ) {

			foreach ( $tag_group['tags'] as $merge_tag ) {
				if ( false !== strpos( $merge_tag['tag'], 'user:' ) || false !== strpos( $merge_tag['tag'], 'ip:' ) ) {
					continue; // the core integration already handles these
				}

				// Process the merge tag to get the field ID
				$tag = $merge_tag['tag'];
				$tag = str_replace( '{', '', $tag );
				$tag = str_replace( '}', '', $tag );

				// Get the actual value using GF's merge tag system
				$value = GFCommon::replace_variables( $merge_tag['tag'], $form, $entry );

				// Store using the original merge tag format
				$entry_data[ $tag ] = $value;
			}
		}

		// Prepare all fields array.

		$entry_data['all_fields'] = array();

		foreach ( $form['fields'] as $field ) {

			if ( ! empty( $field->inputs ) ) {

				// Handle multi-input fields (like name, checkbox, etc)
				foreach ( $field->inputs as $input ) {

					$input_value = rgar( $entry, $input['id'] );

					if ( empty( $input_value ) ) {
						continue;
					}

					$input_key = sanitize_title( $field->label . '_' . $input['label'] );
					$input_key = str_replace( '-', '_', $input_key );

					$entry_data['all_fields'][ $input_key ] = $input_value;
				}
			} else {

				// Handle single-input fields (like single line text, number, etc).
				$field_value = rgar( $entry, $field->id );

				if ( empty( $field_value ) ) {
					continue;
				}

				$field_key = str_replace( '-', '_', sanitize_title( $field->label ) );

				$entry_data['all_fields'][ $field_key ] = $field_value;
			}
		}

		return array(
			'entry' => $entry_data,
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
	public function get_entry_options( $options, $entry_id = false ) {

		$options = array(
			'name'    => __( 'Entry', 'echodash' ),
			'type'    => 'entry',
			'options' => array(),
		);

		if ( $entry_id ) {
			$entry  = GFAPI::get_entry( $entry_id );
			$form   = GFAPI::get_form( $entry['form_id'] );
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
	 */
	public function after_submission( $entry ) {

		if ( 'spam' === $entry['status'] ) {
			return;
		}

		// Track the event with processed values
		$this->track_event(
			'form_submitted',
			array(
				'entry' => $entry['id'],
				'user'  => $entry['created_by'],
			),
		);
	}

	/**
	 * Gets the settings from individual form feeds based on the entry.
	 *
	 * @since  1.0.0
	 * @param  int $entry_id The entry ID.
	 * @return array The settings.
	 */
	public function get_settings( $entry_id ) {

		$entry = GFAPI::get_entry( $entry_id );

		$settings = array(
			'form_submitted' => false,
		);

		// Get all feeds for this form
		$feeds = GFAPI::get_feeds( null, $entry['form_id'], 'echodash' );

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
