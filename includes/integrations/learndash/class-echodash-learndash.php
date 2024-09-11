<?php

defined( 'ABSPATH' ) || exit;
/**
 * LearnDash integration.
 *
 * @since 1.0.0
 */
class EchoDash_LearnDash extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since 1.0.0
	 * @var string $slug
	 */

	public $slug = 'learndash';

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 1.0.0
	 * @var string $name
	 */
	public $name = 'LearnDash';

	/**
	 * Get things started.
	 *
	 * @since 1.0.0
	 */
	public function init() {

		add_action( 'learndash_course_completed', array( $this, 'course_completed' ), 5 );
		add_action( 'learndash_lesson_completed', array( $this, 'course_progress' ), 5 );
		add_action( 'learndash_topic_completed', array( $this, 'course_progress' ), 5 );

		add_action( 'learndash_quiz_completed', array( $this, 'quiz_completed' ), 5, 2 );

		add_action( 'learndash_update_user_activity', array( $this, 'course_start' ) );

		add_filter( 'learndash_header_data', array( $this, 'header_data' ) );
	}

	/**
	 * Gets the triggers for the integration.
	 *
	 * @access protected
	 *
	 * @since  1.0.0
	 *
	 * @return array The triggers.
	 */
	protected function setup_triggers() {

		$triggers = array(
			'course_start'    => array(
				'name'         => __( 'Course Start', 'echodash' ),
				'description'  => __( 'Triggered whenever a course is started.', 'echodash' ),
				'post_types'   => array( 'sfwd-courses' ),
				'has_single'   => true,
				'has_global'   => true,
				'option_types' => array( 'course' ),
			),
			'course_progress' => array(
				'name'         => __( 'Course Progress', 'echodash' ),
				'description'  => __( 'Triggered whenever a lesson or topic is completed within the course, as well as when the course itself is completed.', 'echodash' ),
				'post_types'   => array( 'sfwd-courses' ),
				'has_single'   => true,
				'has_global'   => true,
				'option_types' => array( 'course' ),
			),
			'quiz_completed'  => array(
				'name'         => __( 'Quiz Completed', 'echodash' ),
				'description'  => __( 'Triggered whenever a quiz in this course is completed.', 'echodash' ),
				'post_types'   => array( 'sfwd-courses' ),
				'has_single'   => true,
				'has_global'   => true,
				'option_id'    => 'quiz',
				'option_types' => array( 'course', 'quiz' ),
			),
		);

		return $triggers;
	}

	/**
	 * Track events on course progress.
	 *
	 * @since 1.3.0
	 *
	 * @param array $data   The progress data.
	 */
	public function course_completed( $data ) {

		$events = $this->get_events( 'course_progress', $data['course']->ID );

		if ( ! empty( $events ) ) {

			$args = $this->get_course_vars( $data['course']->ID, $data['course']->ID );
			$user = new WP_User( $data['user']->ID );

			foreach ( $events as $event ) {
				$event = $this->replace_tags( $event, $args );
				$this->track_event( $event, $user->user_email );
			}
		}
	}

	/**
	 * Track events on course start.
	 *
	 * @since 1.4.0
	 *
	 * @param array $args   The activity arguments.
	 */
	public function course_start( $args ) {

		if ( $args['activity_type'] !== 'course' || $args['activity_completed'] != '' || intval( $args['activity_status'] ) === 1 || $args['activity_action'] !== 'insert' ) {
			return;
		}

		$events = $this->get_events( 'course_start', $args['course_id'] );

		if ( ! empty( $events ) ) {

			$args = $this->get_course_vars( $args['course_id'] );
			$user = new WP_User( $args['user_id'] );

			foreach ( $events as $event ) {
				$event = $this->replace_tags( $event, $args );
				$this->track_event( $event, $user->user_email );
			}
		}
	}

	/**
	 * Track events on course progress.
	 *
	 * @since 1.0.0
	 *
	 * @param array $data   The progress data.
	 */
	public function course_progress( $data ) {

		if ( ! isset( $data['progress'] ) || ! isset( $data['progress']['last_id'] ) ) {
			return;
		}

		$events = $this->get_events( 'course_progress', $data['course']->ID );

		if ( ! empty( $events ) ) {

			$args = $this->get_course_vars( $data['course']->ID, $data['progress']['last_id'] );
			$user = new WP_User( $data['user']->ID );

			foreach ( $events as $event ) {
				$event = $this->replace_tags( $event, $args );
				$this->track_event( $event, $user->user_email );
			}
		}

		// Only do it once.
		remove_action( 'learndash_lesson_completed', array( $this, 'course_progress' ), 5 );
		remove_action( 'learndash_topic_completed', array( $this, 'course_progress' ), 5 );
	}

	/**
	 * Tracks an event when a quiz is completed.
	 *
	 * @since 1.0.0
	 *
	 * @param array   $data   The quiz data.
	 * @param WP_User $user   The user.
	 */
	public function quiz_completed( $data, $user ) {

		if ( isset( $data['quiz']->ID ) ) {
			$quiz_id   = $data['quiz']->ID;
			$course_id = $data['course']->ID;
		} else {
			// For grading in the admin.
			$quiz_id   = $data['quiz'];
			$course_id = $data['course'];
		}

		$events = $this->get_events( 'quiz_completed', $course_id );

		if ( ! empty( $events ) ) {

			$args = $this->get_course_vars( $course_id, $quiz_id );
			$args = array_merge( $args, $this->get_quiz_vars( $quiz_id, $data ) );

			foreach ( $events as $event ) {
				$event = $this->replace_tags( $event, $args );
				$this->track_event( $event, $user->user_email );
			}
		}
	}


	/**
	 * Adds the meta box to the Settings tab.
	 *
	 * @since  1.0.0
	 *
	 * @param  array $header_data    The header data.
	 * @return array The header data.
	 */
	public function header_data( $header_data ) {

		foreach ( $header_data['tabs'] as $tabindex => $tab ) {

			if ( 'wp-fusion-settings' === $tab['id'] ) {
				$header_data['tabs'][ $tabindex ]['metaboxes'][] = 'echodash';
			}
		}

		return $header_data;
	}

	/**
	 * Displays the meta box content.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_Post $post   The download.
	 */
	public function meta_box_callback( $post ) {

		echo '<table class="form-table echodash"><tbody>';

		echo '<tr>';

		echo '<th scope="row">';
		echo '<label for="course_start">' . esc_html__( 'Course Start', 'echodash' ) . ':</label>';
		echo '<span class="description">' . esc_html__( 'Triggered whenever a course is started.', 'echodash' ) . '</span>';
		echo '</th>';
		echo '<td>';

			$this->render_event_tracking_fields( 'course_start', $post->ID );

		echo '</td>';
		echo '</tr>';

		echo '<tr>';

		echo '<th scope="row">';
		echo '<label for="course_progress">' . esc_html__( 'Course Progress', 'echodash' ) . ':</label>';
		echo '<span class="description">' . esc_html__( 'Triggered whenever a lesson, topic, or quiz is completed within the course, as well as when the course itself is completed.', 'echodash' ) . '</span>';
		echo '</th>';
		echo '<td>';

			$this->render_event_tracking_fields( 'course_progress', $post->ID );

		echo '</td>';
		echo '</tr>';

		echo '<tr>';

		echo '<th scope="row">';
		echo '<label for="quiz_completed">' . esc_html__( 'Quiz Completed', 'echodash' ) . ':</label>';
		echo '<span class="description">' . esc_html__( 'Triggered whenever a quiz in this course is marked complete.', 'echodash' ) . '</span>';
		echo '</th>';
		echo '<td>';

			$this->render_event_tracking_fields( 'quiz_completed', $post->ID );

		echo '</td>';
		echo '</tr>';

		echo '</table>';
	}

	/**
	 * Gets the course options.
	 *
	 * @since  1.0.0
	 *
	 * @return array The course options.
	 */
	public function get_course_options() {

		return array(
			'name'    => learndash_get_custom_label( 'course' ),
			'type'    => 'course',
			'options' => array(
				array(
					'meta'        => 'id',
					'preview'     => 55,
					'placeholder' => __( 'The course ID', 'echodash' ),
				),
				array(
					'meta'        => 'title',
					'preview'     => 'My cool course',
					'placeholder' => __( 'The course title', 'echodash' ),
				),
				array(
					'meta'        => 'last_completed_step',
					'preview'     => 'Lesson One',
					'placeholder' => __( 'The title of the last completed course step', 'echodash' ),
				),
				array(
					'meta'        => 'course_progress',
					'preview'     => '85%',
					'placeholder' => __( 'The percentage of the course that\'s complete', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Gets the details from the course for merging.
	 *
	 * @since  1.0.0
	 *
	 * @param  int      $course_id              The course ID.
	 * @param  int|bool $last_completed_step_id The last completed step ID.
	 * @return array    The course variables.
	 */
	public function get_course_vars( $course_id, $last_completed_step_id = false ) {

		$vars = array(
			'course' => array(
				'id'    => $course_id,
				'title' => get_post_field( 'post_title', $course_id, 'raw' ),
			),
		);

		if ( ! empty( $last_completed_step_id ) ) {

			$args = array(
				'course_id' => $course_id,
				'array'     => true,
			);

			$vars['course']['last_completed_step'] = get_post_field( 'post_title', $last_completed_step_id, 'raw' );
			$vars['course']['course_progress']     = learndash_course_progress( $args )['percentage'] . '%';
		}

		return $vars;
	}

	/**
	 * Gets the quiz options.
	 *
	 * @since  1.0.0
	 *
	 * @return array The quiz options.
	 */
	public function get_quiz_options() {

		return array(
			'name'    => learndash_get_custom_label( 'quiz' ),
			'type'    => 'quiz',
			'options' => array(
				array(
					'meta'        => 'id',
					'preview'     => 55,
					'placeholder' => __( 'The quiz ID', 'echodash' ),
				),
				array(
					'meta'        => 'title',
					'preview'     => 'My cool quiz',
					'placeholder' => __( 'The quiz title', 'echodash' ),
				),
				array(
					'meta'        => 'percentage',
					'preview'     => '85%',
					'placeholder' => __( 'The user\'s quiz percentage', 'echodash' ),
				),
				array(
					'meta'        => 'points',
					'preview'     => 10,
					'placeholder' => __( 'The user\'s quiz points', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Gets the details from the quiz for merging.
	 *
	 * @since  1.0.0
	 *
	 * @param  int   $quiz_id The quiz ID.
	 * @param  array $data    The quiz result data.
	 * @return array The product variables.
	 */
	public function get_quiz_vars( $quiz_id, $data = false ) {

		$vars = array(
			'quiz' => array(
				'id'    => $quiz_id,
				'title' => get_post_field( 'post_title', $quiz_id, 'raw' ),
			),
		);

		if ( $data ) {
			$vars['quiz']['percentage'] = $data['percentage'] . '%';
			$vars['quiz']['points']     = $data['points'];
		}

		return $vars;
	}
}

new EchoDash_LearnDash();
