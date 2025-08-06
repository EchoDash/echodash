/**
 * EchoDash Main App Component
 * 
 * Simple React app for EchoDash settings matching mockups
 */

import React, { useState, useEffect } from 'react';
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
				iconBackgroundColor: string;
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
	const [integrations, setIntegrations] = useState(window.ecdReactData?.integrations || []);

	const data = window.ecdReactData || {
		settings: {},
		integrations: [],
		triggers: {},
		nonce: '',
		apiUrl: '',
		i18n: {}
	};

	// Update URL when navigation changes
	useEffect(() => {
		if (currentView === 'list') {
			window.history.pushState({}, '', window.location.pathname + window.location.search);
		} else if (currentView === 'detail' && selectedIntegration) {
			const url = new URL(window.location.href);
			url.hash = `/integration/${selectedIntegration}`;
			window.history.pushState({}, '', url.toString());
		}
	}, [currentView, selectedIntegration]);

	// Handle browser back/forward buttons
	useEffect(() => {
		const handlePopState = () => {
			const hash = window.location.hash;
			if (hash.startsWith('#/integration/')) {
				const slug = hash.replace('#/integration/', '');
				setSelectedIntegration(slug);
				setCurrentView('detail');
			} else {
				setCurrentView('list');
				setSelectedIntegration(null);
			}
		};

		window.addEventListener('popstate', handlePopState);
		
		// Check initial URL
		handlePopState();

		return () => window.removeEventListener('popstate', handlePopState);
	}, []);

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
		try {
			const response = await fetch(`${data.apiUrl}integrations/${selectedIntegration}/triggers`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': data.nonce,
				},
				body: JSON.stringify({
					trigger: triggerData.trigger,
					name: triggerData.name,
					mappings: triggerData.mappings,
					send_test: triggerData.sendTest
				}),
			});

			if (response.ok) {
				const result = await response.json();
				
				// Update local state with new trigger
				if (selectedIntegration) {
					const integrationTriggers = triggers[selectedIntegration] || [];
					integrationTriggers.push({
						id: result.id || Date.now().toString(),
						name: triggerData.name,
						trigger: triggerData.trigger,
						enabled: true
					});
					setTriggers({
						...triggers,
						[selectedIntegration]: integrationTriggers
					});

					// Update integration trigger count
					setIntegrations(prev => prev.map(integration => {
						if (integration.slug === selectedIntegration) {
							return {
								...integration,
								triggerCount: integration.triggerCount + 1,
								enabled: true
							};
						}
						return integration;
					}));
				}
				
				setShowTriggerModal(false);
			} else {
				const errorData = await response.json();
				console.error('Failed to save trigger:', errorData);
				alert('Failed to save trigger. Please try again.');
			}
		} catch (error) {
			console.error('Error saving trigger:', error);
			alert('Error saving trigger. Please check your connection and try again.');
		}
	};

	const selectedIntegrationData = integrations.find(i => i.slug === selectedIntegration);

	return (
		<div className="wrap">
			{currentView === 'list' ? (
				<IntegrationList
					integrations={integrations}
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