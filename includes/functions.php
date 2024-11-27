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
 * @param string $key          The option key.
 * @param mixed  $default_value The default value.
 * @return mixed The option value.
 */
function ecd_get_option( $key, $default_value = false ) {
	return echodash()->admin->get_option( $key, $default_value );
}
