/**
 * Validation Utilities Tests
 * 
 * Comprehensive tests for the validation system including
 * custom validators, schemas, and React hooks.
 */

import { validationSchemas, ValidationUtils, ValidationPatterns } from '../validation';
import { renderHook, act } from '@testing-library/react';
import { useValidation } from '../validation';

describe('ValidationPatterns', () => {
	describe('email pattern', () => {
		it('should match valid email addresses', () => {
			const validEmails = [
				'test@example.com',
				'user.name@domain.co.uk',
				'user+tag@example.org',
				'test123@test-domain.com',
			];
			
			validEmails.forEach(email => {
				expect(ValidationPatterns.email.test(email)).toBe(true);
			});
		});
		
		it('should reject invalid email addresses', () => {
			const invalidEmails = [
				'invalid.email',
				'@domain.com',
				'user@',
				'user name@domain.com',
				'user@domain',
			];
			
			invalidEmails.forEach(email => {
				expect(ValidationPatterns.email.test(email)).toBe(false);
			});
		});
	});
	
	describe('mergeTag pattern', () => {
		it('should match valid merge tags', () => {
			const validTags = [
				'{user:email}',
				'{post:title}',
				'{user:first_name}',
				'{order:total|0}',
				'{user:meta_key|default_value}',
			];
			
			validTags.forEach(tag => {
				expect(ValidationPatterns.mergeTag.test(tag)).toBe(true);
			});
		});
		
		it('should reject invalid merge tags', () => {
			const invalidTags = [
				'user:email',
				'{user}',
				'{:email}',
				'{123:email}',
				'{user:}',
				'{user email}',
			];
			
			invalidTags.forEach(tag => {
				expect(ValidationPatterns.mergeTag.test(tag)).toBe(false);
			});
		});
	});
	
	describe('eventName pattern', () => {
		it('should match valid event names', () => {
			const validNames = [
				'user_login',
				'order-completed',
				'course.progress',
				'user123_action',
				'event_name',
			];
			
			validNames.forEach(name => {
				expect(ValidationPatterns.eventName.test(name)).toBe(true);
			});
		});
		
		it('should reject invalid event names', () => {
			const invalidNames = [
				'user login',
				'event@name',
				'event#name',
				'event name!',
				'',
			];
			
			invalidNames.forEach(name => {
				expect(ValidationPatterns.eventName.test(name)).toBe(false);
			});
		});
	});
});

