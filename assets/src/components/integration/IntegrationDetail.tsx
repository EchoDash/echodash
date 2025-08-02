/**
 * Integration Detail Component
 * 
 * Shows triggers for a specific integration
 */

import React, { useState } from 'react';
import { Button } from '@wordpress/components';
import { useAppContext } from '../providers/AppProvider';
import { SortableTriggerList } from '../triggers/SortableTriggerList';
// import { TriggerEditModal } from '../modals/TriggerEditModal';
import { SimpleTriggerModal } from '../modals/SimpleTriggerModal';
import { useIntegrations } from '../../hooks/useIntegrations';

interface IntegrationDetailProps {
	integrationSlug: string;
	onBack: () => void;
}

export const IntegrationDetail: React.FC<IntegrationDetailProps> = ({
	integrationSlug,
	onBack
}) => {
	const { state } = useAppContext();
	const { createTrigger, fetchTriggers } = useIntegrations();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedTrigger, setSelectedTrigger] = useState<any>(null);
	const [isSaving, setIsSaving] = useState(false);
	
	const integration = state.integrations.find(i => i.slug === integrationSlug);
	const triggers = state.triggers[integrationSlug] || [];

	if (!integration) {
		return (
			<div className="echodash-error">
				<p>Integration not found.</p>
				<Button onClick={onBack}>Back to integrations</Button>
			</div>
		);
	}

	const handleAddTrigger = () => {
		setSelectedTrigger(null);
		setIsModalOpen(true);
	};

	const handleEditTrigger = (trigger: any) => {
		setSelectedTrigger(trigger);
		setIsModalOpen(true);
	};

	const handleSaveTrigger = async (triggerData: any) => {
		console.log('Saving trigger:', triggerData);
		setIsSaving(true);
		
		try {
			// Create the trigger via API
			await createTrigger(integrationSlug, {
				id: triggerData.id,
				name: triggerData.name,
				description: triggerData.description || '',
				enabled: triggerData.enabled,
				mappings: triggerData.mappings || {},
			});
			
			// Refresh triggers to show the new one
			const updatedTriggers = await fetchTriggers(integrationSlug);
			
			// Update local state - assuming we have a dispatch action for this
			// For now, just close the modal
			setIsModalOpen(false);
			
		} catch (error) {
			console.error('Failed to save trigger:', error);
			// In a real app, we'd show an error notification
		} finally {
			setIsSaving(false);
		}
	};

	// Generate form schema based on available triggers
	const generateFormSchema = () => {
		const availableTriggers = (integration as any).availableTriggers || [];
		
		return {
			title: selectedTrigger ? 'Edit Trigger' : 'Add New Trigger',
			fields: [
				{
					id: 'trigger_type',
					label: 'Trigger Type',
					type: 'select' as const,
					required: true,
					options: availableTriggers.map((trigger: any) => ({
						value: trigger.id,
						label: trigger.name
					})),
					description: 'Select the type of trigger to create'
				},
				{
					id: 'name',
					label: 'Trigger Name',
					type: 'text' as const,
					required: true,
					placeholder: 'Enter a name for this trigger'
				},
				{
					id: 'enabled',
					label: 'Enabled',
					type: 'toggle' as const,
					description: 'Enable or disable this trigger'
				}
			]
		};
	};

	return (
		<div className="echodash-integration-detail">
			<div className="echodash-detail-header">
				<Button 
					variant="link" 
					onClick={onBack}
					style={{ marginBottom: '20px' }}
				>
					← Back to integrations
				</Button>
				
				<div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
					{integration.icon && (
						<img 
							src={integration.icon} 
							alt={`${integration.name} icon`}
							style={{ width: '48px', height: '48px', marginRight: '16px' }}
						/>
					)}
					<div>
						<h1 className="echodash-title" style={{ margin: 0 }}>
							{integration.name} Triggers
						</h1>
						<p style={{ margin: 0, color: '#646970' }}>
							{integration.description || 'Configure triggers for this integration'}
						</p>
					</div>
				</div>
			</div>

			<div className="echodash-triggers-section">
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
					<h2>Active Triggers ({triggers.length})</h2>
					<Button variant="primary" onClick={handleAddTrigger}>
						Add Trigger
					</Button>
				</div>

				{triggers.length === 0 ? (
					<div style={{ 
						backgroundColor: '#f6f7f7', 
						border: '1px solid #dcdcde',
						borderRadius: '8px',
						padding: '40px',
						textAlign: 'center'
					}}>
						<p style={{ fontSize: '16px', marginBottom: '20px' }}>
							No triggers configured for {integration.name} yet.
						</p>
						<Button variant="primary" onClick={handleAddTrigger}>
							Add Your First Trigger
						</Button>
					</div>
				) : (
					<SortableTriggerList
						triggers={triggers}
						integrationSlug={integrationSlug}
					/>
				)}
			</div>

			{isModalOpen && (
				<SimpleTriggerModal
					isOpen={isModalOpen}
					onClose={() => setIsModalOpen(false)}
					onSave={handleSaveTrigger}
					availableTriggers={(integration as any).availableTriggers || []}
				/>
			)}
		</div>
	);
};