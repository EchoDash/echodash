/**
 * Integration Type Definitions
 * 
 * Defines the structure for EchoDash integrations with WordPress plugins.
 */

export interface Integration {
	/** Unique identifier for the integration */
	slug: string;
	
	/** Human-readable name of the integration */
	name: string;
	
	/** Icon identifier or URL for the integration */
	icon: string;
	
	/** Number of configured triggers */
	triggerCount: number;
	
	/** Whether the integration is currently enabled */
	enabled: boolean;
	
	/** Available triggers for this integration */
	triggers: Trigger[];
	
	/** Whether the plugin dependency is active */
	isActive: boolean;
	
	/** Description of what this integration does */
	description?: string;
	
	/** Plugin version being integrated with */
	pluginVersion?: string;
	
	/** Minimum required plugin version */
	minPluginVersion?: string;
}

export interface Trigger {
	/** Unique identifier for the trigger */
	id: string;
	
	/** Human-readable name of the trigger */
	name: string;
	
	/** Description of when this trigger fires */
	description: string;
	
	/** Whether this trigger supports global configuration */
	hasGlobal: boolean;
	
	/** Whether this trigger supports per-post configuration */
	hasSingle: boolean;
	
	/** Post types this trigger applies to (when hasSingle is true) */
	postTypes?: string[];
	
	/** Available option types for data mapping */
	optionTypes: string[];
	
	/** Default event configuration */
	defaultEvent: EventConfig;
	
	/** Whether this trigger is currently enabled */
	enabled?: boolean;
	
	/** WordPress hook or action that fires this trigger */
	hook?: string;
	
	/** Priority for the WordPress hook */
	priority?: number;
}

export interface EventConfig {
	/** Name of the event to send to EchoDash */
	name: string;
	
	/** Data mappings for the event */
	mappings: EventMapping[];
	
	/** Whether this event is enabled */
	enabled?: boolean;
	
	/** Additional metadata for the event */
	meta?: Record<string, any>;
}

export interface EventMapping {
	/** The key name in the event data */
	key: string;
	
	/** The merge tag or static value */
	value: string;
	
	/** Whether this mapping is required */
	required?: boolean;
	
	/** Data type of the value */
	type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
}

export interface Settings {
	/** EchoDash API endpoint */
	endpoint: string;
	
	/** Debug mode status */
	debug_mode: boolean;
	
	/** Plugin version */
	version: string;
	
	/** General settings object */
	settings: Record<string, any>;
	
	/** User capabilities */
	capabilities: {
		can_manage_options: boolean;
		can_edit_posts: boolean;
		is_admin: boolean;
	};
}

export interface Notification {
	/** Unique identifier */
	id: string;
	
	/** Notification message */
	message: string;
	
	/** Notification type */
	type: 'success' | 'error' | 'warning' | 'info';
	
	/** Optional auto-dismiss timeout in milliseconds */
	timeout?: number;
}

export interface IntegrationState {
	/** All available integrations */
	integrations: Integration[];
	
	/** Currently selected integration slug */
	currentIntegration: string | null;
	
	/** Triggers by integration slug */
	triggers: Record<string, Trigger[]>;
	
	/** Global settings */
	settings: Settings | null;
	
	/** Current preview data */
	previewData: { event: EventConfig; data: any } | null;
	
	/** Active notifications */
	notifications: Notification[];
	
	/** Loading states */
	loading: {
		integrations: boolean;
		triggers: boolean;
		saving: boolean;
		settings: boolean;
	};
	
	/** Error states */
	errors: {
		general?: string;
		integration?: string;
		trigger?: string;
		settings?: string;
	};
}