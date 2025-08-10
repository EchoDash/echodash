<?php
/**
 * LifterLMS integration.
 *
 * @package EchoDash
 */

defined( 'ABSPATH' ) || exit;
/**
 * LifterLMS integration.
 *
 * @since 1.0.0
 */
class EchoDash_LifterLMS extends EchoDash_Integration {

	/**
	 * The slug for EchoDash's module tracking.
	 *
	 * @since 1.0.0
	 * @var string $slug
	 */

	public $slug = 'lifterlms';

	/**
	 * The plugin name for EchoDash's module tracking.
	 *
	 * @since 1.0.0
	 * @var string $name
	 */
	public $name = 'LifterLMS';

	/**
	 * The icon background color for EchoDash's module tracking.
	 *
	 * @since 2.0.0
	 * @var string $icon_background_color
	 */
	protected $icon_background_color = '#466dd8';

	/**
	 * Get things started.
	 *
	 * @since 1.0.0
	 */
	public function init() {

		add_filter( 'llms_metabox_fields_lifterlms_course_options', array( $this, 'course_lesson_metabox' ) );

		add_action( 'lifterlms_course_completed', array( $this, 'course_lesson_complete' ), 10, 2 );
		add_action( 'lifterlms_lesson_completed', array( $this, 'course_lesson_complete' ), 10, 2 );
		add_action( 'lifterlms_quiz_completed', array( $this, 'quiz_complete' ), 10, 3 );
		add_action( 'llms_user_enrolled_in_course', array( $this, 'course_started' ), 10, 2 );
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
				'name'               => __( 'Course Start', 'echodash' ),
				'description'        => __( 'Triggered whenever a course is started.', 'echodash' ),
				'post_types'         => array( 'course' ),
				'has_single'         => true,
				'has_global'         => true,
				'option_id'          => 'course',
				'option_types'       => array( 'course' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => 'Course Started',
					'mappings' => array(
						'course_title' => '{course:title}',
					),
				),
			),
			'course_progress' => array(
				'name'               => __( 'Course Progress', 'echodash' ),
				'description'        => __( 'Triggered whenever a lesson, topic, or quiz is completed.', 'echodash' ),
				'post_types'         => array( 'course' ),
				'has_single'         => true,
				'has_global'         => true,
				'option_id'          => 'course',
				'option_types'       => array( 'course' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => 'Course Progress',
					'mappings' => array(
						'course_title'        => '{course:title}',
						'last_completed_step' => '{course:last_completed_step}',
						'progress_percentage' => '{course:course_progress}',
					),
				),
			),
			'quiz_completed'  => array(
				'name'               => __( 'Quiz Completed', 'echodash' ),
				'description'        => __( 'Triggered whenever a quiz is completed.', 'echodash' ),
				'post_types'         => array( 'course' ),
				'has_single'         => true,
				'has_global'         => true,
				'option_id'          => 'quiz',
				'option_types'       => array( 'course', 'quiz' ),
				'enabled_by_default' => true,
				'default_event'      => array(
					'name'     => 'Quiz Completed',
					'mappings' => array(
						'course_title' => '{course:title}',
						'quiz_id'      => '{quiz:id}',
						'quiz_title'   => '{quiz:title}',
						'quiz_grade'   => '{quiz:grade}',
					),
				),
			),
		);

		return $triggers;
	}

	/**
	 * Override the add_meta_boxes function in the parent class.
	 *
	 * @since 1.2.0
	 */
	public function add_meta_boxes() {}


	/**
	 * Triggered when user is enrolled to a course.
	 *
	 * @since 1.4.0
	 *
	 * @param int $user_id   The user ID.
	 * @param int $course_id The course ID.
	 */
	public function course_started( $user_id, $course_id ) {
		if ( 'course' !== get_post_type( $course_id ) ) {
			return;
		}

		$this->track_event(
			'course_start',
			array(
				'course' => $course_id,
				'user'   => $user_id,
			),
			array(
				'course' => array(
					'title' => get_the_title( $course_id ),
				),
			)
		);
	}


	/**
	 * Triggered when course / lesson marked complete.
	 *
	 * @since 1.0.0
	 *
	 * @param int $user_id The user ID.
	 * @param int $post_id The post ID.
	 */
	public function course_lesson_complete( $user_id, $post_id ) {
		$course_id = $post_id;
		if ( 'lesson' === get_post_type( $post_id ) ) {
			$lesson    = llms_get_post( $post_id );
			$course_id = $lesson->get( 'parent_course' );
		}

		$student  = llms_get_student( $user_id );
		$progress = $student ? $student->get_progress( $course_id, 'course', false ) : 0;

		$this->track_event(
			'course_progress',
			array(
				'course' => $course_id,
				'user'   => $user_id,
			),
			array(
				'course' => array(
					'title'               => get_the_title( $course_id ),
					'last_completed_step' => get_the_title( $post_id ),
					'progress'            => $progress . '%',
				),
			)
		);
	}


	/**
	 * Triggered when quiz completed.
	 *
	 * @since 1.0.0
	 *
	 * @param int       $user_id The user ID.
	 * @param int       $quiz_id The quiz ID.
	 * @param LLMS_Quiz $quiz    The quiz data.
	 */
	public function quiz_complete( $user_id, $quiz_id, $quiz ) {
		$lesson_id = $quiz->get( 'lesson_id' );
		$lesson    = llms_get_post( $lesson_id );
		$course_id = $lesson->get( 'parent_course' );

		$this->track_event(
			'quiz_completed',
			array(
				'course' => $course_id,
				'quiz'   => $quiz_id,
				'user'   => $user_id,
			),
			array(
				'course' => array(
					'title' => get_the_title( $course_id ),
				),
				'quiz'   => array(
					'title' => get_the_title( $quiz_id ),
					'grade' => $quiz->get( 'grade' ),
				),
			)
		);
	}


	/**
	 * Add tab in course with data.
	 *
	 * @since  1.0.0
	 *
	 * @param  array $fields The fields.
	 * @return array The fields.
	 */
	public function course_lesson_metabox( $fields ) {

		global $post;

		$fields['wpf-et'] = array(
			'title'  => 'Event Tracking',
			'fields' => array(),
		);

		if ( 'course' === $post->post_type ) {

			$fields['wpf-et']['fields'][] = array(
				'class' => 'course_start',
				'desc'  => __( 'Triggered whenever a course is started.', 'echodash' ),
				'id'    => 'echodash_settings[course_progress]',
				'label' => __( 'Course Start', 'echodash' ),
				'type'  => 'custom_html',
				'value' => '<br />' . $this->render_event_tracking_fields( 'course_start', $post->ID, array( 'return' => true ) ),
			);

			$fields['wpf-et']['fields'][] = array(
				'class' => 'course_progress',
				'desc'  => __( 'Triggered whenever a lesson, topic, or quiz is completed within the course, as well as when the course itself is completed.', 'echodash' ),
				'id'    => 'echodash_settings[course_progress]',
				'label' => __( 'Course Progress', 'echodash' ),
				'type'  => 'custom_html',
				'value' => '<br />' . $this->render_event_tracking_fields( 'course_progress', $post->ID, array( 'return' => true ) ),
			);

			$fields['wpf-et']['fields'][] = array(
				'class' => 'quiz_completed',
				'desc'  => __( 'Triggered whenever a quiz in this course is marked complete.', 'echodash' ),
				'id'    => 'echodash_settings[quiz_completed]',
				'label' => __( 'Quiz Completed', 'echodash' ),
				'type'  => 'custom_html',
				'value' => '<br />' . $this->render_event_tracking_fields( 'quiz_completed', $post->ID, array( 'return' => true ) ),
			);

		}

		return $fields;
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
			'name'    => __( 'Course', 'echodash' ),
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
				'title' => get_the_title( $course_id ),
			),
		);

		if ( ! empty( $last_completed_step_id ) ) {

			$student = new LLMS_Student( get_current_user_id() );

			$vars['course']['last_completed_step'] = get_the_title( $last_completed_step_id );
			$vars['course']['course_progress']     = $student->get_progress( $course_id, 'course', false ) . '%'; // false for don't use cache.
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
			'name'    => __( 'Quiz', 'echodash' ),
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
					'meta'        => 'grade',
					'preview'     => '85',
					'placeholder' => __( 'The user\'s quiz grade', 'echodash' ),
				),
			),
		);
	}

	/**
	 * Gets the details from the quiz for merging.
	 *
	 * @since  1.0.0
	 *
	 * @param  int       $quiz_id The quiz ID.
	 * @param  LLMS_Quiz $quiz    The quiz result data.
	 * @return array     The quiz variables.
	 */
	public function get_quiz_vars( $quiz_id, $quiz = false ) {

		// Quiz ID is a course ID in the admin :(. Need to make this work better.

		if ( 'course' === get_post_type( $quiz_id ) ) {
			return array();
		}

		$vars = array(
			'quiz' => array(
				'id'    => $quiz_id,
				'title' => get_the_title( $quiz_id ),
			),
		);

		if ( $quiz ) {
			$vars['quiz']['grade'] = $quiz->get( 'grade' );
		}

		return $vars;
	}
}

new EchoDash_LifterLMS();
