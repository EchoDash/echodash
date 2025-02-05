<?php

defined( 'ABSPATH' ) || exit;

/**
 * Track an event.
 *
 * @since  1.0.0
 *
 * @param  string      $event_name    The event name.
 * @param  array       $values        The event values.
 * @param  string|bool $source        The source.
 * @param  string|bool $trigger       The trigger.
 */
function echodash_track_event( $event_name, $values = array(), $source = false, $trigger = false ) {
	return echodash()->track_event( $event_name, $values, $source, $trigger );
}


/**
 * Gets an option.
 *
 * @since 1.0.0
 *
 * @param string $key     The option key.
 * @param mixed  $default The default value.
 * @return mixed The option value.
 */
function echodash_get_option( $key, $default_value = false ) {

	if ( 'endpoint' === $key ) {
		$value = get_option( 'echodash_endpoint', $default );
	} else {
		$options = get_option( 'echodash_options', array() );

		if ( isset( $options[ $key ] ) ) {
			$value = $options[ $key ];
		} else {
			$value = $default_value;
		}
	}

	return apply_filters( "echodash_get_option_{$key}", $value );
}

/**
 * Clean variables using sanitize_text_field. Arrays are cleaned recursively.
 * Non-scalar values are ignored.
 *
 * @since 1.0.0
 *
 * @param string|array $data Data to sanitize.
 * @return string|array
 */
function echodash_clean( $data ) {

	if ( is_array( $data ) ) {

		// Clean up empty event values.
		foreach ( $data as $id => $maybe_event ) {
			if ( is_array( $maybe_event ) ) {
				if ( ( isset( $maybe_event['value'] ) && is_array( $maybe_event['value'] ) && empty( $maybe_event['value'][0]['key'] ) ) || ( isset( $maybe_event['name'] ) && empty( $maybe_event['name'] ) ) ) {
					unset( $data[ $id ] );
				}
			}
		}

		// Recursively sanitize arrays.
		return array_map( 'echodash_clean', $data );
	}

	if ( is_scalar( $data ) ) {
		return sanitize_text_field( $data );
	}
}
