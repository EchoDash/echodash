<?php

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

/**
 * Class EchoDash_Queue
 *
 * Handles the public-facing functionality.
 *
 * @since 1.0.0
 */
class EchoDash_Queue {

	/**
	 * The queued events to track.
	 *
	 * @since 1.0.0
	 * @var array $events.
	 */
	public $events = array();

	/**
	 * Constructs a new instance.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {

		add_action( 'shutdown', array( $this, 'shutdown' ), 5 );
	}

	/**
	 * Adds to queue.
	 *
	 * @since 1.0.0
	 *
	 * @param array  $event_name    The event.
	 * @param bool   $event_value   The event value.
	 * @param string $email_address The email address.
	 */
	public function track_event( $event_name, $event_value = false, $email_address = '', $source = false ) {

		$event = array(
			'name'  => $event_name,
			'value' => $event_value,
		);

		do_action( 'echodash_track_event', $event, $email_address, $source );

		$this->add_to_queue( $event, $email_address );
	}

	/**
	 * Adds to queue.
	 *
	 * @since 1.0.0
	 *
	 * @param array  $event         The event.
	 * @param string $email_address The email address.
	 */
	public function add_to_queue( $event, $email_address ) {

		$this->events[] = array(
			'event'         => $event,
			'email_address' => $email_address,
		);
	}

	/**
	 * Process the queued events on shutdown.
	 *
	 * @since 1.0.0
	 */
	public function shutdown() {

		$settings = get_option( 'echodash_options' );

		if ( empty( $settings['endpoint'] ) ) {
			return;
		}

		foreach ( $this->events as $event ) {

			wp_remote_post(
				$settings['endpoint'],
				array(
					'body'    => wp_json_encode( $event ),
					'timeout' => 10,
				)
			);
		}
	}
}
