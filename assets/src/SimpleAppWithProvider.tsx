/**
 * Simple App with Provider Component
 * 
 * Testing the provider integration step by step
 */

import React, { useState } from 'react';
import { AppProvider } from './components/providers/AppProvider';
import { IntegrationDashboard } from './components/integration/IntegrationDashboard';
import { IntegrationDetail } from './components/integration/IntegrationDetail';
import { NotificationSystem } from './components/common/NotificationSystem';

export const SimpleAppWithProvider: React.FC = () => {
	const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
	const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

	const handleIntegrationSelect = (slug: string) => {
		setSelectedIntegration(slug);
		setCurrentView('detail');
	};

	const handleBack = () => {
		setCurrentView('list');
		setSelectedIntegration(null);
	};

	return (
		<AppProvider>
			<div className="echodash-react-app">
				<NotificationSystem />
				{currentView === 'list' ? (
					<IntegrationDashboard onIntegrationSelect={handleIntegrationSelect} />
				) : (
					selectedIntegration && (
						<IntegrationDetail 
							integrationSlug={selectedIntegration}
							onBack={handleBack}
						/>
					)
				)}
			</div>
		</AppProvider>
	);
};