describe('ValidationUtils', () => {
	describe('validate', () => {
		it('should validate valid data successfully', async () => {
			const schema = validationSchemas.event;
			const validData = {
				name: 'test_event',
				mappings: {
					user_email: '{user:email}',
					event_time: 'now',
				},
				conditions: [],
			};
			
			const result = await ValidationUtils.validate(schema, validData);
			
			expect(result.isValid).toBe(true);
			expect(result.data).toBeDefined();
			expect(result.errors).toEqual({});
			expect(result.fieldErrors).toEqual({});
		});
		
		it('should return validation errors for invalid data', async () => {
			const schema = validationSchemas.event;
			const invalidData = {
				name: '', // Required field empty
				mappings: {
					user_email: '{invalid:merge:tag}', // Invalid merge tag
				},
			};
			
			const result = await ValidationUtils.validate(schema, invalidData);
			
			expect(result.isValid).toBe(false);
			expect(result.data).toBeUndefined();
			expect(result.errors).toHaveProperty('name');
			expect(result.fieldErrors).toHaveProperty('name');
		});
		
		it('should strip unknown fields when stripUnknown is true', async () => {
			const schema = validationSchemas.event;
			const dataWithUnknown = {
				name: 'test_event',
				mappings: {},
				conditions: [],
				unknownField: 'should be removed',
			};
			
			const result = await ValidationUtils.validate(schema, dataWithUnknown, {
				stripUnknown: true,
			});
			
			expect(result.isValid).toBe(true);
			expect(result.data).not.toHaveProperty('unknownField');
		});
	});
	
	describe('validateSync', () => {
		it('should validate synchronously', () => {
			const schema = validationSchemas.event;
			const validData = {
				name: 'test_event',
				mappings: {},
				conditions: [],
			};
			
			const result = ValidationUtils.validateSync(schema, validData);
			
			expect(result.isValid).toBe(true);
			expect(result.data).toBeDefined();
		});
	});
	
	describe('helper methods', () => {
		it('should check if field has error', () => {
			const result = {
				isValid: false,
				errors: { name: 'Name is required' },
				fieldErrors: { name: ['Name is required'] },
			};
			
			expect(ValidationUtils.hasFieldError(result, 'name')).toBe(true);
			expect(ValidationUtils.hasFieldError(result, 'email')).toBe(false);
		});
		
		it('should get field error', () => {
			const result = {
				isValid: false,
				errors: { name: 'Name is required' },
				fieldErrors: { name: ['Name is required'] },
			};
			
			expect(ValidationUtils.getFieldError(result, 'name')).toBe('Name is required');
			expect(ValidationUtils.getFieldError(result, 'email')).toBeUndefined();
		});
		
		it('should get field errors array', () => {
			const result = {
				isValid: false,
				errors: {},
				fieldErrors: { name: ['Name is required', 'Name too short'] },
			};
			
			expect(ValidationUtils.getFieldErrors(result, 'name')).toEqual([
				'Name is required',
				'Name too short'
			]);
			expect(ValidationUtils.getFieldErrors(result, 'email')).toEqual([]);
		});
		
		it('should merge validation results', () => {
			const result1 = {
				isValid: false,
				errors: { name: 'Name error' },
				fieldErrors: { name: ['Name error'] },
			};
			
			const result2 = {
				isValid: false,
				errors: { email: 'Email error' },
				fieldErrors: { email: ['Email error'] },
			};
			
			const merged = ValidationUtils.mergeResults(result1, result2);
			
			expect(merged.isValid).toBe(false);
			expect(merged.errors).toEqual({
				name: 'Name error',
				email: 'Email error',
			});
			expect(merged.fieldErrors).toEqual({
				name: ['Name error'],
				email: ['Email error'],
			});
		});
	});
});

describe('Validation Schemas', () => {
	describe('event schema', () => {
		it('should validate valid event configuration', async () => {
			const validEvent = {
				name: 'user_login',
				mappings: {
					user_email: '{user:email}',
					login_time: '{system:timestamp}',
				},
				conditions: [
					{
						field: 'user_role',
						operator: 'equals',
						value: 'customer',
					},
				],
			};
			
			const result = await ValidationUtils.validate(validationSchemas.event, validEvent);
			expect(result.isValid).toBe(true);
		});
		
		it('should reject invalid event names', async () => {
			const invalidEvent = {
				name: 'invalid event name!',
				mappings: {},
				conditions: [],
			};
			
			const result = await ValidationUtils.validate(validationSchemas.event, invalidEvent);
			expect(result.isValid).toBe(false);
			expect(result.errors).toHaveProperty('name');
		});
		
		it('should validate merge tags in mappings', async () => {
			const eventWithInvalidMapping = {
				name: 'test_event',
				mappings: {
					user_email: '{invalid:merge:tag}',
				},
				conditions: [],
			};
			
			const result = await ValidationUtils.validate(validationSchemas.event, eventWithInvalidMapping);
			expect(result.isValid).toBe(false);
		});
	});
	
	describe('connection schema', () => {
		it('should validate valid connection settings', async () => {
			const validConnection = {
				endpoint: 'https://api.echodash.com/v1',
				apiKey: 'sk_test_1234567890abcdef1234567890abcdef',
				testConnection: false,
			};
			
			const result = await ValidationUtils.validate(validationSchemas.connection, validConnection);
			expect(result.isValid).toBe(true);
		});
		
		it('should reject invalid endpoints', async () => {
			const invalidConnection = {
				endpoint: 'not-a-url',
				apiKey: 'valid-api-key-123456789012345678901234567890ab',
			};
			
			const result = await ValidationUtils.validate(validationSchemas.connection, invalidConnection);
			expect(result.isValid).toBe(false);
			expect(result.errors).toHaveProperty('endpoint');
		});
		
		it('should reject short API keys', async () => {
			const invalidConnection = {
				endpoint: 'https://api.echodash.com',
				apiKey: 'too-short',
			};
			
			const result = await ValidationUtils.validate(validationSchemas.connection, invalidConnection);
			expect(result.isValid).toBe(false);
			expect(result.errors).toHaveProperty('apiKey');
		});
	});
	
	describe('integration schema', () => {
		it('should validate valid integration', async () => {
			const validIntegration = {
				slug: 'test-integration',
				name: 'Test Integration',
				enabled: true,
				triggers: [],
			};
			
			const result = await ValidationUtils.validate(validationSchemas.integration, validIntegration);
			expect(result.isValid).toBe(true);
		});
		
		it('should reject invalid slugs', async () => {
			const invalidIntegration = {
				slug: 'Invalid Slug!',
				name: 'Test Integration',
				enabled: true,
				triggers: [],
			};
			
			const result = await ValidationUtils.validate(validationSchemas.integration, invalidIntegration);
			expect(result.isValid).toBe(false);
			expect(result.errors).toHaveProperty('slug');
		});
	});
});

