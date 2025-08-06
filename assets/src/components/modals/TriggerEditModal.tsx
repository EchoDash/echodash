/**
 * Trigger Edit Modal Component
 * 
 * Modal for editing trigger configurations with form validation.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
	Modal,
	Button,
	Flex,
	Notice,
	Spinner
} from '@wordpress/components';

// Spacer is not needed - we can use CSS for spacing

import { Trigger } from '../triggers/TriggerCard';
import { DynamicForm } from '../forms/DynamicForm';
import { FormSchema } from '../../types/form';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useFocusManagement } from '../../hooks/useAccessibility';

export interface TriggerEditModalProps {
	/** Trigger to edit (null for new trigger) */
	trigger: Trigger | null;
	
	/** Whether modal is open */
	isOpen: boolean;
	
	/** Form schema for trigger configuration */
	schema: FormSchema;
	
	/** Available merge tags */
	availableFields?: any[];
	
	/** Save callback */
	onSave: (triggerData: any) => Promise<void>;
	
	/** Close callback */
	onClose: () => void;
	
	/** Loading state */
	loading?: boolean;
	
	/** Error message */
	error?: string;
}

export const TriggerEditModal: React.FC<TriggerEditModalProps> = ({
	trigger,
	isOpen,
	schema,
	availableFields = [],
	onSave,
	onClose,
	loading = false,
	error
}) => {
	const { announceToScreenReader } = useAccessibility();
	const { saveFocus, restoreFocus, trapFocus } = useFocusManagement();
	
	const [formData, setFormData] = useState<any>({});
	const [saving, setSaving] = useState(false);
	const [validationError, setValidationError] = useState<string>('');

	// Initialize form data when trigger or modal state changes
	useEffect(() => {
		if (isOpen) {
			const initialData = trigger ? {
				...trigger,
				description: trigger.description || '',
				mappings: trigger.mappings || []
			} : {
				name: '',
				description: '',
				enabled: true,
				mappings: []
			};
			
			setFormData(initialData);
			setValidationError('');
			
			// Save focus when modal opens
			saveFocus();
			
			// Announce modal opening
			announceToScreenReader(
				trigger ? `Editing trigger: ${trigger.name}` : 'Creating new trigger',
				'assertive'
			);
		}
	}, [trigger, isOpen, saveFocus, announceToScreenReader]);

	// Handle form submission
	const handleSave = useCallback(async (data: any) => {
		setSaving(true);
		setValidationError('');

		try {

			if (!data.mappings || data.mappings.length === 0) {
				throw new Error('At least one property mapping is required');
			}

			// Validate mappings
			for (const mapping of data.mappings) {
				if (!mapping.key || mapping.key.trim() === '') {
					throw new Error('All property keys must be specified');
				}
				if (!mapping.value || mapping.value.trim() === '') {
					throw new Error('All property values must be specified');
				}
			}

			await onSave(data);
			
			announceToScreenReader(
				trigger ? 'Trigger updated successfully' : 'Trigger created successfully',
				'polite'
			);
			
			handleClose();
			
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to save trigger';
			setValidationError(message);
			announceToScreenReader(`Save failed: ${message}`, 'assertive');
		} finally {
			setSaving(false);
		}
	}, [trigger, onSave, announceToScreenReader]);

	// Handle modal close
	const handleClose = useCallback(() => {
		if (saving) return; // Prevent closing while saving
		
		setFormData({});
		setValidationError('');
		onClose();
		
		// Restore focus
		restoreFocus();
		
		announceToScreenReader('Modal closed', 'polite');
	}, [saving, onClose, restoreFocus, announceToScreenReader]);

	// Handle form data changes
	const handleFormChange = useCallback((newData: any, fieldName: string) => {
		setFormData(newData);
		
		// Clear validation error when user makes changes
		if (validationError) {
			setValidationError('');
		}
	}, [validationError]);

	// Handle escape key
	const handleKeyDown = useCallback((e: KeyboardEvent) => {
		if (e.key === 'Escape' && !saving) {
			handleClose();
		}
	}, [saving, handleClose]);

	// Set up event listeners
	useEffect(() => {
		if (isOpen) {
			document.addEventListener('keydown', handleKeyDown);
			return () => document.removeEventListener('keydown', handleKeyDown);
		}
	}, [isOpen, handleKeyDown]);

	// Enhanced schema with available fields
	const enhancedSchema = {
		...schema,
		fields: schema.fields.map(field => ({
			...field,
			availableFields: field.type === 'mapping' ? availableFields : field.availableFields
		}))
	};

	if (!isOpen) {
		return null;
	}

	return (
		<Modal
			title={trigger ? `Edit Trigger: ${trigger.name}` : 'Create New Trigger'}
			onRequestClose={handleClose}
			className="ecd-trigger-modal"
			isDismissible={!saving}
			shouldCloseOnClickOutside={!saving}
			shouldCloseOnEsc={!saving}
		>
			<div className="ecd-modal-content">
				{/* Global error */}
				{error && (
					<Notice status="error" isDismissible={false}>
						{error}
					</Notice>
				)}

				{/* Validation error */}
				{validationError && (
					<Notice status="error" onRemove={() => setValidationError('')}>
						{validationError}
					</Notice>
				)}

				{/* Loading indicator */}
				{loading && (
					<div className="modal-loading">
						<Flex align="center" justify="center" gap={2}>
							<Spinner style={{ margin: 0 }} />
							<span>Loading trigger data...</span>
						</Flex>
					</div>
				)}

				{/* Form */}
				{!loading && (
					<DynamicForm
						schema={enhancedSchema}
						initialData={formData}
						onSubmit={handleSave}
						onCancel={handleClose}
						onChange={handleFormChange}
						loading={saving}
						showErrors={true}
						layout="vertical"
						className="trigger-edit-form"
					/>
				)}

				{/* Modal actions */}
				<Flex justify="flex-end" gap={3} className="modal-actions" style={{ marginTop: '24px' }}>
					<Button 
						variant="tertiary" 
						onClick={handleClose}
						disabled={saving}
					>
						Cancel
					</Button>
					
					<Button 
						variant="primary" 
						onClick={() => handleSave(formData)}
						disabled={saving || loading}
						className="save-trigger-button"
					>
						{saving && <Spinner style={{ margin: 0, marginRight: '8px' }} />}
						{saving ? 'Saving...' : (trigger ? 'Update Trigger' : 'Create Trigger')}
					</Button>
				</Flex>
			</div>
		</Modal>
	);
};