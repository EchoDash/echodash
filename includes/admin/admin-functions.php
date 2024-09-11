<?php

defined( 'ABSPATH' ) || exit;

/**
 * Renders the field select HTML for admin pages
 *
 * @since  1.0.0
 *
 * @param  array $args   The arguments.
 * @return mixed HTML inputs.
 */
function ecd_render_event_tracking_fields( $args = array() ) {

	// Default values.

	$defaults = array(
		'meta_name'   => 'echodash_settings',
		'field_id'    => null,
		'integration' => false,
		'trigger'     => false,
		'setting'     => array(
			'name'  => '',
			'value' => array(
				array(
					'key'   => '',
					'value' => '',
				),
			),
		),
		'class'       => '',
	);

	$args = wp_parse_args( $args, $defaults );

	if ( empty( $args['setting'] ) ) {
		$args['setting'] = array(
			'name'  => false,
			'value' => array(
				array(
					'key'   => false,
					'value' => false,
				),
			),
		);
	}

	// Get the field ID.
	if ( false === $args['field_id'] ) {
		$field_id = sanitize_html_class( $args['meta_name'] );
	} else {
		$field_id = sanitize_html_class( $args['meta_name'] ) . '-' . $args['field_id'];
	}

	$in_option_page = ( isset( $_GET['page'] ) && $_GET['page'] === 'echodash' ? true : false );

	$field_name           = esc_attr( $args['meta_name'] ) . ( ! is_null( $args['field_id'] ) ? '[' . esc_attr( $args['field_id'] ) . ']' : '' );
	$single_trigger_class = ( ! $in_option_page ? ' single-trigger' : '' );
	echo '
		<span class="echodash' . esc_attr( $single_trigger_class ) . '" data-trigger="' . esc_attr( $args['trigger'] ) . '" data-integration="' . esc_attr( $args['integration'] ) . '">
			<span class="echodash-input-container">
				<label for="' . esc_attr( $args['field_id'] ) . '" data-placeholder="Name:"></label>
				<input value="' . esc_attr( $args['setting']['name'] ) . '" name="' . esc_attr( $field_name ) . '[name]" id="' . esc_attr( $args['field_id'] ) . '" class="ecd-name" type="text">
				<span class="right input">
					<a class="open-list tooltip-merge-tag"></a>
				</span>
			</span>

			<select id="' . esc_attr( $field_id ) . '-name-select" class="select4-event-tracking"></select>

			' . ecd_get_event_tracking_value_field( $args, $field_name, $field_id ) . '
  
		</span>
	';
}


/**
 * Get event value field.
 *
 * @since  1.0.0
 * @param array  $args
 * @param string $field_name
 * @param string $field_id
 */
function ecd_get_event_tracking_value_field( $args, $field_name, $field_id ) {

	$output = '';

	$value = ( isset( $args['setting']['value'] ) ? $args['setting']['value'] : '' );

	$in_option_page = ( isset( $_GET['page'] ) && $_GET['page'] === 'echodash' ? true : false );

	$output .= '
		<span class="ecd-multi-key-crm">
			<span data-repeater-list="' . ( $in_option_page ? 'value' : esc_attr( $field_name . '[value]' ) ) . '">';
	foreach ( $value as $val ) {
		$output .= '
						<span class="nr-item" data-repeater-item>
							<span class="echodash-input-container">
								<label for="' . esc_attr( $args['field_id'] ) . '_key" data-placeholder="Key:"></label>
								<input value="' . esc_attr( $val['key'] ) . '" name="key" id="' . esc_attr( $args['field_id'] ) . '_key" class="ecd-key" type="text">
							</span>
							
							<span class="echodash-input-container">
								<label for="' . esc_attr( $args['field_id'] ) . '_value" data-placeholder="Value:"></label>
								<input value="' . esc_attr( $val['value'] ) . '" name="value" id="' . esc_attr( $args['field_id'] ) . '_value" class="ecd-value" type="text">
								<span class="right input">
									<a class="open-list tooltip-merge-tag"></a>
								</span>
							</span>


							<select id="' . esc_attr( $field_id ) . '-value-select" class="select4-event-tracking"></select>
							<span class="ecd-circles">
								<button onclick="return false;" data-repeater-create><span class="dashicons dashicons-plus-alt2"></span></button>
								<button onclick="return false;" data-repeater-delete><span class="dashicons dashicons-minus"></span></button>
							</span>
						
						</span>';
	}

	$output .= '
		</span>

		
		<span class="ecd-container ecd-preview">
			<span>
				<span class="label">' . esc_html__( 'Event Name', 'echodash' ) . ':</span>
				<span class="echodash-preview event-name hidden"></span>
			</span>

			<a class="ecd-send-test" href="#"><span class="dashicons dashicons-bell"></span>Send Test</a>

		</span>

		<table class="ecd-values">

		</table>

	</span>';

	return $output;
}
