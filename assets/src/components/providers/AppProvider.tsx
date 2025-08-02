/**
 * App Provider Component
 * 
 * Provides global state and context for the EchoDash React app.
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { IntegrationState } from '../../types';
import { appReducer, initialState, AppAction } from './appReducer';

interface AppContextType {
	state: IntegrationState;
	dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
	children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
	const [state, dispatch] = useReducer(appReducer, initialState);

	return (
		<AppContext.Provider value={{ state, dispatch }}>
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