<?php
/**
 * EchoDash Feature Flags System
 *
 * Advanced feature flag system for gradual rollout and safe deployment
 * of the React interface with comprehensive controls.
 *
 * @package EchoDash
 * @since 2.0.0
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class EchoDash_Feature_Flags {

	const FLAG_REACT_UI        = 'react_ui_enabled';
	const FLAG_GRADUAL_ROLLOUT = 'gradual_rollout_percentage';
	const FLAG_BETA_USERS      = 'beta_users_list';
	const FLAG_ADMIN_OVERRIDE  = 'admin_override_ui';
	const FLAG_FORCE_LEGACY    = 'force_legacy_ui';
	const FLAG_DEBUG_MODE      = 'debug_mode_enabled';

	/**
	 * User meta keys
	 */
	const USER_PREFERENCE    = 'ecd_ui_preference';
	const USER_BETA_STATUS   = 'ecd_beta_user';
	const USER_ROLLOUT_GROUP = 'ecd_rollout_group';

	/**
	 * Initialize feature flag system
	 */
	public function __construct() {
		add_action( 'admin_init', array( $this, 'handle_feature_flags' ) );
		add_action( 'wp_ajax_ecd_toggle_ui', array( $this, 'ajax_toggle_ui' ) );
		add_action( 'wp_ajax_ecd_update_rollout', array( $this, 'ajax_update_rollout' ) );
		add_action( 'wp_ajax_ecd_add_beta_user', array( $this, 'ajax_add_beta_user' ) );
		add_action( 'wp_ajax_ecd_remove_beta_user', array( $this, 'ajax_remove_beta_user' ) );
		add_action( 'wp_ajax_ecd_dismiss_beta_notice', array( $this, 'ajax_dismiss_beta_notice' ) );
		add_action( 'admin_notices', array( $this, 'show_beta_notice' ) );
		add_action( 'admin_notices', array( $this, 'show_emergency_notice' ) );
	}

	/**
	 * Handle feature flag updates and URL overrides
	 */
	public function handle_feature_flags() {
		// Handle admin override URLs for testing
		if ( current_user_can( 'manage_options' ) && isset( $_GET['ecd_force_ui'] ) ) {
			$ui_mode = sanitize_text_field( $_GET['ecd_force_ui'] );
			if ( in_array( $ui_mode, array( 'react', 'legacy' ), true ) ) {
				set_transient( 'ecd_admin_override_' . get_current_user_id(), $ui_mode, HOUR_IN_SECONDS );
			}
		}

		// Handle user preference updates
		if ( isset( $_POST['ecd_ui_preference_nonce'] ) && wp_verify_nonce( $_POST['ecd_ui_preference_nonce'], 'ecd_toggle_ui' ) ) {
			$preference = isset( $_POST['ecd_ui_preference'] ) ? 'react' : 'legacy';
			update_user_meta( get_current_user_id(), 'ecd_ui_preference', $preference );

			// Announce preference change to screen reader
			add_action(
				'admin_notices',
				function () use ( $preference ) {
					$message = $preference === 'react' ?
					__( 'Switched to new React interface', 'echodash' ) :
					__( 'Switched to classic interface', 'echodash' );
					echo '<div class="notice notice-success is-dismissible"><p>' . esc_html( $message ) . '</p></div>';
				}
			);
		}
	}

	/**
	 * Determine if React UI should be used for current user
	 *
	 * @return bool
	 */
	public function should_use_react_ui() {
		// Check for emergency legacy mode (highest priority)
		if ( get_option( self::FLAG_FORCE_LEGACY, false ) ) {
			return false;
		}

		// Admin override for testing (highest priority)
		if ( current_user_can( 'manage_options' ) ) {
			$override = get_transient( 'ecd_admin_override_' . get_current_user_id() );
			if ( $override ) {
				return $override === 'react';
			}
		}

		// User preference (second highest priority)
		$user_preference = get_user_meta( get_current_user_id(), self::USER_PREFERENCE, true );
		if ( ! empty( $user_preference ) ) {
			return $user_preference === 'react';
		}

		// Beta users list check
		if ( $this->is_beta_user() ) {
			return true;
		}

		// Gradual rollout check
		if ( $this->is_gradual_rollout_enabled() ) {
			return $this->user_in_rollout_group();
		}

		// Global setting (lowest priority)
		return get_option( self::FLAG_REACT_UI, false );
	}

	/**
	 * Check if current user is in beta users list
	 *
	 * @return bool
	 */
	public function is_beta_user() {
		$beta_users         = get_option( self::FLAG_BETA_USERS, array() );
		$current_user_id    = get_current_user_id();
		$current_user_email = wp_get_current_user()->user_email;

		return in_array( $current_user_id, $beta_users, true ) ||
				in_array( $current_user_email, $beta_users, true );
	}

	/**
	 * Check if gradual rollout is enabled
	 *
	 * @return bool
	 */
	private function is_gradual_rollout_enabled() {
		$percentage = get_option( self::FLAG_GRADUAL_ROLLOUT, 0 );
		return $percentage > 0 && $percentage < 100;
	}

	/**
	 * Check if user is in rollout group using consistent hashing
	 *
	 * @return bool
	 */
	private function user_in_rollout_group() {
		$user_id    = get_current_user_id();
		$percentage = get_option( self::FLAG_GRADUAL_ROLLOUT, 0 );

		// Use consistent hash-based rollout for stability
		$salt = get_option( 'ecd_rollout_salt', wp_generate_password( 32, false ) );
		if ( ! get_option( 'ecd_rollout_salt' ) ) {
			update_option( 'ecd_rollout_salt', $salt );
		}

		$hash            = md5( $user_id . $salt );
		$user_percentage = hexdec( substr( $hash, 0, 2 ) ) / 255 * 100;

		return $user_percentage < $percentage;
	}

	/**
	 * Get rollout statistics
	 *
	 * @return array
	 */
	public function get_rollout_stats() {
		$percentage  = get_option( self::FLAG_GRADUAL_ROLLOUT, 0 );
		$beta_users  = get_option( self::FLAG_BETA_USERS, array() );
		$total_users = count_users();

		return array(
			'rollout_percentage'    => $percentage,
			'beta_users_count'      => count( $beta_users ),
			'total_users'           => $total_users['total_users'],
			'estimated_react_users' => round( ( $total_users['total_users'] * $percentage / 100 ) + count( $beta_users ) ),
		);
	}

	/**
	 * Render UI toggle interface
	 */
	public function render_ui_toggle() {
		$is_react      = $this->should_use_react_ui();
		$can_manage    = current_user_can( 'manage_options' );
		$rollout_stats = $this->get_rollout_stats();
		?>
		<div class="ecd-ui-toggle-container">
			<div class="ecd-ui-toggle">
				<form method="post" action="">
					<?php wp_nonce_field( 'ecd_toggle_ui', 'ecd_ui_preference_nonce' ); ?>
					<label for="ecd-react-toggle">
						<input 
							type="checkbox" 
							id="ecd-react-toggle" 
							name="ecd_ui_preference"
							value="1"
							<?php checked( $is_react ); ?>
							onchange="this.form.submit();"
						/>
						<span class="toggle-text">
							<?php esc_html_e( 'Use new React interface', 'echodash' ); ?>
							<span class="beta-badge"><?php esc_html_e( 'Beta', 'echodash' ); ?></span>
						</span>
					</label>
					<p class="description">
						<?php esc_html_e( 'Switch between the classic and new React-based admin interface. You can change this anytime in your preferences.', 'echodash' ); ?>
					</p>
				</form>
			</div>

			<?php if ( $can_manage ) : ?>
			<div class="ecd-admin-controls">
				<h4><?php esc_html_e( 'Admin Controls', 'echodash' ); ?></h4>
				
				<div class="ecd-rollout-stats">
					<p><strong><?php esc_html_e( 'Current Rollout Status:', 'echodash' ); ?></strong></p>
					<ul>
						<li><?php printf( esc_html__( 'Rollout percentage: %d%%', 'echodash' ), $rollout_stats['rollout_percentage'] ); ?></li>
						<li><?php printf( esc_html__( 'Beta users: %d', 'echodash' ), $rollout_stats['beta_users_count'] ); ?></li>
						<li><?php printf( esc_html__( 'Estimated React users: %1$d / %2$d', 'echodash' ), $rollout_stats['estimated_react_users'], $rollout_stats['total_users'] ); ?></li>
					</ul>
				</div>

				<form id="ecd-rollout-form" method="post" action="">
					<?php wp_nonce_field( 'ecd_update_rollout', 'ecd_rollout_nonce' ); ?>
					<p>
						<label for="ecd-rollout-percentage">
							<?php esc_html_e( 'Gradual rollout percentage:', 'echodash' ); ?>
							<input 
								type="number" 
								min="0" 
								max="100" 
								step="5"
								value="<?php echo esc_attr( $rollout_stats['rollout_percentage'] ); ?>"
								id="ecd-rollout-percentage"
								name="ecd_rollout_percentage"
							/>%
						</label>
						<button type="submit" class="button" style="margin-left: 10px;">
							<?php esc_html_e( 'Update', 'echodash' ); ?>
						</button>
					</p>
					<p class="description">
						<?php esc_html_e( 'Control what percentage of users see the React interface by default.', 'echodash' ); ?>
					</p>
				</form>

				<div class="ecd-admin-shortcuts">
					<p><strong><?php esc_html_e( 'Quick Links:', 'echodash' ); ?></strong></p>
					<p>
						<a href="<?php echo esc_url( add_query_arg( 'ecd_force_ui', 'react' ) ); ?>" class="button">
							<?php esc_html_e( 'Force React UI', 'echodash' ); ?>
						</a>
						<a href="<?php echo esc_url( add_query_arg( 'ecd_force_ui', 'legacy' ) ); ?>" class="button">
							<?php esc_html_e( 'Force Legacy UI', 'echodash' ); ?>
						</a>
					</p>
					<p class="description">
						<?php esc_html_e( 'Override links for testing (expires in 1 hour).', 'echodash' ); ?>
					</p>
				</div>
			</div>
			<?php endif; ?>
		</div>

		<style>
		.ecd-ui-toggle-container {
			background: #fff;
			border: 1px solid #ccd0d4;
			padding: 20px;
			margin: 20px 0;
			border-radius: 4px;
		}
		.ecd-ui-toggle label {
			font-weight: 600;
			display: flex;
			align-items: center;
			margin-bottom: 10px;
		}
		.ecd-ui-toggle input[type="checkbox"] {
			margin-right: 10px;
		}
		.beta-badge {
			background: #00a32a;
			color: white;
			padding: 2px 6px;
			border-radius: 3px;
			font-size: 11px;
			font-weight: normal;
			margin-left: 8px;
		}
		.ecd-admin-controls {
			margin-top: 20px;
			padding-top: 20px;
			border-top: 1px solid #ddd;
		}
		.ecd-rollout-stats ul {
			margin: 10px 0;
			padding-left: 20px;
		}
		.ecd-admin-shortcuts .button {
			margin-right: 10px;
		}
		</style>
		<?php
	}

	/**
	 * Show beta notice to React UI users
	 */
	public function show_beta_notice() {
		$screen = get_current_screen();
		if ( 'settings_page_echodash' !== $screen->id ) {
			return;
		}

		if ( ! $this->should_use_react_ui() ) {
			return;
		}

		// Don't show if user dismissed it
		if ( get_user_meta( get_current_user_id(), 'ecd_beta_notice_dismissed', true ) ) {
			return;
		}

		?>
		<div class="notice notice-info is-dismissible" id="ecd-beta-notice">
			<p>
				<strong><?php esc_html_e( 'You\'re using the new React interface!', 'echodash' ); ?></strong>
				<?php esc_html_e( 'This is a beta feature. If you encounter any issues, you can switch back to the classic interface using the toggle below.', 'echodash' ); ?>
			</p>
		</div>
		<script>
		jQuery(document).ready(function($) {
			$('#ecd-beta-notice').on('click', '.notice-dismiss', function() {
				$.post(ajaxurl, {
					action: 'ecd_dismiss_beta_notice',
					nonce: '<?php echo wp_create_nonce( 'ecd_dismiss_beta_notice' ); ?>'
				});
			});
		});
		</script>
		<?php
	}

	/**
	 * Handle UI toggle AJAX request
	 */
	public function ajax_toggle_ui() {
		check_ajax_referer( 'ecd_toggle_ui', 'nonce' );

		$preference = sanitize_text_field( $_POST['preference'] ?? 'legacy' );
		update_user_meta( get_current_user_id(), 'ecd_ui_preference', $preference );

		wp_send_json_success(
			array(
				'preference' => $preference,
				'message'    => $preference === 'react' ?
					__( 'Switched to React interface', 'echodash' ) :
					__( 'Switched to classic interface', 'echodash' ),
			)
		);
	}

	/**
	 * Handle rollout percentage update
	 */
	public function ajax_update_rollout() {
		check_ajax_referer( 'ecd_update_rollout', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( 'insufficient_permissions' );
		}

		$percentage = intval( $_POST['percentage'] ?? 0 );
		$percentage = max( 0, min( 100, $percentage ) ); // Clamp between 0-100

		update_option( self::FLAG_GRADUAL_ROLLOUT, $percentage );

		wp_send_json_success(
			array(
				'percentage' => $percentage,
				'stats'      => $this->get_rollout_stats(),
			)
		);
	}

	/**
	 * Handle beta user addition
	 */
	public function ajax_add_beta_user() {
		check_ajax_referer( 'ecd_add_beta_user', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( 'Insufficient permissions' );
		}

		$user_input = sanitize_text_field( $_POST['user_input'] );

		// Try to find user by username or email
		$user = get_user_by( 'login', $user_input );
		if ( ! $user ) {
			$user = get_user_by( 'email', $user_input );
		}

		if ( ! $user ) {
			wp_send_json_error( 'User not found' );
		}

		// Add to beta users list
		$beta_users = get_option( self::FLAG_BETA_USERS, array() );
		if ( ! in_array( $user->ID, $beta_users, true ) ) {
			$beta_users[] = $user->ID;
			update_option( self::FLAG_BETA_USERS, $beta_users );

			// Update user meta for faster lookups
			update_user_meta( $user->ID, self::USER_BETA_STATUS, true );
		}

		wp_send_json_success(
			array(
				'message' => 'Beta user added successfully',
				'user'    => array(
					'id'    => $user->ID,
					'name'  => $user->display_name,
					'email' => $user->user_email,
				),
			)
		);
	}

	/**
	 * Handle beta user removal
	 */
	public function ajax_remove_beta_user() {
		check_ajax_referer( 'ecd_remove_beta_user', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( 'Insufficient permissions' );
		}

		$user_id = intval( $_POST['user_id'] );

		// Remove from beta users list
		$beta_users = get_option( self::FLAG_BETA_USERS, array() );
		$beta_users = array_diff( $beta_users, array( $user_id ) );
		update_option( self::FLAG_BETA_USERS, $beta_users );

		// Update user meta
		delete_user_meta( $user_id, self::USER_BETA_STATUS );

		wp_send_json_success( array( 'message' => 'Beta user removed successfully' ) );
	}

	/**
	 * Handle beta notice dismissal
	 */
	public function ajax_dismiss_beta_notice() {
		check_ajax_referer( 'ecd_dismiss_beta_notice', 'nonce' );

		update_user_meta( get_current_user_id(), 'ecd_beta_notice_dismissed', true );

		wp_send_json_success();
	}

	/**
	 * Show emergency notice when legacy mode is forced
	 */
	public function show_emergency_notice() {
		if ( ! get_option( self::FLAG_FORCE_LEGACY, false ) ) {
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		?>
		<div class="notice notice-warning is-dismissible">
			<p>
				<strong><?php esc_html_e( 'Emergency Mode Active', 'echodash' ); ?></strong>
				<?php esc_html_e( 'The React interface has been disabled for all users. This should only be used during critical issues.', 'echodash' ); ?>
			</p>
			<p>
				<button type="button" class="button button-primary" onclick="ecdDisableEmergencyMode()">
					<?php esc_html_e( 'Disable Emergency Mode', 'echodash' ); ?>
				</button>
			</p>
		</div>
		<script>
		function ecdDisableEmergencyMode() {
			if (confirm('<?php esc_js( __( 'Are you sure you want to disable emergency mode?', 'echodash' ) ); ?>')) {
				jQuery.post(ajaxurl, {
					action: 'ecd_disable_emergency_mode',
					nonce: '<?php echo wp_create_nonce( 'ecd_disable_emergency_mode' ); ?>'
				}, function(response) {
					if (response.success) {
						location.reload();
					}
				});
			}
		}
		</script>
		<?php
	}

	/**
	 * Get feature flag debug information
	 */
	public function get_debug_info() {
		$user_id = get_current_user_id();

		return array(
			'user_id'              => $user_id,
			'should_use_react'     => $this->should_use_react_ui(),
			'user_preference'      => get_user_meta( $user_id, self::USER_PREFERENCE, true ),
			'is_beta_user'         => $this->is_beta_user(),
			'in_rollout_group'     => $this->user_in_rollout_group(),
			'rollout_percentage'   => get_option( self::FLAG_GRADUAL_ROLLOUT, 0 ),
			'global_react_enabled' => get_option( self::FLAG_REACT_UI, false ),
			'force_legacy'         => get_option( self::FLAG_FORCE_LEGACY, false ),
			'admin_override'       => get_transient( 'ecd_admin_override_' . $user_id ),
		);
	}

	/**
	 * Enable emergency mode (force legacy for all users)
	 */
	public function enable_emergency_mode() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		update_option( self::FLAG_FORCE_LEGACY, true );

		// Log the emergency activation
		error_log( 'EchoDash: Emergency mode activated by user ' . get_current_user_id() );

		return true;
	}

	/**
	 * Disable emergency mode
	 */
	public function disable_emergency_mode() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		delete_option( self::FLAG_FORCE_LEGACY );

		// Log the emergency deactivation
		error_log( 'EchoDash: Emergency mode deactivated by user ' . get_current_user_id() );

		return true;
	}

	/**
	 * Clear all user rollout groups (for rollout reset)
	 */
	public function clear_rollout_groups() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		global $wpdb;

		// Clear all rollout group assignments
		$wpdb->delete(
			$wpdb->usermeta,
			array( 'meta_key' => self::USER_ROLLOUT_GROUP ),
			array( '%s' )
		);

		return true;
	}
}

// Initialize feature flags system
add_action(
	'init',
	function () {
		new EchoDash_Feature_Flags();
	}
);