describe('useValidation hook', () => {
	it('should initialize with default state', () => {
		const { result } = renderHook(() =>
			useValidation({ schema: validationSchemas.event })
		);
		
		expect(result.current.isValidating).toBe(false);
		expect(result.current.lastResult).toBeNull();
		expect(typeof result.current.validate).toBe('function');
		expect(typeof result.current.validateSync).toBe('function');
		expect(typeof result.current.validateField).toBe('function');
	});
	
	it('should validate data asynchronously', async () => {
		const { result } = renderHook(() =>
			useValidation({ schema: validationSchemas.event })
		);
		
		const validData = {
			name: 'test_event',
			mappings: {},
			conditions: [],
		};
		
		let validationResult;
		await act(async () => {
			validationResult = await result.current.validate(validData);
		});
		
		expect(validationResult.isValid).toBe(true);
		expect(result.current.lastResult?.isValid).toBe(true);
	});
	
	it('should validate data synchronously', () => {
		const { result } = renderHook(() =>
			useValidation({ schema: validationSchemas.event })
		);
		
		const validData = {
			name: 'test_event',
			mappings: {},
			conditions: [],
		};
		
		act(() => {
			const validationResult = result.current.validateSync(validData);
			expect(validationResult.isValid).toBe(true);
		});
		
		expect(result.current.lastResult?.isValid).toBe(true);
	});
	
	it('should validate individual fields', async () => {
		const { result } = renderHook(() =>
			useValidation({ schema: validationSchemas.event })
		);
		
		let fieldResult;
		await act(async () => {
			fieldResult = await result.current.validateField('name', 'valid_event_name');
		});
		
		expect(fieldResult.isValid).toBe(true);
	});
	
	it('should handle validation errors', async () => {
		const { result } = renderHook(() =>
			useValidation({ schema: validationSchemas.event })
		);
		
		const invalidData = {
			name: '', // Required field empty
			mappings: {},
			conditions: [],
		};
		
		let validationResult;
		await act(async () => {
			validationResult = await result.current.validate(invalidData);
		});
		
		expect(validationResult.isValid).toBe(false);
		expect(validationResult.errors).toHaveProperty('name');
		expect(result.current.lastResult?.isValid).toBe(false);
	});
	
	it('should debounce validation when debounceMs is set', async () => {
		jest.useFakeTimers();
		
		const { result } = renderHook(() =>
			useValidation({ 
				schema: validationSchemas.event,
				debounceMs: 300,
			})
		);
		
		const validData = {
			name: 'test_event',
			mappings: {},
			conditions: [],
		};
		
		// Start validation
		const validatePromise = result.current.validate(validData);
		
		// Validation should not complete immediately
		expect(result.current.isValidating).toBe(false);
		
		// Fast-forward time
		act(() => {
			jest.advanceTimersByTime(300);
		});
		
		// Now validation should complete
		await act(async () => {
			const validationResult = await validatePromise;
			expect(validationResult.isValid).toBe(true);
		});
		
		jest.useRealTimers();
	});
});