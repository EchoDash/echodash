/**
 * App State Reducer
 * 
 * Manages global application state for EchoDash React interface.
 */

import { IntegrationState, Integration, Trigger } from '../../types';

export type AppAction =
	| { type: 'SET_INTEGRATIONS'; payload: Integration[] }
	| { type: 'SET_CURRENT_INTEGRATION'; payload: string | null }
	| { type: 'SET_TRIGGERS'; payload: { slug: string; triggers: Trigger[] } }
	| { type: 'SET_LOADING'; payload: { key: keyof IntegrationState['loading']; value: boolean } }
	| { type: 'SET_ERROR'; payload: { key: keyof IntegrationState['errors']; value: string | undefined } }
	| { type: 'UPDATE_INTEGRATION'; payload: Integration }
	| { type: 'UPDATE_TRIGGER'; payload: { integrationSlug: string; trigger: Trigger } };

export const initialState: IntegrationState = {
	integrations: window.ecdReactData?.integrations || [],
	currentIntegration: null,
	triggers: {},
	loading: {
		integrations: false,
		triggers: false,
		saving: false,
	},
	errors: {},
};

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

		default:
			return state;
	}
};