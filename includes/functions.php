<?php

defined( 'ABSPATH' ) || exit;

/**
 * Track an event.
 *
 * @since  1.0.0
 *
 * @param  string      $event_name    The event name.
 * @param  string|bool $event_data    The event data.
 * @param  string|bool $email_address The email address.
 */
function echodash_track_event( $event_name, $event_data = false, $email_address = false ) {
	return echodash()->track_event( $event_name, $event_data, $email_address );
}
