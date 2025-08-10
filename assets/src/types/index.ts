/**
 * Shared TypeScript interfaces for EchoDash React components
 *
 * This file centralizes all type definitions to avoid duplication
 * across React components following best practices.
 */

export interface MergeTagOption {
	meta: string;
	preview: string | number;
	placeholder: string;
}

export interface MergeTagGroup {
	name: string;
	type: string;
	options: MergeTagOption[];
}

export interface Integration {
	slug: string;
	name: string;
	icon: string;
	iconBackgroundColor: string;
	triggerCount: number;
	enabled: boolean;
	description?: string;
	availableTriggers?: AvailableTrigger[];
	singleItemTriggers?: SingleItemTriggerGroup[];
}

export interface AvailableTrigger {
	id: string;
	name: string;
	description?: string;
	defaultEvent?: {
		name?: string;
		mappings?: Record<string, string | number>;
	};
	options?: MergeTagGroup[];
}

export interface Trigger {
	id: string;
	name: string;
	trigger?: string;
	description?: string;
	enabled?: boolean;
	event_name?: string;
	mappings?: TriggerMapping[];
}

export interface TriggerMapping {
	key: string;
	value: string;
}

export interface SingleItemTriggerGroup {
	trigger: string;
	name: string;
	description?: string;
	items: SingleItemTriggerItem[];
}

export interface SingleItemTriggerItem {
	post_id: number;
	post_title: string;
	edit_url: string;
	event_name: string;
	mappings: TriggerMapping[];
}

export interface EchoDashSettings {
	endpoint?: string;
	isConnected?: boolean;
	connectUrl?: string;
}

export interface KeyValuePair {
	key: string;
	value: string;
}
