<?php

GFForms::include_feed_addon_framework();

/**
 * Gravity Forms integration.
 *
 * @since 1.0.0
 */
class EchoDash_Gravity_Forms_Feed extends GFFeedAddOn {

	protected $_version     = ECHODASH_VERSION;
	protected $_slug        = 'echodash';
	protected $_full_path   = __FILE__;
	protected $_title       = 'EchoDash Integration';
	protected $_short_title = 'EchoDash';


	// # ADMIN FUNCTIONS -----------------------------------------------------------------------------------------------

	/**
	 * Configures the settings which should be rendered on the feed edit page in
	 * the Form Settings > Event Tracking area.
	 *
	 * @since  1.0.0
	 *
	 * @return array The settings.
	 */
	public function feed_settings_fields() {
		return array(
			array(
				'title'  => esc_html__( 'EchoDash - Event Tracking Settings', 'echodash' ),
				'fields' => array(
					array(
						'label' => esc_html__( 'Track Event', 'echodash' ),
						'type'  => 'echodash',
						'name'  => 'form_submitted',
					),
					array(
						'name'           => 'condition',
						'label'          => esc_html__( 'Condition', 'echodash' ),
						'type'           => 'feed_condition',
						'checkbox_label' => esc_html__( 'Enable Condition', 'echodash' ),
						'instructions'   => esc_html__( 'Process this simple feed if', 'echodash' ),
					),
				),
			),
		);
	}


	/**
	 * Custom callback for the echodash field type. Currently not in
	 * use.
	 *
	 * @since 1.0.0
	 *
	 * @param array $field  The field.
	 * @return mixed HTML output.
	 */
	public function settings_echodash( $field ) {

		$form = $this->get_current_form();

		$args = array(
			'meta_name' => '_gform_setting_' . $field['name'],
			'field_id'  => null, // this gives us an input with name _gform_setting_form_submitted[name], which lets GF save it properly.
			'setting'   => $this->get_setting( $field['name'], array() ),
		);

		echodash()->integration( 'gravity-forms' )->render_event_tracking_fields( 'form_submitted', $form['id'], $args );
	}

	/**
	 * Configures which columns should be displayed on the feed list page.
	 *
	 * @since  1.0.0
	 *
	 * @return array The feed list columns.
	 */
	public function feed_list_columns() {
		return array(
			'eventname'  => esc_html__( 'Event Name', 'echodash' ),
			'eventvalue' => esc_html__( 'Event Value', 'echodash' ),
		);
	}

	/**
	 * Display the event name column.
	 *
	 * @since  1.0.0
	 *
	 * @param  array $feed The feed being included in the feed list.
	 * @return string The event name.
	 */
	public function get_column_value_eventname( $feed ) {
		return '<b>' . rgars( $feed, 'meta/form_submitted/name' ) . '</b>';
	}


	/**
	 * Display the event value column.
	 *
	 * @since  1.0.0
	 *
	 * @param  array $feed The feed being included in the feed list.
	 * @return string The event value.
	 */
	public function get_column_value_eventvalue( $feed ) {
		$value = rgars( $feed, 'meta/form_submitted/value' );

		if ( empty( $value ) ) {
			return '<i>' . esc_html__( 'No fields selected', 'echodash' ) . '</i>';
		}

		if ( ! is_array( $value ) ) {
			return '<b>' . esc_html( $value ) . '</b>';
		}

		$field_preview = array_slice( $value, 0, 3 );
		$preview_text  = implode(
			', ',
			array_map(
				function ( $field ) {
					return esc_html( $field['key'] );
				},
				$field_preview
			)
		);

		if ( count( $value ) > 3 ) {
			$preview_text .= sprintf(
				/* translators: %d: number of additional fields */
				esc_html__( ' (+%d more)', 'echodash' ),
				count( $value ) - 3
			);
		}

		return '<b>' . $preview_text . '</b>';
	}


	/**
	 * Return the plugin's icon for the plugin/form settings menu.
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_menu_icon() {
		return ecd_logo_svg();
	}
}
