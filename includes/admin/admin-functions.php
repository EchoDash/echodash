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
			'value' => array(),
		),
		'class'       => '',
	);

	$args = wp_parse_args( $args, $defaults );

	if ( empty( $args['setting']['value'] ) ) {
		$args['setting']['value'] = array(
			array(
				'key'   => false,
				'value' => false,
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
		<span class="ecd-multi-key">
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

function ecd_logo_svg( $width = 24 ) {
	$height  = $width; // Logo is square
	$content = '
	<svg width="' . esc_attr( $width ) . '" height="' . esc_attr( $height ) . '" viewBox="0 0 422 422" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
	<path fill-rule="evenodd" clip-rule="evenodd" d="M211 0.511108C327.25 0.511103 421.489 94.7502 421.489 211C421.489 327.25 327.25 421.489 211 421.489H59.7111C27.0159 421.489 0.511123 394.984 0.511122 362.289L0.511108 59.7111C0.511107 27.0158 27.0159 0.511116 59.7111 0.511115L211 0.511108ZM105.756 39.9778C147.473 39.9778 185.702 54.9148 215.386 79.7322C146.819 84.2451 92.5999 141.291 92.6 211C92.6 280.709 146.818 337.755 215.386 342.268C185.702 367.085 147.473 382.022 105.756 382.022H79.4126C57.6477 382.005 40.0058 364.37 39.9778 342.608L39.9778 79.3925C40.0058 57.6195 57.6649 39.9778 79.4444 39.9778H105.756ZM382.022 211C382.022 122.94 315.468 50.4251 229.916 41.012C282.253 79.3043 316.244 141.183 316.244 211C316.244 280.817 282.253 342.696 229.916 380.988C315.468 371.575 382.022 299.06 382.022 211ZM248 118.911H224.156C173.296 118.911 132.067 160.141 132.067 211C132.067 261.859 173.296 303.089 224.156 303.089H248C249.362 303.089 250.467 301.985 250.467 300.622V263.622H224.156C195.093 263.622 171.533 240.062 171.533 211C171.533 181.938 195.093 158.378 224.156 158.378H250.467V121.378C250.467 120.015 249.362 118.911 248 118.911ZM224.156 197.844H243.889V224.156H224.156C216.89 224.156 211 218.266 211 211C211 203.734 216.89 197.844 224.156 197.844Z"/>
	</svg>';

	return $content;
}
