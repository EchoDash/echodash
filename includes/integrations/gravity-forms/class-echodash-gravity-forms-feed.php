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
	protected $_title                    = 'EchoDash Integration';
	protected $_short_title              = 'EchoDash';
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
	 * Process the feed.
	 *
	 * @param array $feed  The feed object to be processed.
	 * @param array $entry The entry object currently being processed.
	 * @param array $form  The form object currently being processed.
	 */
	public function process_feed( $feed, $entry, $form ) {
		// Process form merge tags first
		$processed_fields = array();

		if ( isset( $feed['meta']['form_submitted']['value'] ) && is_array( $feed['meta']['form_submitted']['value'] ) ) {
			foreach ( $feed['meta']['form_submitted']['value'] as $field ) {
				// Remove 'form:' prefix from GForms merge tags
				$value = str_replace( 'form:', '', $field['value'] );

				// Process with GForms merge tag system
				$processed_value = GFCommon::replace_variables( $value, $form, $entry, false, false, false, 'text' );

				$value = str_replace( '{', '', $value );
				$value = str_replace( '}', '', $value );
				$value = trim( $value );

				if ( ! empty( $processed_value ) ) {
					$processed_fields[ $value ] = $processed_value;
				}
			}
		}

		$form_data = array(
			'title' => $form['title'],
		);

		$form_data = array_merge( $form_data, $processed_fields );

		// Let the main integration class handle any remaining merge tags (like {user:id})
		echodash()->integrations->{'gravity-forms'}->track_event(
			'form_submitted',
			array(
				'form' => $form['id'],
			),
			array(
				'form' => $form_data,
			)
		);
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

		return false;
		//return ecd_logo_svg();
	}
}
