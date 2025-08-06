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
				connectUrl?: string;
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
				singleItemTriggers?: Array<{
					trigger: string;
					name: string;
					description?: string;
					items: Array<{
						post_id: number;
						post_title: string;
						edit_url: string;
						event_name: string;
						mappings: any;
					}>;
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
	const [editingTrigger, setEditingTrigger] = useState<any | null>(null);
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

	// Handle EchoDash callback on page load
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const endpointUrl = urlParams.get('endpoint_url');
		const wpnonce = urlParams.get('wpnonce');

		// If we have callback parameters, the user just returned from EchoDash
		if (endpointUrl && wpnonce) {
			// The backend should have already processed this via save_echodash_callback()
			// Just need to refresh the page data or reload to show the new state
			window.location.reload();
		}
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
		setEditingTrigger(null); // Clear any editing state
		setShowTriggerModal(true);
	};

	const handleAddTriggerFromList = (slug: string) => {
		setSelectedIntegration(slug);
		setCurrentView('detail');
		// Small delay to ensure the view has changed before opening modal
		setTimeout(() => {
			setEditingTrigger(null);
			setShowTriggerModal(true);
		}, 50);
	};

	const handleEditTrigger = (trigger: any) => {
		setEditingTrigger(trigger);
		setShowTriggerModal(true);
	};

	const handleDeleteTrigger = async (trigger: any) => {
		try {
			const url = `${data.apiUrl}integrations/${selectedIntegration}/triggers/${trigger.id}`;
			
			const response = await fetch(url, {
				method: 'DELETE',
				headers: {
					'X-WP-Nonce': data.nonce,
				},
			});

			if (response.ok) {
				// Update local state - remove the deleted trigger
				if (selectedIntegration) {
					const integrationTriggers = triggers[selectedIntegration] || [];
					const updatedTriggers = integrationTriggers.filter(t => t.id !== trigger.id);
					
					setTriggers({
						...triggers,
						[selectedIntegration]: updatedTriggers
					});

					// Update integration trigger count
					setIntegrations(prev => prev.map(integration => {
						if (integration.slug === selectedIntegration) {
							return {
								...integration,
								triggerCount: Math.max(0, integration.triggerCount - 1),
							};
						}
						return integration;
					}));
				}
			} else {
				const errorData = await response.json();
				console.error('Failed to delete trigger:', errorData);
				alert('Failed to delete trigger. Please try again.');
			}
		} catch (error) {
			console.error('Error deleting trigger:', error);
			alert('Error deleting trigger. Please check your connection and try again.');
		}
	};

	const handleSaveTrigger = async (triggerData: any) => {
		try {
			const isEditing = editingTrigger !== null;
			const url = isEditing
				? `${data.apiUrl}integrations/${selectedIntegration}/triggers/${editingTrigger.id}`
				: `${data.apiUrl}integrations/${selectedIntegration}/triggers`;
			
			const response = await fetch(url, {
				method: isEditing ? 'PUT' : 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': data.nonce,
				},
				body: JSON.stringify({
					trigger: triggerData.trigger,
					name: triggerData.name,
					event_name: triggerData.name,
					mappings: triggerData.mappings,
					send_test: triggerData.sendTest
				}),
			});

			if (response.ok) {
				const result = await response.json();
				
				// Update local state
				if (selectedIntegration) {
					const integrationTriggers = triggers[selectedIntegration] || [];
					
					// Get the description from the integration's available triggers
					const selectedIntegrationData = integrations.find(i => i.slug === selectedIntegration);
					const availableTrigger = selectedIntegrationData?.availableTriggers?.find(
						t => t.id === triggerData.trigger
					);
					const triggerDescription = availableTrigger?.description || '';
					
					if (isEditing) {
						// Update existing trigger
						const updatedTriggers = integrationTriggers.map(t => 
							t.id === editingTrigger.id 
								? {
									...t,
									id: result.id || editingTrigger.id,
									name: triggerData.name,
									trigger: triggerData.trigger,
									event_name: triggerData.name,
									mappings: triggerData.mappings,
									description: triggerDescription,
									enabled: true
								}
								: t
						);
						setTriggers({
							...triggers,
							[selectedIntegration]: updatedTriggers
						});
					} else {
						// Add new trigger
						integrationTriggers.push({
							id: result.id || Date.now().toString(),
							name: triggerData.name,
							trigger: triggerData.trigger,
							event_name: triggerData.name,
							mappings: triggerData.mappings,
							description: triggerDescription,
							enabled: true
						});
						setTriggers({
							...triggers,
							[selectedIntegration]: integrationTriggers
						});

						// Update integration trigger count for new triggers only
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
				}
				
				setShowTriggerModal(false);
				setEditingTrigger(null);
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
					onAddTrigger={handleAddTriggerFromList}
				/>
			) : (
				selectedIntegrationData && (
					<IntegrationDetail
						integration={selectedIntegrationData}
						triggers={triggers[selectedIntegration!] || []}
						onBack={handleBackToList}
						onAddTrigger={handleAddTrigger}
						onEditTrigger={handleEditTrigger}
						onDeleteTrigger={handleDeleteTrigger}
					/>
				)
			)}

			{showTriggerModal && selectedIntegrationData && (
				<TriggerModal
					isOpen={showTriggerModal}
					onClose={() => {
						setShowTriggerModal(false);
						setEditingTrigger(null);
					}}
					onSave={handleSaveTrigger}
					integration={selectedIntegrationData}
					editingTrigger={editingTrigger}
				/>
			)}
		</div>
	);
};