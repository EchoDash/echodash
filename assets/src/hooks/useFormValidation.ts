/**
 * useFormValidation Hook
 * 
 * Provides form validation functionality with field-level error management.
 */

import { useState, useCallback } from 'react';

interface ValidationErrors {
	[fieldName: string]: string[];
}

interface UseFormValidationReturn {
	/** Current validation errors */
	errors: ValidationErrors;
	
	/** Validate a field and set error */
	validate: (fieldName: string, error: string) => void;
	
	/** Clear errors for a specific field */
	clearErrors: (fieldName?: string) => void;
	
	/** Check if form has any errors */
	hasErrors: boolean;
	
	/** Get errors for a specific field */
	getFieldErrors: (fieldName: string) => string[];
	
	/** Set multiple errors at once */
	setErrors: (errors: ValidationErrors) => void;
	
	/** Validate field value and return errors */
	validateField: (fieldName: string, value: any, rules?: ValidationRule[]) => string[];
}

interface ValidationRule {
	type: 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'email' | 'url' | 'custom';
	value?: any;
	message: string;
	validator?: (value: any) => boolean;
}

export const useFormValidation = (): UseFormValidationReturn => {
	const [errors, setErrorsState] = useState<ValidationErrors>({});

	const validate = useCallback((fieldName: string, error: string) => {
		setErrorsState(prev => ({
			...prev,
			[fieldName]: [...(prev[fieldName] || []), error]
		}));
	}, []);

	const clearErrors = useCallback((fieldName?: string) => {
		if (fieldName) {
			setErrorsState(prev => {
				const newErrors = { ...prev };
				delete newErrors[fieldName];
				return newErrors;
			});
		} else {
			setErrorsState({});
		}
	}, []);

	const hasErrors = Object.keys(errors).length > 0;

	const getFieldErrors = useCallback((fieldName: string): string[] => {
		return errors[fieldName] || [];
	}, [errors]);

	const setErrors = useCallback((newErrors: ValidationErrors) => {
		setErrorsState(newErrors);
	}, []);

	const validateField = useCallback((
		fieldName: string, 
		value: any, 
		rules: ValidationRule[] = []
	): string[] => {
		const fieldErrors: string[] = [];

		for (const rule of rules) {
			switch (rule.type) {
				case 'required':
					if (!value || (Array.isArray(value) && value.length === 0) || 
						(typeof value === 'string' && value.trim() === '')) {
						fieldErrors.push(rule.message);
					}
					break;

				case 'minLength':
					if (typeof value === 'string' && value.length < rule.value) {
						fieldErrors.push(rule.message);
					}
					break;

				case 'maxLength':
					if (typeof value === 'string' && value.length > rule.value) {
						fieldErrors.push(rule.message);
					}
					break;

				case 'min':
					if (typeof value === 'number' && value < rule.value) {
						fieldErrors.push(rule.message);
					}
					break;

				case 'max':
					if (typeof value === 'number' && value > rule.value) {
						fieldErrors.push(rule.message);
					}
					break;

				case 'pattern':
					if (typeof value === 'string' && rule.value) {
						const regex = new RegExp(rule.value);
						if (!regex.test(value)) {
							fieldErrors.push(rule.message);
						}
					}
					break;

				case 'email':
					if (typeof value === 'string') {
						const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
						if (!emailRegex.test(value)) {
							fieldErrors.push(rule.message);
						}
					}
					break;

				case 'url':
					if (typeof value === 'string') {
						try {
							new URL(value);
						} catch {
							fieldErrors.push(rule.message);
						}
					}
					break;

				case 'custom':
					if (rule.validator && !rule.validator(value)) {
						fieldErrors.push(rule.message);
					}
					break;
			}
		}

		return fieldErrors;
	}, []);

	return {
		errors,
		validate,
		clearErrors,
		hasErrors,
		getFieldErrors,
		setErrors,
		validateField
	};
};

/**
 * Pre-defined validation rule generators
 */
export const validationRules = {
	required: (message = 'This field is required'): ValidationRule => ({
		type: 'required',
		message
	}),

	minLength: (length: number, message?: string): ValidationRule => ({
		type: 'minLength',
		value: length,
		message: message || `Must be at least ${length} characters`
	}),

	maxLength: (length: number, message?: string): ValidationRule => ({
		type: 'maxLength',
		value: length,
		message: message || `Must be no more than ${length} characters`
	}),

	email: (message = 'Must be a valid email address'): ValidationRule => ({
		type: 'email',
		message
	}),

	url: (message = 'Must be a valid URL'): ValidationRule => ({
		type: 'url',
		message
	}),

	pattern: (pattern: string, message = 'Invalid format'): ValidationRule => ({
		type: 'pattern',
		value: pattern,
		message
	}),

	custom: (validator: (value: any) => boolean, message: string): ValidationRule => ({
		type: 'custom',
		validator,
		message
	})
};