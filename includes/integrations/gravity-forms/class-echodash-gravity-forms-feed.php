<?php

GFForms::include_feed_addon_framework();

/**
 * Gravity Forms integration.
 *
 * @since 1.0.0
 */
class EchoDash_Gravity_Forms_Feed extends GFFeedAddOn {

	protected $_version                  = ECHODASH_VERSION;
	protected $_min_gravityforms_version = '1.7.9999';
	protected $_slug                     = 'echodash';
	protected $_full_path                = __FILE__;
	protected $_title                    = 'CRM Integration';
	protected $_short_title              = 'Event Tracking';
	protected $postvars                  = array();
	public $feed_lists;

	protected $_capabilities_settings_page = array( 'manage_options' );
	protected $_capabilities_form_settings = array( 'manage_options' );
	protected $_capabilities_plugin_page   = array( 'manage_options' );
	protected $_capabilities_app_menu      = array( 'manage_options' );
	protected $_capabilities_app_settings  = array( 'manage_options' );
	protected $_capabilities_uninstall     = array( 'manage_options' );

	private static $_instance = null;

	/**
	 * Get an instance of this class.
	 *
	 * @since  1.0.0
	 *
	 * @return EchoDash_Gravity_Forms_Feed
	 */
	public static function get_instance() {
		if ( null === self::$_instance ) {
			self::$_instance = new EchoDash_Gravity_Forms_Feed();
		}

		return self::$_instance;
	}

	/**
	 * Gets things started.
	 *
	 * @since 1.4.4
	 */
	public function init() {

		parent::init();

		// Increase the priority so it runs after Gravity Forms User Registration.
		remove_filter( 'gform_entry_post_save', array( $this, 'maybe_process_feed' ), 10 ); // remove it in the base class.
		add_filter( 'gform_entry_post_save', array( $this, 'maybe_process_feed' ), 20, 2 );
	}


	// # FEED PROCESSING -----------------------------------------------------------------------------------------------

	/**
	 * Process the feed e.g. subscribe the user to a list.
	 *
	 * @param array $feed The feed object to be processed.
	 * @param array $entry The entry object currently being processed.
	 * @param array $form The form object currently being processed.
	 *
	 * @return bool|void
	 */
	public function process_feed( $feed, $entry, $form ) {

		// Multi key.
		$value = $feed['meta']['form_submitted']['value'];

		if ( is_array( $value ) ) {

			foreach ( $value as $key => $event_val ) {

				if ( '{form:all_fields}' === trim( $event_val['value'] ) ) {

					unset( $value[ $key ] );

					foreach ( $form['fields'] as $field ) {

						// Get the value for this field from the $entry array
						$field_value = rgar( $entry, $field->id );

						if ( empty( $field_value ) ) {
							continue;
						}

						// Create a safe key.
						$field_key = str_replace( '-', '_', sanitize_title( $field->label ) );

						$value[] = array(
							'key'   => $field_key,
							'value' => $field_value,
						);
					}
				} else {
					$value[ $key ]['value'] = GFCommon::replace_variables( str_replace( 'form:', '', $event_val['value'] ), $form, $entry, false, false, false, 'text' );
				}
			}
		} else {
			$value = GFCommon::replace_variables( str_replace( 'form:', '', $value ), $form, $entry, false, false, false, 'text' );
		}

		$event = array(
			'name'  => GFCommon::replace_variables( str_replace( 'form:', '', $feed['meta']['form_submitted']['name'] ), $form, $entry, false, false, false, 'text' ),
			'value' => $value,
		);

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

		echodash()->integrations->{'gravity-forms'}->track_event( $event, $email_address );
	}

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
				'title'  => esc_html__( 'WP Fusion - Event Tracking Settings', 'echodash' ),
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
			'setting'   => $this->get_setting( $field['name'] ),
		);

		echodash()->integrations->{'gravity-forms'}->render_event_tracking_fields( 'form_submitted', $form['id'], $args );
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
		return '<b>' . ( ! is_array( $value ) ? $value : json_encode( $value ) ) . '</b>';
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
