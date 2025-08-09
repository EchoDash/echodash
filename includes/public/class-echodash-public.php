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
class EchoDash_Public {

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
	 * Tracks an event.
	 *
	 * @since 1.0.0
	 */
	public function track_event( $event_name, $values = array(), $source = false, $trigger = false ) {

		$event = array(
			'name'   => $event_name,
			'source' => $source,
			'event'  => $trigger,
			'values' => $values,
		);

		do_action( 'echodash_track_event', $event );

		$this->add_to_queue( $event );

		return true;
	}

	/**
	 * Adds to queue.
	 *
	 * @since 1.0.0
	 *
	 * @param array $event The event.
	 */
	public function add_to_queue( $event ) {
		$this->events[] = $event;
	}

	/**
	 * Process the queued events on shutdown.
	 *
	 * @since 1.0.0
	 */
	public function shutdown() {

		if ( empty( $this->events ) ) {
			return;
		}

		$endpoint = esc_url( echodash_get_option( 'endpoint' ) );

		if ( empty( $endpoint ) ) {
			return;
		}

		foreach ( $this->events as $event ) {

			wp_remote_post(
				$endpoint,
				array(
					'headers'    => array(
						'Content-Type'  => 'application/json',
						'ecd-summarize' => 'false',
						'ecd-source'    => $event['source'],
						'ecd-event'     => $event['event'],
					),
					'body'       => wp_json_encode( $event ),
					'blocking'   => false,
					'user-agent' => 'EchoDash ' . ECHODASH_VERSION . '; ' . home_url(),
				)
			);

		}
	}
}
