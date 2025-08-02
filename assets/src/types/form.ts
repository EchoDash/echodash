/**
 * Form Type Definitions
 * 
 * Defines types for dynamic form generation and validation.
 */

export interface FormField {
	/** Field name/identifier */
	name: string;
	
	/** Field type */
	type: 'text' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'mapping' | 'toggle';
	
	/** Field label */
	label: string;
	
	/** Whether field is required */
	required?: boolean;
	
	/** Help text */
	description?: string;
	
	/** Placeholder text */
	placeholder?: string;
	
	/** Default value */
	defaultValue?: any;
	
	/** Options for select/radio fields */
	options?: FormFieldOption[];
	
	/** Available fields for mapping type */
	availableFields?: MergeTag[];
	
	/** Conditional display logic */
	conditions?: FieldCondition[];
	
	/** Validation rules */
	validation?: FieldValidation;
}

export interface FormFieldOption {
	/** Option value */
	value: string;
	
	/** Option label */
	label: string;
	
	/** Whether option is disabled */
	disabled?: boolean;
}

export interface FieldCondition {
	/** Field to check */
	field: string;
	
	/** Comparison operator */
	operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
	
	/** Value to compare against */
	value: any;
}

export interface FieldValidation {
	/** Minimum length for text fields */
	minLength?: number;
	
	/** Maximum length for text fields */
	maxLength?: number;
	
	/** Regular expression pattern */
	pattern?: string;
	
	/** Custom validation function */
	custom?: (value: any, formData: Record<string, any>) => string | null;
}

export interface FormSchema {
	/** Schema fields */
	fields: FormField[];
	
	/** Form title */
	title?: string;
	
	/** Form description */
	description?: string;
	
	/** Form validation schema */
	validation?: any; // Yup schema or similar
}

export interface FormState<T = Record<string, any>> {
	/** Current form data */
	data: T;
	
	/** Validation errors */
	errors: Record<string, string>;
	
	/** Whether form is being submitted */
	submitting: boolean;
	
	/** Whether form has been modified */
	isDirty: boolean;
	
	/** Whether form is valid */
	isValid: boolean;
}

import { MergeTag } from './api';