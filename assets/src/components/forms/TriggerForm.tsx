/**
 * TriggerForm Component
 * 
 * Form component for creating and editing trigger configurations.
 */

import React, { useState, useEffect } from 'react';
import { 
	Card, 
	CardBody, 
	CardHeader,
	TextControl, 
	SelectControl, 
	ToggleControl,
	Button,
	Flex,
	VStack,
	Notice
} from '@wordpress/components';
import { EventMapper } from './EventMapper';
import { Trigger, EventConfig } from '../../types/integration';
import { useFormValidation } from '../../hooks/useValidation';
import { triggerValidationSchema } from '../../utils/validation';

interface TriggerFormProps {
	/** The trigger being edited (undefined for new trigger) */
	trigger?: Trigger;
	
	/** Available option types for event mapping */
	availableFields: { [key: string]: string[] };
	
	/** Called when form is submitted */
	onSubmit: (data: EventConfig) => Promise<void>;
	
	/** Called when form is cancelled */
	onCancel: () => void;
	
	/** Whether the form is in loading state */
	loading?: boolean;
}

interface TriggerFormData extends EventConfig {
	triggerType?: string;
}

export const TriggerForm: React.FC<TriggerFormProps> = ({
	trigger,
	availableFields,
	onSubmit,
	onCancel,
	loading = false
}) => {
	const [formData, setFormData] = useState<TriggerFormData>(() => ({
		name: trigger?.defaultEvent.name || '',
		mappings: trigger?.defaultEvent.mappings || [],
		enabled: trigger?.defaultEvent.enabled !== false,
		triggerType: trigger?.id || ''
	}));

	const { validate, errors, setErrors, clearErrors } = useFormValidation(triggerValidationSchema);
	const [submitAttempted, setSubmitAttempted] = useState(false);

	// Reset form when trigger changes
	useEffect(() => {
		if (trigger) {
			setFormData({
				name: trigger.defaultEvent.name,
				mappings: trigger.defaultEvent.mappings,
				enabled: trigger.defaultEvent.enabled !== false,
				triggerType: trigger.id
			});
			clearErrors();
			setSubmitAttempted(false);
		}
	}, [trigger, clearErrors]);

	const handleFieldChange = (field: keyof TriggerFormData, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }));
		
		// Clear error for this field when user starts typing
		if (submitAttempted && errors[field]) {
			clearErrors(field);
		}
	};

	const handleMappingsChange = (mappings: EventConfig['mappings']) => {
		handleFieldChange('mappings', mappings);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitAttempted(true);

		// Validate form data
		const isValid = await validate(formData);
		if (!isValid) {
			return;
		}

		try {
			// Remove triggerType from data before submitting
			const { triggerType, ...eventData } = formData;
			await onSubmit(eventData);
		} catch (error) {
			// Error handling is done by parent component
		}
	};

	const handleCancel = () => {
		// Reset form state
		setFormData({
			name: trigger?.defaultEvent.name || '',
			mappings: trigger?.defaultEvent.mappings || [],
			enabled: trigger?.defaultEvent.enabled !== false,
			triggerType: trigger?.id || ''
		});
		clearErrors();
		setSubmitAttempted(false);
		onCancel();
	};

	const isNewTrigger = !trigger;
	const formTitle = isNewTrigger ? 'Add New Trigger' : `Edit ${trigger?.name} Trigger`;

	return (
		<Card className="ecd-trigger-form">
			<CardHeader>
				<h2>{formTitle}</h2>
				{trigger?.description && (
					<p className="ecd-trigger-description">{trigger.description}</p>
				)}
			</CardHeader>
			
			<CardBody>
				<form onSubmit={handleSubmit} className="ecd-trigger-form-content">
					<VStack spacing="4">
						{/* Event Name */}
						<TextControl
							label="Event Name"
							value={formData.name}
							onChange={(name) => handleFieldChange('name', name)}
							error={errors.name}
							required
							help="A descriptive name for this event"
							placeholder="e.g., Order Completed, Contact Form Submitted"
							disabled={loading}
						/>

						{/* Trigger Type (for new triggers) */}
						{isNewTrigger && (
							<SelectControl
								label="Trigger Type"
								value={formData.triggerType}
								options={[
									{ value: '', label: 'Select a trigger...' },
									...Object.keys(availableFields).map(key => ({
										value: key,
										label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
									}))
								]}
								onChange={(triggerType) => handleFieldChange('triggerType', triggerType)}
								error={errors.triggerType}
								required
								help="Choose what WordPress action should trigger this event"
								disabled={loading}
							/>
						)}

						{/* Event Enabled Toggle */}
						<ToggleControl
							label="Enable this event"
							checked={formData.enabled}
							onChange={(enabled) => handleFieldChange('enabled', enabled)}
							help={formData.enabled ? 
								'This event will be sent to EchoDash when triggered' : 
								'This event is disabled and will not be sent'
							}
							disabled={loading}
						/>

						{/* Event Mappings */}
						{formData.triggerType && (
							<div className="ecd-event-mappings-section">
								<EventMapper
									mappings={formData.mappings}
									onChange={handleMappingsChange}
									availableFields={availableFields[formData.triggerType] || []}
									error={errors.mappings}
									disabled={loading}
								/>
							</div>
						)}

						{/* Form Actions */}
						<Flex justify="flex-end" gap="2" className="ecd-form-actions">
							<Button 
								variant="tertiary" 
								onClick={handleCancel}
								disabled={loading}
							>
								Cancel
							</Button>
							<Button 
								variant="primary" 
								type="submit"
								isBusy={loading}
								disabled={loading}
							>
								{loading ? 'Saving...' : (isNewTrigger ? 'Add Trigger' : 'Save Changes')}
							</Button>
						</Flex>

						{/* Form Errors */}
						{submitAttempted && Object.keys(errors).length > 0 && (
							<Notice status="error" isDismissible={false}>
								<strong>Please fix the following errors:</strong>
								<ul>
									{Object.entries(errors).map(([field, error]) => (
										<li key={field}>{error}</li>
									))}
								</ul>
							</Notice>
						)}
					</VStack>
				</form>
			</CardBody>
		</Card>
	);
};