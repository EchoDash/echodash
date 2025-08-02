/**
 * App State Reducer
 * 
 * Manages global application state for EchoDash React interface.
 */

import { IntegrationState, Integration, Trigger, EventConfig, Settings } from '../../types';

export type AppAction =
	| { type: 'SET_INTEGRATIONS'; payload: Integration[] }
	| { type: 'SET_CURRENT_INTEGRATION'; payload: string | null }
	| { type: 'SET_TRIGGERS'; payload: { slug: string; triggers: Trigger[] } }
	| { type: 'SET_LOADING'; payload: { key: keyof IntegrationState['loading']; value: boolean } }
	| { type: 'SET_ERROR'; payload: { key: keyof IntegrationState['errors']; value: string | undefined } }
	| { type: 'UPDATE_INTEGRATION'; payload: Integration }
	| { type: 'UPDATE_TRIGGER'; payload: { integrationSlug: string; trigger: Trigger } }
	| { type: 'ADD_TRIGGER'; payload: { integrationSlug: string; trigger: Trigger } }
	| { type: 'REMOVE_TRIGGER'; payload: { integrationSlug: string; triggerId: string } }
	| { type: 'SET_SETTINGS'; payload: Settings }
	| { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
	| { type: 'SET_PREVIEW_DATA'; payload: { event: EventConfig; data: any } | null }
	| { type: 'ADD_NOTIFICATION'; payload: { id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' } }
	| { type: 'REMOVE_NOTIFICATION'; payload: string }
	| { type: 'CLEAR_ERRORS' }
	| { type: 'RESET_STATE' };

export const getInitialState = (): IntegrationState => {
	// Access window.ecdReactData lazily to avoid errors during module initialization
	const data = typeof window !== 'undefined' && window.ecdReactData ? window.ecdReactData : null;
	
	return {
		integrations: data?.integrations || [],
		currentIntegration: null,
		triggers: data?.triggers || {},
		settings: data?.settings || null,
		previewData: null,
		notifications: [],
		loading: {
			integrations: false,
			triggers: false,
			saving: false,
			settings: false,
		},
		errors: {},
	};
};

export const initialState: IntegrationState = getInitialState();

export const appReducer = (state: IntegrationState, action: AppAction): IntegrationState => {
	switch (action.type) {
		case 'SET_INTEGRATIONS':
			return {
				...state,
				integrations: action.payload,
			};

		case 'SET_CURRENT_INTEGRATION':
			return {
				...state,
				currentIntegration: action.payload,
			};

		case 'SET_TRIGGERS':
			return {
				...state,
				triggers: {
					...state.triggers,
					[action.payload.slug]: action.payload.triggers,
				},
			};

		case 'SET_LOADING':
			return {
				...state,
				loading: {
					...state.loading,
					[action.payload.key]: action.payload.value,
				},
			};

		case 'SET_ERROR':
			return {
				...state,
				errors: {
					...state.errors,
					[action.payload.key]: action.payload.value,
				},
			};

		case 'UPDATE_INTEGRATION':
			return {
				...state,
				integrations: state.integrations.map(integration =>
					integration.slug === action.payload.slug
						? action.payload
						: integration
				),
			};

		case 'UPDATE_TRIGGER':
			const integrationTriggers = state.triggers[action.payload.integrationSlug] || [];
			return {
				...state,
				triggers: {
					...state.triggers,
					[action.payload.integrationSlug]: integrationTriggers.map(trigger =>
						trigger.id === action.payload.trigger.id
							? action.payload.trigger
							: trigger
					),
				},
			};

		case 'ADD_TRIGGER':
			return {
				...state,
				triggers: {
					...state.triggers,
					[action.payload.integrationSlug]: [
						...(state.triggers[action.payload.integrationSlug] || []),
						action.payload.trigger,
					],
				},
			};

		case 'REMOVE_TRIGGER':
			return {
				...state,
				triggers: {
					...state.triggers,
					[action.payload.integrationSlug]: (state.triggers[action.payload.integrationSlug] || [])
						.filter(trigger => trigger.id !== action.payload.triggerId),
				},
			};

		case 'SET_SETTINGS':
			return {
				...state,
				settings: action.payload,
			};

		case 'UPDATE_SETTINGS':
			return {
				...state,
				settings: state.settings ? { ...state.settings, ...action.payload } : null,
			};

		case 'SET_PREVIEW_DATA':
			return {
				...state,
				previewData: action.payload,
			};

		case 'ADD_NOTIFICATION':
			return {
				...state,
				notifications: [...state.notifications, action.payload],
			};

		case 'REMOVE_NOTIFICATION':
			return {
				...state,
				notifications: state.notifications.filter(n => n.id !== action.payload),
			};

		case 'CLEAR_ERRORS':
			return {
				...state,
				errors: {},
			};

		case 'RESET_STATE':
			return initialState;

		default:
			return state;
	}
};