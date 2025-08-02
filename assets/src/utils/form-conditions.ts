/**
 * Form Conditions Utilities
 * 
 * Handles conditional field logic for dynamic forms.
 */

import { FieldCondition } from '../types/form';

/**
 * Evaluate multiple conditions with logical operators
 */
export const evaluateConditions = (
	conditions: FieldCondition[],
	formData: Record<string, any>
): boolean => {
	if (!conditions || conditions.length === 0) {
		return true;
	}

	let result = evaluateCondition(conditions[0], formData);

	for (let i = 1; i < conditions.length; i++) {
		const condition = conditions[i];
		const conditionResult = evaluateCondition(condition, formData);
		
		if (condition.logic === 'or') {
			result = result || conditionResult;
		} else {
			// Default to 'and'
			result = result && conditionResult;
		}
	}

	return result;
};

/**
 * Evaluate a single condition
 */
export const evaluateCondition = (
	condition: FieldCondition,
	formData: Record<string, any>
): boolean => {
	const fieldValue = formData[condition.field];

	switch (condition.operator) {
		case 'equals':
			return fieldValue === condition.value;
			
		case 'not_equals':
			return fieldValue !== condition.value;
			
		case 'contains':
			if (Array.isArray(fieldValue)) {
				return fieldValue.includes(condition.value);
			}
			if (typeof fieldValue === 'string') {
				return fieldValue.includes(condition.value);
			}
			return false;
			
		case 'not_contains':
			if (Array.isArray(fieldValue)) {
				return !fieldValue.includes(condition.value);
			}
			if (typeof fieldValue === 'string') {
				return !fieldValue.includes(condition.value);
			}
			return true;
			
		case 'greater_than':
			return Number(fieldValue) > Number(condition.value);
			
		case 'less_than':
			return Number(fieldValue) < Number(condition.value);
			
		case 'is_empty':
			return !fieldValue || 
				   (Array.isArray(fieldValue) && fieldValue.length === 0) ||
				   (typeof fieldValue === 'string' && fieldValue.trim() === '') ||
				   (typeof fieldValue === 'object' && Object.keys(fieldValue).length === 0);
				   
		case 'is_not_empty':
			return !!fieldValue && 
				   !(Array.isArray(fieldValue) && fieldValue.length === 0) &&
				   !(typeof fieldValue === 'string' && fieldValue.trim() === '') &&
				   !(typeof fieldValue === 'object' && Object.keys(fieldValue).length === 0);
				   
		default:
			return true;
	}
};

/**
 * Get fields that should be visible based on current form state
 */
export const getVisibleFields = (
	fields: any[],
	formData: Record<string, any>
): any[] => {
	return fields.filter(field => {
		if (!field.conditions || field.conditions.length === 0) {
			return true;
		}
		return evaluateConditions(field.conditions, formData);
	});
};

/**
 * Check if field value has changed in a way that might affect other fields
 */
export const hasConditionalDependencies = (
	changedField: string,
	allFields: any[]
): boolean => {
	return allFields.some(field => 
		field.conditions?.some((condition: FieldCondition) => 
			condition.field === changedField
		)
	);
};

/**
 * Get all field dependencies for a given field
 */
export const getFieldDependencies = (
	fieldName: string,
	allFields: any[]
): string[] => {
	const field = allFields.find(f => f.name === fieldName);
	if (!field?.conditions) {
		return [];
	}

	return field.conditions.map((condition: FieldCondition) => condition.field);
};

/**
 * Get all fields that depend on a given field
 */
export const getDependentFields = (
	fieldName: string,
	allFields: any[]
): string[] => {
	return allFields
		.filter(field => 
			field.conditions?.some((condition: FieldCondition) => 
				condition.field === fieldName
			)
		)
		.map(field => field.name);
};

/**
 * Validate that conditional logic doesn't create circular dependencies
 */
export const validateConditionalLogic = (fields: any[]): {
	valid: boolean;
	errors: string[];
} => {
	const errors: string[] = [];
	
	for (const field of fields) {
		if (!field.conditions) continue;
		
		// Check for self-reference
		const selfReference = field.conditions.some(
			(condition: FieldCondition) => condition.field === field.name
		);
		
		if (selfReference) {
			errors.push(`Field "${field.name}" cannot reference itself in conditions`);
		}
		
		// Check for circular dependencies (basic check)
		const dependencies = getFieldDependencies(field.name, fields);
		for (const dependency of dependencies) {
			const dependentFields = getDependentFields(dependency, fields);
			if (dependentFields.includes(field.name)) {
				errors.push(`Circular dependency detected between "${field.name}" and "${dependency}"`);
			}
		}
	}
	
	return {
		valid: errors.length === 0,
		errors
	};
};