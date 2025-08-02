/**
 * Dynamic Form Component
 * 
 * Renders forms based on schema definitions with conditional logic,
 * validation, and field grouping.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
	Card,
	CardBody,
	CardHeader,
	VStack,
	HStack,
	Button,
	Flex,
	Text,
	Notice,
	Spinner
} from '@wordpress/components';
import clsx from 'clsx';

import { 
	DynamicFormProps, 
	FormField, 
	FormState,
	FormValidationResult 
} from '../../types/form';
import { FormFieldRenderer } from './FormFieldRenderer';
import { FormGroup } from './FormGroup';
import { evaluateConditions, getVisibleFields, hasConditionalDependencies } from '../../utils/form-conditions';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useAccessibility } from '../../hooks/useAccessibility';

export const DynamicForm: React.FC<DynamicFormProps> = ({
	schema,
	initialData = {},
	onSubmit,
	onCancel,
	onChange,
	loading = false,
	className,
	showErrors = true,
	layout = 'vertical'
}) => {
	const { announceToScreenReader } = useAccessibility();
	
	// Form state
	const [formData, setFormData] = useState<Record<string, any>>(() => {
		const initialFormData: Record<string, any> = {};
		
		// Set initial values from schema defaults
		schema.fields.forEach(field => {
			if (field.defaultValue !== undefined) {
				initialFormData[field.name] = field.defaultValue;
			}
		});
		
		// Override with provided initial data
		return { ...initialFormData, ...initialData };
	});
	
	const [touched, setTouched] = useState<Record<string, boolean>>({});
	const [submitting, setSubmitting] = useState(false);
	const [submitAttempted, setSubmitAttempted] = useState(false);
	
	// Form validation
	const { validate, errors, clearErrors } = useFormValidation();
	
	// Get visible fields based on current form state
	const visibleFields = useMemo(() => {
		return getVisibleFields(schema.fields, formData);
	}, [schema.fields, formData]);
	
	// Group fields if they have group property
	const groupedFields = useMemo(() => {
		const groups: Record<string, FormField[]> = {};
		const ungroupedFields: FormField[] = [];
		
		visibleFields.forEach(field => {
			if (field.group) {
				if (!groups[field.group]) {
					groups[field.group] = [];
				}
				groups[field.group].push(field);
			} else {
				ungroupedFields.push(field);
			}
		});
		
		return { groups, ungroupedFields };
	}, [visibleFields]);
	
	// Form validation state
	const isValid = useMemo(() => {
		return Object.keys(errors).length === 0;
	}, [errors]);
	
	const isDirty = useMemo(() => {
		return Object.keys(touched).length > 0;
	}, [touched]);
	
	// Handle field changes
	const handleFieldChange = useCallback((fieldName: string, value: any) => {
		const newFormData = { ...formData, [fieldName]: value };
		setFormData(newFormData);
		
		// Mark field as touched
		setTouched(prev => ({ ...prev, [fieldName]: true }));
		
		// Clear validation errors for this field
		clearErrors(fieldName);
		
		// Validate field immediately if form has been submitted
		if (submitAttempted && showErrors) {
			const field = schema.fields.find(f => f.name === fieldName);
			if (field) {
				validateField(field, value, newFormData);
			}
		}
		
		// Notify parent of change
		onChange?.(newFormData, fieldName);
		
		// Announce changes that affect field visibility
		if (hasConditionalDependencies(fieldName, schema.fields)) {
			const previousVisibleCount = visibleFields.length;
			const newVisibleFields = getVisibleFields(schema.fields, newFormData);
			
			if (newVisibleFields.length !== previousVisibleCount) {
				const difference = newVisibleFields.length - previousVisibleCount;
				const message = difference > 0 
					? `${Math.abs(difference)} additional field${Math.abs(difference) > 1 ? 's' : ''} now visible`
					: `${Math.abs(difference)} field${Math.abs(difference) > 1 ? 's' : ''} now hidden`;
				
				announceToScreenReader(message, 'polite');
			}
		}
	}, [formData, submitAttempted, showErrors, schema.fields, visibleFields.length, onChange, clearErrors, announceToScreenReader]);
	
	// Validate individual field
	const validateField = useCallback((field: FormField, value: any, currentFormData: Record<string, any>) => {
		const fieldErrors: string[] = [];
		
		// Check required
		if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
			fieldErrors.push(`${field.label} is required`);
		}
		
		// Validate based on field type and validation rules
		if (value && field.validation) {
			const validation = field.validation;
			
			// Length validation for text fields
			if (validation.minLength && typeof value === 'string' && value.length < validation.minLength) {
				fieldErrors.push(`${field.label} must be at least ${validation.minLength} characters`);
			}
			
			if (validation.maxLength && typeof value === 'string' && value.length > validation.maxLength) {
				fieldErrors.push(`${field.label} must be no more than ${validation.maxLength} characters`);
			}
			
			// Pattern validation
			if (validation.pattern && typeof value === 'string') {
				const regex = new RegExp(validation.pattern);
				if (!regex.test(value)) {
					fieldErrors.push(`${field.label} format is invalid`);
				}
			}
			
			// Custom validation
			if (validation.custom) {
				const customError = validation.custom(value, currentFormData);
				if (customError) {
					fieldErrors.push(customError);
				}
			}
		}
		
		// Type-specific validation
		if (value) {
			switch (field.type) {
				case 'email':
					const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
					if (!emailRegex.test(value)) {
						fieldErrors.push(`${field.label} must be a valid email address`);
					}
					break;
					
				case 'url':
					try {
						new URL(value);
					} catch {
						fieldErrors.push(`${field.label} must be a valid URL`);
					}
					break;
					
				case 'number':
					if (isNaN(Number(value))) {
						fieldErrors.push(`${field.label} must be a number`);
					}
					break;
			}
		}
		
		return fieldErrors;
	}, []);
	
	// Validate entire form
	const validateForm = useCallback((): FormValidationResult => {
		const formErrors: Record<string, string[]> = {};
		const formLevelErrors: string[] = [];
		
		visibleFields.forEach(field => {
			const fieldErrors = validateField(field, formData[field.name], formData);
			if (fieldErrors.length > 0) {
				formErrors[field.name] = fieldErrors;
			}
		});
		
		return {
			valid: Object.keys(formErrors).length === 0,
			errors: formErrors,
			formErrors: formLevelErrors
		};
	}, [visibleFields, formData, validateField]);
	
	// Handle form submission
	const handleSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault();
		
		setSubmitAttempted(true);
		setSubmitting(true);
		
		try {
			// Validate form
			const validationResult = validateForm();
			
			if (!validationResult.valid) {
				// Set validation errors
				Object.entries(validationResult.errors).forEach(([field, fieldErrors]) => {
					fieldErrors.forEach(error => {
						validate(field, error);
					});
				});
				
				announceToScreenReader(
					`Form has ${Object.keys(validationResult.errors).length} validation errors`,
					'assertive'
				);
				
				return;
			}
			
			// Submit form
			await onSubmit(formData);
			
			announceToScreenReader('Form submitted successfully', 'polite');
			
		} catch (error) {
			console.error('Form submission error:', error);
			announceToScreenReader('Form submission failed', 'assertive');
		} finally {
			setSubmitting(false);
		}
	}, [formData, validateForm, validate, onSubmit, announceToScreenReader]);
	
	// Handle form reset/cancel
	const handleCancel = useCallback(() => {
		setFormData(initialData);
		setTouched({});
		setSubmitAttempted(false);
		clearErrors();
		onCancel?.();
	}, [initialData, onCancel, clearErrors]);
	
	// Update form data when initialData changes
	useEffect(() => {
		if (initialData && Object.keys(initialData).length > 0) {
			setFormData(prevData => ({ ...prevData, ...initialData }));
		}
	}, [initialData]);
	
	return (
		<Card className={clsx('ecd-dynamic-form', className)} isElevated>
			{schema.title && (
				<CardHeader>
					<Text size="20" weight="600">{schema.title}</Text>
					{schema.description && (
						<Text variant="muted" className="form-description">
							{schema.description}
						</Text>
					)}
				</CardHeader>
			)}
			
			<CardBody>
				<form onSubmit={handleSubmit} className={clsx('ecd-form', `ecd-form--${layout}`)}>
					<VStack spacing="6">
						{/* Ungrouped fields */}
						{groupedFields.ungroupedFields.length > 0 && (
							<VStack spacing="4">
								{groupedFields.ungroupedFields.map(field => (
									<FormFieldRenderer
										key={field.name}
										field={field}
										value={formData[field.name]}
										onChange={(value) => handleFieldChange(field.name, value)}
										errors={showErrors ? errors[field.name] : undefined}
										touched={touched[field.name]}
										disabled={loading || submitting}
										formData={formData}
									/>
								))}
							</VStack>
						)}
						
						{/* Grouped fields */}
						{Object.entries(groupedFields.groups).map(([groupName, groupFields]) => (
							<FormGroup
								key={groupName}
								title={groupName}
								fields={groupFields}
								formData={formData}
								onFieldChange={handleFieldChange}
								errors={showErrors ? errors : {}}
								touched={touched}
								layout={layout}
							/>
						))}
						
						{/* Form actions */}
						<Flex justify="flex-end" gap="3" className="form-actions">
							{onCancel && (
								<Button 
									variant="tertiary" 
									onClick={handleCancel}
									disabled={submitting}
								>
									Cancel
								</Button>
							)}
							<Button 
								variant="primary" 
								type="submit"
								disabled={loading || submitting}
								className="form-submit"
							>
								{submitting && <Spinner />}
								{submitting ? 'Saving...' : 'Save Configuration'}
							</Button>
						</Flex>
					</VStack>
				</form>
				
				{/* Form-level errors */}
				{showErrors && submitAttempted && Object.keys(errors).length > 0 && (
					<Notice 
						status="error" 
						isDismissible={false}
						className="form-errors"
					>
						<Text weight="600">Please correct the following errors:</Text>
						<ul>
							{Object.entries(errors).map(([field, fieldErrors]) => {
								const fieldLabel = schema.fields.find(f => f.name === field)?.label || field;
								return fieldErrors.map((error, index) => (
									<li key={`${field}-${index}`}>{fieldLabel}: {error}</li>
								));
							})}
						</ul>
					</Notice>
				)}
			</CardBody>
		</Card>
	);
};