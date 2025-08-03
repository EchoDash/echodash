/**
 * EchoDash Main App Component
 * 
 * Simple React app for EchoDash settings matching mockups
 */

import React, { useState } from 'react';
import { IntegrationList } from './components/IntegrationList';
import { IntegrationDetail } from './components/IntegrationDetail';
import { TriggerModal } from './components/TriggerModal';

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
				description?: string;
				availableTriggers?: Array<{
					id: string;
					name: string;
					description?: string;
					defaultEvent?: any;
				}>;
			}>;
			triggers: Record<string, any[]>;
			nonce: string;
			apiUrl: string;
			i18n: Record<string, string>;
		};
	}
}

export const App: React.FC = () => {
	const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
	const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
	const [showTriggerModal, setShowTriggerModal] = useState(false);
	const [triggers, setTriggers] = useState<Record<string, any[]>>(window.ecdReactData?.triggers || {});

	const data = window.ecdReactData || {
		settings: {},
		integrations: [],
		triggers: {},
		nonce: '',
		apiUrl: '',
		i18n: {}
	};

	const handleIntegrationClick = (slug: string) => {
		setSelectedIntegration(slug);
		setCurrentView('detail');
	};

	const handleBackToList = () => {
		setCurrentView('list');
		setSelectedIntegration(null);
	};

	const handleAddTrigger = () => {
		setShowTriggerModal(true);
	};

	const handleSaveTrigger = async (triggerData: any) => {
		// TODO: Call API to save trigger
		console.log('Saving trigger:', triggerData);
		
		// For now, just update local state
		if (selectedIntegration) {
			const integrationTriggers = triggers[selectedIntegration] || [];
			integrationTriggers.push(triggerData);
			setTriggers({
				...triggers,
				[selectedIntegration]: integrationTriggers
			});
		}
		
		setShowTriggerModal(false);
	};

	const selectedIntegrationData = data.integrations.find(i => i.slug === selectedIntegration);

	return (
		<div className="wrap">
			{currentView === 'list' ? (
				<IntegrationList
					integrations={data.integrations}
					settings={data.settings}
					onIntegrationClick={handleIntegrationClick}
				/>
			) : (
				selectedIntegrationData && (
					<IntegrationDetail
						integration={selectedIntegrationData}
						triggers={triggers[selectedIntegration!] || []}
						onBack={handleBackToList}
						onAddTrigger={handleAddTrigger}
					/>
				)
			)}

			{showTriggerModal && selectedIntegrationData && (
				<TriggerModal
					isOpen={showTriggerModal}
					onClose={() => setShowTriggerModal(false)}
					onSave={handleSaveTrigger}
					integration={selectedIntegrationData}
				/>
			)}
		</div>
	);
};