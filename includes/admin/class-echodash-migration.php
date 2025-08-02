<?php
/**
 * EchoDash Migration System
 * 
 * Handles data migration and backward compatibility for the React interface.
 * 
 * @package EchoDash
 * @since 2.0.0
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class EchoDash_Migration {

	const MIGRATION_VERSION = '2.0.0';
	const BACKUP_OPTION_KEY = 'echodash_backup_';
	const MAX_BACKUPS = 5;

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'admin_init', array( $this, 'check_migration_needed' ) );
		add_action( 'wp_ajax_ecd_migrate_data', array( $this, 'ajax_migrate_data' ) );
		add_action( 'wp_ajax_ecd_rollback_data', array( $this, 'ajax_rollback_data' ) );
		add_action( 'wp_ajax_ecd_validate_migration', array( $this, 'ajax_validate_migration' ) );
	}

	/**
	 * Check if migration is needed
	 */
	public function check_migration_needed() {
		$current_version = get_option( 'echodash_migration_version', '1.0.0' );
		
		if ( version_compare( $current_version, self::MIGRATION_VERSION, '<' ) ) {
			add_action( 'admin_notices', array( $this, 'show_migration_notice' ) );
		}
	}

	/**
	 * Show migration notice
	 */
	public function show_migration_notice() {
		$screen = get_current_screen();
		if ( $screen && strpos( $screen->id, 'echodash' ) === false ) {
			return;
		}

		?>
		<div class="notice notice-info is-dismissible" id="echodash-migration-notice">
			<h3><?php _e( 'EchoDash Migration Available', 'echodash' ); ?></h3>
			<p><?php _e( 'A new version of EchoDash is available with an improved React interface. Your existing settings will be preserved during migration.', 'echodash' ); ?></p>
			<p>
				<button type="button" class="button button-primary" id="ecd-start-migration">
					<?php _e( 'Start Migration', 'echodash' ); ?>
				</button>
				<button type="button" class="button" id="ecd-learn-more">
					<?php _e( 'Learn More', 'echodash' ); ?>
				</button>
			</p>
			<div id="ecd-migration-progress" style="display: none;">
				<div class="ecd-progress-bar">
					<div class="ecd-progress-fill" style="width: 0%;"></div>
				</div>
				<p class="ecd-progress-text"><?php _e( 'Preparing migration...', 'echodash' ); ?></p>
			</div>
		</div>

		<script type="text/javascript">
		jQuery(document).ready(function($) {
			$('#ecd-start-migration').on('click', function() {
				startMigration();
			});

			$('#ecd-learn-more').on('click', function() {
				// Open documentation in new tab
				window.open('https://echodash.com/docs/migration-guide', '_blank');
			});

			function startMigration() {
				$('#ecd-migration-progress').show();
				$('#ecd-start-migration, #ecd-learn-more').prop('disabled', true);

				updateProgress(10, '<?php _e( 'Creating backup...', 'echodash' ); ?>');

				$.ajax({
					url: ajaxurl,
					type: 'POST',
					data: {
						action: 'ecd_migrate_data',
						nonce: '<?php echo wp_create_nonce( 'ecd_migrate_data' ); ?>'
					},
					success: function(response) {
						if (response.success) {
							updateProgress(100, '<?php _e( 'Migration completed successfully!', 'echodash' ); ?>');
							setTimeout(function() {
								location.reload();
							}, 2000);
						} else {
							showError(response.data.message || '<?php _e( 'Migration failed', 'echodash' ); ?>');
						}
					},
					error: function() {
						showError('<?php _e( 'Migration request failed', 'echodash' ); ?>');
					}
				});
			}

			function updateProgress(percent, message) {
				$('.ecd-progress-fill').css('width', percent + '%');
				$('.ecd-progress-text').text(message);
			}

			function showError(message) {
				$('.ecd-progress-text').html('<span style="color: #d63638;">' + message + '</span>');
				$('#ecd-start-migration, #ecd-learn-more').prop('disabled', false);
			}
		});
		</script>

		<style type="text/css">
		.ecd-progress-bar {
			width: 100%;
			height: 20px;
			background-color: #f1f1f1;
			border-radius: 10px;
			overflow: hidden;
			margin: 10px 0;
		}
		.ecd-progress-fill {
			height: 100%;
			background-color: #0073aa;
			transition: width 0.3s ease;
		}
		</style>
		<?php
	}

	/**
	 * AJAX handler for data migration
	 */
	public function ajax_migrate_data() {
		check_ajax_referer( 'ecd_migrate_data', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Insufficient permissions', 'echodash' ) ) );
		}

		$result = $this->migrate_settings();

		if ( $result['success'] ) {
			wp_send_json_success( array(
				'message' => __( 'Migration completed successfully', 'echodash' ),
				'migrated_count' => $result['migrated_count'],
				'backup_created' => $result['backup_created'],
			) );
		} else {
			wp_send_json_error( array(
				'message' => implode( ', ', $result['errors'] ),
				'backup_created' => $result['backup_created'],
			) );
		}
	}

	/**
	 * AJAX handler for data rollback
	 */
	public function ajax_rollback_data() {
		check_ajax_referer( 'ecd_rollback_data', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Insufficient permissions', 'echodash' ) ) );
		}

		$result = $this->rollback_settings();

		if ( $result['success'] ) {
			wp_send_json_success( array(
				'message' => __( 'Settings rolled back successfully', 'echodash' ),
			) );
		} else {
			wp_send_json_error( array(
				'message' => $result['error'],
			) );
		}
	}

	/**
	 * AJAX handler for migration validation
	 */
	public function ajax_validate_migration() {
		check_ajax_referer( 'ecd_validate_migration', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Insufficient permissions', 'echodash' ) ) );
		}

		$validation_result = $this->validate_migration();

		wp_send_json_success( $validation_result );
	}

	/**
	 * Perform data migration
	 */
	public function migrate_settings() {
		$results = array(
			'success' => false,
			'migrated_count' => 0,
			'backup_created' => false,
			'errors' => array(),
		);

		try {
			// Step 1: Create backup
			$backup_created = $this->create_backup();
			$results['backup_created'] = $backup_created;

			if ( ! $backup_created ) {
				throw new Exception( __( 'Failed to create backup', 'echodash' ) );
			}

			// Step 2: Migrate global settings
			$global_migrated = $this->migrate_global_settings();
			$results['migrated_count'] += $global_migrated;

			// Step 3: Migrate post-specific settings
			$post_migrated = $this->migrate_post_settings();
			$results['migrated_count'] += $post_migrated;

			// Step 4: Migrate user preferences
			$user_migrated = $this->migrate_user_preferences();
			$results['migrated_count'] += $user_migrated;

			// Step 5: Validate migration
			$validation_result = $this->validate_migration();
			if ( ! $validation_result['valid'] ) {
				throw new Exception( __( 'Migration validation failed: ', 'echodash' ) . implode( ', ', $validation_result['errors'] ) );
			}

			// Step 6: Update version
			update_option( 'echodash_migration_version', self::MIGRATION_VERSION );

			$results['success'] = true;

		} catch ( Exception $e ) {
			$results['errors'][] = $e->getMessage();
			error_log( 'EchoDash Migration Error: ' . $e->getMessage() );

			// Attempt rollback on failure
			$this->rollback_settings();
		}

		return $results;
	}

	/**
	 * Create backup of current settings
	 */
	private function create_backup() {
		$timestamp = time();
		$backup_key = self::BACKUP_OPTION_KEY . $timestamp;

		$data_to_backup = array(
			'echodash_options' => get_option( 'echodash_options', array() ),
			'echodash_endpoint' => get_option( 'echodash_endpoint', '' ),
			'post_meta' => $this->get_all_post_meta(),
			'user_preferences' => $this->get_all_user_preferences(),
			'timestamp' => $timestamp,
			'version' => get_option( 'echodash_migration_version', '1.0.0' ),
			'wordpress_version' => get_bloginfo( 'version' ),
			'plugin_version' => ECHODASH_VERSION,
		);

		$backup_success = update_option( $backup_key, $data_to_backup );

		if ( $backup_success ) {
			// Keep only the last N backups
			$this->cleanup_old_backups();

			// Store current backup reference
			update_option( 'echodash_current_backup', $backup_key );
		}

		return $backup_success;
	}

	/**
	 * Migrate global settings
	 */
	private function migrate_global_settings() {
		$settings = get_option( 'echodash_options', array() );
		$migrated_count = 0;

		// Check if settings need migration
		if ( $this->is_legacy_format( $settings ) ) {
			$migrated_settings = $this->convert_legacy_settings( $settings );
			update_option( 'echodash_options', $migrated_settings );
			$migrated_count++;
		}

		// Ensure proper structure
		$this->ensure_settings_structure();

		return $migrated_count;
	}

	/**
	 * Migrate post-specific settings
	 */
	private function migrate_post_settings() {
		global $wpdb;

		$query = "
			SELECT post_id, meta_value 
			FROM {$wpdb->postmeta} 
			WHERE meta_key = 'echodash_settings'
		";

		$results = $wpdb->get_results( $query );
		$migrated_count = 0;

		foreach ( $results as $result ) {
			$settings = maybe_unserialize( $result->meta_value );

			if ( $this->is_legacy_format( $settings ) ) {
				$migrated_settings = $this->convert_legacy_settings( $settings );
				update_post_meta( $result->post_id, 'echodash_settings', $migrated_settings );
				$migrated_count++;
			}
		}

		return $migrated_count;
	}

	/**
	 * Migrate user preferences
	 */
	private function migrate_user_preferences() {
		// For now, just ensure UI preference is set to legacy for existing users
		$users = get_users( array( 'capability' => 'manage_options' ) );
		$migrated_count = 0;

		foreach ( $users as $user ) {
			$preference = get_user_meta( $user->ID, 'ecd_ui_preference', true );
			if ( empty( $preference ) ) {
				// Set existing users to legacy UI by default
				update_user_meta( $user->ID, 'ecd_ui_preference', 'legacy' );
				$migrated_count++;
			}
		}

		return $migrated_count;
	}

	/**
	 * Check if settings are in legacy format
	 */
	private function is_legacy_format( $settings ) {
		if ( ! is_array( $settings ) ) {
			return false;
		}

		// Check for legacy structure indicators
		// This would be customized based on actual legacy format
		return ! isset( $settings['version'] ) || version_compare( $settings['version'], '2.0.0', '<' );
	}

	/**
	 * Convert legacy settings to new format
	 */
	private function convert_legacy_settings( $settings ) {
		if ( ! is_array( $settings ) ) {
			return array();
		}

		$converted = array(
			'version' => '2.0.0',
			'migrated_from' => isset( $settings['version'] ) ? $settings['version'] : '1.0.0',
			'migration_date' => time(),
		);

		// Convert specific legacy fields
		// This would be customized based on actual legacy format
		foreach ( $settings as $key => $value ) {
			switch ( $key ) {
				case 'old_field_name':
					$converted['new_field_name'] = $value;
					break;
				default:
					$converted[ $key ] = $value;
					break;
			}
		}

		return $converted;
	}

	/**
	 * Ensure proper settings structure
	 */
	private function ensure_settings_structure() {
		$settings = get_option( 'echodash_options', array() );

		$default_structure = array(
			'version' => self::MIGRATION_VERSION,
			'integrations' => array(),
			'general' => array(),
		);

		$settings = wp_parse_args( $settings, $default_structure );
		update_option( 'echodash_options', $settings );
	}

	/**
	 * Validate migration
	 */
	private function validate_migration() {
		$errors = array();
		$warnings = array();

		// Validate global settings structure
		$global_settings = get_option( 'echodash_options', array() );
		if ( ! $this->validate_settings_structure( $global_settings ) ) {
			$errors[] = __( 'Global settings structure invalid', 'echodash' );
		}

		// Validate post-specific settings
		$post_settings = $this->get_all_post_meta();
		foreach ( $post_settings as $post_id => $settings ) {
			if ( ! $this->validate_post_settings( $settings ) ) {
				$errors[] = sprintf( __( 'Post %d settings invalid', 'echodash' ), $post_id );
			}
		}

		// Validate data integrity
		$integrity_check = $this->check_data_integrity();
		if ( ! $integrity_check['valid'] ) {
			$errors = array_merge( $errors, $integrity_check['errors'] );
		}

		// Check for deprecated fields
		$deprecated_check = $this->check_deprecated_fields();
		if ( ! empty( $deprecated_check ) ) {
			$warnings = array_merge( $warnings, $deprecated_check );
		}

		return array(
			'valid' => empty( $errors ),
			'errors' => $errors,
			'warnings' => $warnings,
		);
	}

	/**
	 * Validate settings structure
	 */
	private function validate_settings_structure( $settings ) {
		if ( ! is_array( $settings ) ) {
			return false;
		}

		// Check required fields
		$required_fields = array( 'version' );
		foreach ( $required_fields as $field ) {
			if ( ! isset( $settings[ $field ] ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Validate post settings
	 */
	private function validate_post_settings( $settings ) {
		if ( ! is_array( $settings ) ) {
			return true; // Empty settings are valid
		}

		// Validate structure if settings exist
		return $this->validate_settings_structure( $settings );
	}

	/**
	 * Check data integrity
	 */
	private function check_data_integrity() {
		$errors = array();

		// Check if essential options exist
		if ( get_option( 'echodash_options' ) === false ) {
			$errors[] = __( 'Main options not found', 'echodash' );
		}

		// Check database consistency
		global $wpdb;
		$count = $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_key = 'echodash_settings'" );
		if ( $count === null ) {
			$errors[] = __( 'Database query failed', 'echodash' );
		}

		return array(
			'valid' => empty( $errors ),
			'errors' => $errors,
		);
	}

	/**
	 * Check for deprecated fields
	 */
	private function check_deprecated_fields() {
		$warnings = array();
		$settings = get_option( 'echodash_options', array() );

		$deprecated_fields = array(
			'old_field_1' => 'Use new_field_1 instead',
			'old_field_2' => 'Use new_field_2 instead',
		);

		foreach ( $deprecated_fields as $field => $message ) {
			if ( isset( $settings[ $field ] ) ) {
				$warnings[] = sprintf( __( 'Deprecated field "%s": %s', 'echodash' ), $field, $message );
			}
		}

		return $warnings;
	}

	/**
	 * Rollback settings to previous backup
	 */
	public function rollback_settings() {
		$current_backup = get_option( 'echodash_current_backup' );
		if ( ! $current_backup ) {
			return array( 'success' => false, 'error' => __( 'No backup found', 'echodash' ) );
		}

		$backup_data = get_option( $current_backup );
		if ( ! $backup_data ) {
			return array( 'success' => false, 'error' => __( 'Backup data not found', 'echodash' ) );
		}

		try {
			// Restore global settings
			update_option( 'echodash_options', $backup_data['echodash_options'] );
			update_option( 'echodash_endpoint', $backup_data['echodash_endpoint'] );

			// Restore post meta
			foreach ( $backup_data['post_meta'] as $post_id => $meta ) {
				update_post_meta( $post_id, 'echodash_settings', $meta );
			}

			// Restore user preferences
			foreach ( $backup_data['user_preferences'] as $user_id => $preferences ) {
				foreach ( $preferences as $key => $value ) {
					update_user_meta( $user_id, $key, $value );
				}
			}

			// Revert migration version
			update_option( 'echodash_migration_version', $backup_data['version'] );

			return array( 'success' => true );

		} catch ( Exception $e ) {
			return array( 'success' => false, 'error' => $e->getMessage() );
		}
	}

	/**
	 * Get all post meta for EchoDash
	 */
	private function get_all_post_meta() {
		global $wpdb;

		$query = "
			SELECT post_id, meta_value 
			FROM {$wpdb->postmeta} 
			WHERE meta_key = 'echodash_settings'
		";

		$results = $wpdb->get_results( $query );
		$post_meta = array();

		foreach ( $results as $result ) {
			$post_meta[ $result->post_id ] = maybe_unserialize( $result->meta_value );
		}

		return $post_meta;
	}

	/**
	 * Get all user preferences for EchoDash
	 */
	private function get_all_user_preferences() {
		global $wpdb;

		$query = "
			SELECT user_id, meta_key, meta_value 
			FROM {$wpdb->usermeta} 
			WHERE meta_key LIKE 'ecd_%' OR meta_key LIKE 'echodash_%'
		";

		$results = $wpdb->get_results( $query );
		$user_preferences = array();

		foreach ( $results as $result ) {
			if ( ! isset( $user_preferences[ $result->user_id ] ) ) {
				$user_preferences[ $result->user_id ] = array();
			}
			$user_preferences[ $result->user_id ][ $result->meta_key ] = maybe_unserialize( $result->meta_value );
		}

		return $user_preferences;
	}

	/**
	 * Cleanup old backups
	 */
	private function cleanup_old_backups() {
		global $wpdb;

		$pattern = self::BACKUP_OPTION_KEY . '%';
		$query = $wpdb->prepare( "
			SELECT option_name 
			FROM {$wpdb->options} 
			WHERE option_name LIKE %s 
			ORDER BY option_name DESC
		", $pattern );

		$backup_options = $wpdb->get_col( $query );

		if ( count( $backup_options ) > self::MAX_BACKUPS ) {
			$backups_to_delete = array_slice( $backup_options, self::MAX_BACKUPS );
			
			foreach ( $backups_to_delete as $backup_option ) {
				delete_option( $backup_option );
			}
		}
	}

	/**
	 * Get migration status
	 */
	public function get_migration_status() {
		$current_version = get_option( 'echodash_migration_version', '1.0.0' );
		$backup_exists = get_option( 'echodash_current_backup' ) !== false;

		return array(
			'needs_migration' => version_compare( $current_version, self::MIGRATION_VERSION, '<' ),
			'current_version' => $current_version,
			'target_version' => self::MIGRATION_VERSION,
			'backup_exists' => $backup_exists,
			'can_rollback' => $backup_exists,
		);
	}
}

// Initialize migration system
if ( is_admin() ) {
	new EchoDash_Migration();
}