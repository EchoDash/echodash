/**
 * App Provider Component
 * 
 * Provides global state and context for the EchoDash React app.
 */

import React, { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from 'react';
import { IntegrationState, Integration, Trigger } from '../../types';
import { appReducer, initialState, AppAction } from './appReducer';

interface AppContextType {
	state: IntegrationState;
	dispatch: React.Dispatch<AppAction>;
	// Helper functions for common operations
	setCurrentIntegration: (slug: string | null) => void;
	updateIntegration: (integration: Integration) => void;
	addTrigger: (integrationSlug: string, trigger: Trigger) => void;
	removeTrigger: (integrationSlug: string, triggerId: string) => void;
	setLoading: (key: keyof IntegrationState['loading'], value: boolean) => void;
	setError: (key: keyof IntegrationState['errors'], error: string | undefined) => void;
	addNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
	removeNotification: (id: string) => void;
	clearErrors: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
	children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
	const [state, dispatch] = useReducer(appReducer, initialState);

	// Helper function to generate unique ID for notifications
	const generateId = useCallback(() => {
		return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}, []);

	// Helper functions for common operations
	const setCurrentIntegration = useCallback((slug: string | null) => {
		dispatch({ type: 'SET_CURRENT_INTEGRATION', payload: slug });
	}, []);

	const updateIntegration = useCallback((integration: Integration) => {
		dispatch({ type: 'UPDATE_INTEGRATION', payload: integration });
	}, []);

	const addTrigger = useCallback((integrationSlug: string, trigger: Trigger) => {
		dispatch({ type: 'ADD_TRIGGER', payload: { integrationSlug, trigger } });
	}, []);

	const removeTrigger = useCallback((integrationSlug: string, triggerId: string) => {
		dispatch({ type: 'REMOVE_TRIGGER', payload: { integrationSlug, triggerId } });
	}, []);

	const setLoading = useCallback((key: keyof IntegrationState['loading'], value: boolean) => {
		dispatch({ type: 'SET_LOADING', payload: { key, value } });
	}, []);

	const setError = useCallback((key: keyof IntegrationState['errors'], error: string | undefined) => {
		dispatch({ type: 'SET_ERROR', payload: { key, value: error } });
	}, []);

	const addNotification = useCallback((
		message: string,
		type: 'success' | 'error' | 'warning' | 'info' = 'info'
	) => {
		const id = generateId();
		dispatch({ type: 'ADD_NOTIFICATION', payload: { id, message, type } });

		// Auto-remove success notifications after 5 seconds
		if (type === 'success') {
			setTimeout(() => {
				dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
			}, 5000);
		}
	}, [generateId]);

	const removeNotification = useCallback((id: string) => {
		dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
	}, []);

	const clearErrors = useCallback(() => {
		dispatch({ type: 'CLEAR_ERRORS' });
	}, []);

	// Auto-clear errors when changing integrations
	useEffect(() => {
		if (state.currentIntegration) {
			clearErrors();
		}
	}, [state.currentIntegration, clearErrors]);

	const contextValue: AppContextType = {
		state,
		dispatch,
		setCurrentIntegration,
		updateIntegration,
		addTrigger,
		removeTrigger,
		setLoading,
		setError,
		addNotification,
		removeNotification,
		clearErrors,
	};

	return (
		<AppContext.Provider value={contextValue}>
			{children}
		</AppContext.Provider>
	);
};

export const useAppContext = (): AppContextType => {
	const context = useContext(AppContext);
	if (context === undefined) {
		throw new Error('useAppContext must be used within an AppProvider');
	}
	return context;
};