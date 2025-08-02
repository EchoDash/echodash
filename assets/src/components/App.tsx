/**
 * Main App Component
 * 
 * Root component for the EchoDash React admin interface.
 */

import React from 'react';
import { AppProvider } from './providers/AppProvider';
import { IntegrationDashboard } from './integration/IntegrationDashboard';
import { NotificationSystem } from './notifications/NotificationSystem';
import { ErrorBoundary } from './common/ErrorBoundary';

// Get global data from PHP
declare global {
	interface Window {
		ecdReactData: {
			settings: {
				endpoint?: string;
				isConnected?: boolean;
			};
			integrations: Array<{
				slug: string;
				name: string;
				icon: string;
				triggerCount: number;
				enabled: boolean;
			}>;
			triggers: Record<string, any[]>;
			nonce: string;
			apiUrl: string;
			i18n: Record<string, string>;
		};
	}
}

export const App: React.FC = () => {
	return (
		<ErrorBoundary>
			<AppProvider>
				<div className="echodash-react-app">
					<NotificationSystem />
					<IntegrationDashboard />
				</div>
			</AppProvider>
		</ErrorBoundary>
	);
};