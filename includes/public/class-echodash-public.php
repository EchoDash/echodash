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

		if ( defined( 'ECHODASH_TEST_EVENT' ) ) {
			return $this->shutdown();
		}

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
	 *
	 * @return WP_Error|true
	 */
	public function shutdown() {

		if ( empty( $this->events ) ) {
			return;
		}

		$endpoint = esc_url( echodash_get_option( 'endpoint' ) );

		if ( empty( $endpoint ) ) {
			return new WP_Error( 'echodash_no_endpoint', __( 'No endpoint found', 'echodash' ) );
		}

		foreach ( $this->events as $i => $event ) {

			$params = array(
				'headers'    => array(
					'Content-Type'  => 'application/json',
					'ecd-summarize' => 'false',
					'ecd-source'    => $event['source'],
					'ecd-event'     => $event['event'],
				),
				'body'       => wp_json_encode( $event ),
				'blocking'   => defined( 'ECHODASH_TEST_EVENT' ) ? true : false,
				'user-agent' => 'EchoDash ' . ECHODASH_VERSION . '; ' . home_url(),
			);

			$result = wp_remote_post( $endpoint, $params );

			unset( $this->events[ $i ] );

			if ( is_wp_error( $result ) ) {
				return $result;
			} elseif ( 202 !== wp_remote_retrieve_response_code( $result ) ) {
				// translators: %s is the endpoint URL, %d is the status code.
				return new WP_Error( 'echodash_send_failed', sprintf( __( 'Failed to send event to endpoint: %1$s. Status code: %2$d', 'echodash' ), $endpoint, wp_remote_retrieve_response_code( $result ) ) );
			}
		}

		return true;
	}
}
