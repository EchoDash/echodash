/**
 * useValidation Hook
 * 
 * Custom hook for form validation with real-time error tracking.
 */

import { useState, useCallback } from 'react';
import { ValidationSchema, validateData } from '../utils/validation';

interface UseValidationReturn {
	/** Current form errors */
	errors: Record<string, string>;
	
	/** Validate form data */
	validate: (data: any) => Promise<boolean>;
	
	/** Set errors manually */
	setErrors: (errors: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
	
	/** Clear all errors */
	clearErrors: (field?: string) => void;
	
	/** Check if form has any errors */
	hasErrors: boolean;
	
	/** Get error for specific field */
	getError: (field: string) => string | undefined;
	
	/** Set error for specific field */
	setError: (field: string, error: string) => void;
}

export function useValidation<T extends Record<string, any>>(
	schema: ValidationSchema<T>
): UseValidationReturn {
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validate = useCallback(async (data: T): Promise<boolean> => {
		const result = validateData(data, schema);
		setErrors(result.errors);
		return result.isValid;
	}, [schema]);

	const clearErrors = useCallback((field?: string) => {
		if (field) {
			setErrors(prev => {
				const newErrors = { ...prev };
				delete newErrors[field];
				return newErrors;
			});
		} else {
			setErrors({});
		}
	}, []);

	const setError = useCallback((field: string, error: string) => {
		setErrors(prev => ({ ...prev, [field]: error }));
	}, []);

	const getError = useCallback((field: string) => {
		return errors[field];
	}, [errors]);

	const hasErrors = Object.keys(errors).length > 0;

	return {
		errors,
		validate,
		setErrors,
		clearErrors,
		hasErrors,
		getError,
		setError
	};
}