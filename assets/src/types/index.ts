/**
 * Main Types Export
 * 
 * Central export point for all TypeScript type definitions.
 */

// Integration types
export type {
	Integration,
	Trigger,
	EventConfig,
	EventMapping,
	IntegrationState
} from './integration';

// API types
export type {
	APIResponse,
	APIRequestOptions,
	Settings,
	SettingsUpdate,
	PreviewData,
	MergeTagResult,
	MergeTag
} from './api';

// Form types
export type {
	FormField,
	FormFieldOption,
	FieldCondition,
	FieldValidation,
	FormSchema,
	FormState
} from './form';

// WordPress Global Types
declare global {
	interface Window {
		ecdReactData: {
			apiUrl: string;
			nonce: string;
			integrations: any[];
			currentUser: {
				id: number;
				name: string;
				email: string;
			};
			debugMode?: boolean;
		};
		wp: {
			apiFetch: (options: any) => Promise<any>;
		};
	}
}