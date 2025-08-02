/**
 * Main App Component
 * 
 * Root component for the EchoDash React admin interface.
 */

import React from 'react';
import { AppProvider } from './providers/AppProvider';
import { IntegrationDashboard } from './integration/IntegrationDashboard';
import { NotificationSystem } from './common/NotificationSystem';

export const App: React.FC = () => {
	return (
		<AppProvider>
			<div className="echodash-react-app">
				<NotificationSystem />
				<IntegrationDashboard />
			</div>
		</AppProvider>
	);
};