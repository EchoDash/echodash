/**
 * Validation Utilities
 * 
 * Form validation schemas and utilities for EchoDash React components.
 */

// Simple validation schema type (avoiding external dependencies)
export interface ValidationSchema<T> {
	[K in keyof T]?: {
		required?: boolean;
		minLength?: number;
		maxLength?: number;
		pattern?: RegExp;
		custom?: (value: any, data: T) => string | null;
	};
}

export interface ValidationResult {
	isValid: boolean;
	errors: Record<string, string>;
}

/**
 * Validate data against a schema
 */
export function validateData<T extends Record<string, any>>(
	data: T,
	schema: ValidationSchema<T>
): ValidationResult {
	const errors: Record<string, string> = {};

	for (const [field, rules] of Object.entries(schema)) {
		const value = data[field];
		const fieldRules = rules as any;

		// Required validation
		if (fieldRules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
			errors[field] = `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
			continue;
		}

		// Skip other validations if field is empty and not required
		if (!value) continue;

		// String validations
		if (typeof value === 'string') {
			if (fieldRules.minLength && value.length < fieldRules.minLength) {
				errors[field] = `${field} must be at least ${fieldRules.minLength} characters`;
				continue;
			}

			if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
				errors[field] = `${field} must be less than ${fieldRules.maxLength} characters`;
				continue;
			}

			if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
				errors[field] = `${field} format is invalid`;
				continue;
			}
		}

		// Array validations
		if (Array.isArray(value)) {
			if (fieldRules.minLength && value.length < fieldRules.minLength) {
				errors[field] = `At least ${fieldRules.minLength} ${field} ${fieldRules.minLength === 1 ? 'is' : 'are'} required`;
				continue;
			}
		}

		// Custom validation
		if (fieldRules.custom) {
			const customError = fieldRules.custom(value, data);
			if (customError) {
				errors[field] = customError;
			}
		}
	}

	return {
		isValid: Object.keys(errors).length === 0,
		errors
	};
}

/**
 * Trigger validation schema
 */
export const triggerValidationSchema: ValidationSchema<any> = {
	name: {
		required: true,
		minLength: 3,
		maxLength: 100,
		pattern: /^[a-zA-Z0-9\s\-_.,()]+$/
	},
	triggerType: {
		required: true
	},
	mappings: {
		required: true,
		minLength: 1,
		custom: (mappings: any[]) => {
			if (!Array.isArray(mappings)) {
				return 'Mappings must be an array';
			}

			// Validate each mapping
			for (let i = 0; i < mappings.length; i++) {
				const mapping = mappings[i];
				
				if (!mapping.key || typeof mapping.key !== 'string' || mapping.key.trim() === '') {
					return `Property key is required for mapping ${i + 1}`;
				}

				if (!mapping.value || typeof mapping.value !== 'string' || mapping.value.trim() === '') {
					return `Property value is required for mapping ${i + 1}`;
				}

				// Check for duplicate keys
				const duplicateIndex = mappings.findIndex((m, idx) => 
					idx !== i && m.key === mapping.key
				);
				if (duplicateIndex !== -1) {
					return `Duplicate property key "${mapping.key}" found`;
				}

				// Validate property key format
				if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(mapping.key)) {
					return `Property key "${mapping.key}" must start with a letter and contain only letters, numbers, and underscores`;
				}
			}

			return null;
		}
	}
};

/**
 * Event configuration validation schema
 */
export const eventConfigValidationSchema: ValidationSchema<any> = {
	name: {
		required: true,
		minLength: 3,
		maxLength: 100
	},
	mappings: {
		required: true,
		minLength: 1
	}
};

/**
 * Integration search validation
 */
export const searchValidationSchema: ValidationSchema<any> = {
	searchTerm: {
		maxLength: 100,
		pattern: /^[a-zA-Z0-9\s\-_.,()]*$/
	}
};

/**
 * Settings validation schema
 */
export const settingsValidationSchema: ValidationSchema<any> = {
	endpoint: {
		required: true,
		pattern: /^https?:\/\/.+/,
		custom: (value: string) => {
			try {
				new URL(value);
				return null;
			} catch {
				return 'Please enter a valid URL';
			}
		}
	}
};

/**
 * Utility functions for common validations
 */
export const validationUtils = {
	/**
	 * Check if a string is a valid merge tag
	 */
	isMergeTag: (value: string): boolean => {
		return /^{[a-zA-Z0-9_:]+}$/.test(value);
	},

	/**
	 * Extract field name from merge tag
	 */
	extractFieldFromMergeTag: (mergeTag: string): string | null => {
		const match = mergeTag.match(/^{([a-zA-Z0-9_:]+)}$/);
		return match ? match[1] : null;
	},

	/**
	 * Validate property key format
	 */
	isValidPropertyKey: (key: string): boolean => {
		return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(key);
	},

	/**
	 * Sanitize property key
	 */
	sanitizePropertyKey: (key: string): string => {
		return key
			.toLowerCase()
			.replace(/[^a-zA-Z0-9_]/g, '_')
			.replace(/^[^a-zA-Z]/, 'prop_')
			.replace(/_+/g, '_')
			.replace(/^_|_$/g, '');
	}
};