/**
 * Form Type Definitions
 * 
 * Defines types for dynamic form generation and validation.
 */

export interface FormField {
	/** Field name/identifier */
	name: string;
	
	/** Field type */
	type: 'text' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'mapping' | 'toggle' | 'multiselect' | 'number' | 'email' | 'url' | 'conditional';
	
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
	
	/** Field width (1-12 for grid system) */
	width?: number;
	
	/** Group fields together */
	group?: string;
	
	/** CSS class names */
	className?: string;
	
	/** Field-specific props */
	props?: Record<string, any>;
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
	operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
	
	/** Value to compare against */
	value?: any;
	
	/** Logical operator for multiple conditions */
	logic?: 'and' | 'or';
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
	/** Schema identifier */
	id: string;
	
	/** Schema fields */
	fields: FormField[];
	
	/** Form title */
	title?: string;
	
	/** Form description */
	description?: string;
	
	/** Form validation schema */
	validation?: any; // Yup schema or similar
	
	/** Form submission handler */
	onSubmit?: (data: Record<string, any>) => Promise<void>;
	
	/** Form cancellation handler */
	onCancel?: () => void;
	
	/** Form change handler */
	onChange?: (data: Record<string, any>, field: string) => void;
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

export interface DynamicFormProps {
	/** Form schema */
	schema: FormSchema;
	
	/** Initial form data */
	initialData?: Record<string, any>;
	
	/** Form submission handler */
	onSubmit: (data: Record<string, any>) => Promise<void>;
	
	/** Form cancellation handler */
	onCancel?: () => void;
	
	/** Form change handler */
	onChange?: (data: Record<string, any>, field: string) => void;
	
	/** Loading state */
	loading?: boolean;
	
	/** CSS class name */
	className?: string;
	
	/** Show validation errors */
	showErrors?: boolean;
	
	/** Form layout */
	layout?: 'vertical' | 'horizontal' | 'grid';
}

export interface FormFieldProps {
	/** Field definition */
	field: FormField;
	
	/** Current field value */
	value: any;
	
	/** Field change handler */
	onChange: (value: any) => void;
	
	/** Field errors */
	errors?: string[];
	
	/** Field touched state */
	touched?: boolean;
	
	/** Field disabled state */
	disabled?: boolean;
	
	/** Form-wide data (for conditional logic) */
	formData?: Record<string, any>;
}

export interface FormValidationResult {
	/** Whether form is valid */
	valid: boolean;
	
	/** Field-level errors */
	errors: Record<string, string[]>;
	
	/** Form-level errors */
	formErrors: string[];
}

export interface FormGroupProps {
	/** Group title */
	title?: string;
	
	/** Group description */
	description?: string;
	
	/** Group fields */
	fields: FormField[];
	
	/** Form data */
	formData: Record<string, any>;
	
	/** Field change handler */
	onFieldChange: (fieldName: string, value: any) => void;
	
	/** Field errors */
	errors: Record<string, string[]>;
	
	/** Field touched states */
	touched: Record<string, boolean>;
	
	/** Layout type */
	layout?: 'vertical' | 'horizontal' | 'grid';
}