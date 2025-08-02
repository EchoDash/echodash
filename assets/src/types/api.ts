/**
 * API Type Definitions
 * 
 * Defines the structure for API requests and responses.
 */

export interface APIResponse<T = any> {
	/** Response data */
	data: T;
	
	/** Whether the request was successful */
	success: boolean;
	
	/** Optional message */
	message?: string;
	
	/** Error details if request failed */
	error?: {
		code: string;
		message: string;
		details?: any;
	};
}

export interface APIRequestOptions {
	/** HTTP method */
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	
	/** Request data */
	data?: any;
	
	/** Additional headers */
	headers?: Record<string, string>;
	
	/** Request timeout in milliseconds */
	timeout?: number;
}

export interface Settings {
	/** EchoDash API endpoint */
	endpoint: string;
	
	/** API key for authentication */
	apiKey: string;
	
	/** Whether EchoDash is enabled */
	enabled: boolean;
	
	/** User ID for EchoDash */
	userId?: string;
	
	/** Debug mode setting */
	debug?: boolean;
	
	/** Additional configuration options */
	options?: Record<string, any>;
}

export interface SettingsUpdate {
	/** Partial settings to update */
	[key: string]: any;
}

export interface PreviewData {
	/** Event name */
	eventName: string;
	
	/** Processed event data */
	eventData: Record<string, any>;
	
	/** Merge tags that were processed */
	processedTags: MergeTagResult[];
	
	/** Whether the preview is valid */
	isValid: boolean;
	
	/** Validation errors if any */
	errors?: string[];
}

export interface MergeTagResult {
	/** Original merge tag */
	tag: string;
	
	/** Processed value */
	value: any;
	
	/** Whether processing was successful */
	success: boolean;
	
	/** Error message if processing failed */
	error?: string;
}

export interface MergeTag {
	/** The merge tag syntax */
	tag: string;
	
	/** Human-readable label */
	label: string;
	
	/** Example value */
	example?: any;
	
	/** Description of what this tag represents */
	description?: string;
	
	/** Category for grouping */
	category?: string;
}