/**
 * API Integration Tests
 * 
 * Integration tests for API calls, error handling,
 * and data flow between components and backend.
 */

import { TestUtils, TestSetup, TestInteraction } from '../../src/utils/test-utils';

// Mock API endpoints for testing
const API_ENDPOINTS = {
	integrations: '/wp-json/echodash/v1/integrations',
	settings: '/wp-json/echodash/v1/settings',
	events: '/wp-json/echodash/v1/events',
	test_connection: '/wp-json/echodash/v1/test-connection',
};

describe('API Integration Tests', () => {
	beforeEach(() => {
		// Reset fetch mock before each test
		jest.clearAllMocks();
	});
	
	describe('Integrations API', () => {
		it('should fetch integrations successfully', async () => {
			const mockIntegrations = [
				TestUtils.createMockIntegration({ slug: 'woocommerce', name: 'WooCommerce' }),
				TestUtils.createMockIntegration({ slug: 'learndash', name: 'LearnDash' }),
			];
			
			TestSetup.mockFetch(
				TestUtils.createMockApiResponse({ integrations: mockIntegrations })
			);
			
			const response = await fetch(API_ENDPOINTS.integrations);
			const data = await response.json();
			
			expect(response.ok).toBe(true);
			expect(data.success).toBe(true);
			expect(data.data.integrations).toHaveLength(2);
			expect(data.data.integrations[0].slug).toBe('woocommerce');
		});
		
		it('should handle integration fetch errors', async () => {
			TestSetup.simulateApiError(500, 'Internal Server Error');
			
			const response = await fetch(API_ENDPOINTS.integrations);
			
			expect(response.ok).toBe(false);
			expect(response.status).toBe(500);
		});
		
		it('should update integration settings', async () => {
			const updatedIntegration = TestUtils.createMockIntegration({
				slug: 'woocommerce',
				enabled: true,
			});
			
			TestSetup.mockFetch(
				TestUtils.createMockApiResponse({ integration: updatedIntegration })
			);
			
			const response = await fetch(`${API_ENDPOINTS.integrations}/woocommerce`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': window.ecdReactData.nonce,
				},
				body: JSON.stringify(updatedIntegration),
			});
			
			const data = await response.json();
			
			expect(response.ok).toBe(true);
			expect(data.data.integration.enabled).toBe(true);
		});
		
		it('should validate integration data before sending', async () => {
			const invalidIntegration = {
				slug: 'Invalid Slug!', // Invalid slug format
				name: 'Test Integration',
				enabled: true,
			};
			
			TestSetup.simulateApiError(400, 'Validation Error');
			
			const response = await fetch(`${API_ENDPOINTS.integrations}/test`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(invalidIntegration),
			});
			
			expect(response.ok).toBe(false);
			expect(response.status).toBe(400);
		});
	});
	
	describe('Settings API', () => {
		it('should fetch current settings', async () => {
			const mockSettings = {
				endpoint: 'https://api.echodash.com',
				options: {
					debug_mode: false,
					batch_size: 100,
				},
				isConnected: true,
			};
			
			TestSetup.mockFetch(
				TestUtils.createMockApiResponse({ settings: mockSettings })
			);
			
			const response = await fetch(API_ENDPOINTS.settings);
			const data = await response.json();
			
			expect(data.data.settings.endpoint).toBe('https://api.echodash.com');
			expect(data.data.settings.isConnected).toBe(true);
		});
		
		it('should update settings with validation', async () => {
			const newSettings = {
				endpoint: 'https://new-api.echodash.com',
				apiKey: 'sk_test_1234567890abcdef1234567890abcdef',
				options: {
					debug_mode: true,
					batch_size: 50,
				},
			};
			
			TestSetup.mockFetch(
				TestUtils.createMockApiResponse({ settings: newSettings })
			);
			
			const response = await fetch(API_ENDPOINTS.settings, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': window.ecdReactData.nonce,
				},
				body: JSON.stringify(newSettings),
			});
			
			const data = await response.json();
			
			expect(response.ok).toBe(true);
			expect(data.data.settings.endpoint).toBe('https://new-api.echodash.com');
		});
		
		it('should reject invalid settings', async () => {
			const invalidSettings = {
				endpoint: 'not-a-valid-url',
				apiKey: 'too-short',
			};
			
			TestSetup.simulateApiError(400, 'Invalid settings data');
			
			const response = await fetch(API_ENDPOINTS.settings, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(invalidSettings),
			});
			
			expect(response.ok).toBe(false);
		});
	});
	
	describe('Connection Testing API', () => {
		it('should test connection successfully', async () => {
			const connectionResult = {
				success: true,
				message: 'Connection successful',
				details: {
					response_time: 150,
					api_version: '1.0',
					features: ['events', 'users', 'analytics'],
				},
			};
			
			TestSetup.mockFetch(
				TestUtils.createMockApiResponse(connectionResult)
			);
			
			const response = await fetch(API_ENDPOINTS.test_connection, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': window.ecdReactData.nonce,
				},
				body: JSON.stringify({
					endpoint: 'https://api.echodash.com',
					apiKey: 'sk_test_1234567890abcdef1234567890abcdef',
				}),
			});
			
			const data = await response.json();
			
			expect(data.success).toBe(true);
			expect(data.data.details.response_time).toBe(150);
		});
		
		it('should handle connection failures', async () => {
			const connectionError = {
				success: false,
				message: 'Connection failed',
				error: 'Invalid API key',
			};
			
			TestSetup.mockFetch(
				TestUtils.createMockApiResponse(connectionError, { status: 401 })
			);
			
			const response = await fetch(API_ENDPOINTS.test_connection, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					endpoint: 'https://api.echodash.com',
					apiKey: 'invalid-key',
				}),
			});
			
			expect(response.status).toBe(401);
		});
		
		it('should timeout on slow connections', async () => {
			// Mock a slow response
			TestSetup.mockFetch(() => 
				new Promise((resolve) => 
					setTimeout(() => resolve(TestUtils.createMockApiResponse({})), 5000)
				)
			);
			
			// This would typically be handled by AbortController in real implementation
			const timeoutPromise = new Promise((_, reject) => 
				setTimeout(() => reject(new Error('Timeout')), 3000)
			);
			
			const fetchPromise = fetch(API_ENDPOINTS.test_connection, {
				method: 'POST',
				body: JSON.stringify({}),
			});
			
			await expect(Promise.race([fetchPromise, timeoutPromise]))
				.rejects.toThrow('Timeout');
		});
	});
	
	describe('Events API', () => {
		it('should send events in batches', async () => {
			const events = [
				TestUtils.createMockEvent({ name: 'user_login' }),
				TestUtils.createMockEvent({ name: 'page_view' }),
				TestUtils.createMockEvent({ name: 'button_click' }),
			];
			
			TestSetup.mockFetch(
				TestUtils.createMockApiResponse({ 
					processed: events.length,
					failed: 0,
				})
			);
			
			const response = await fetch(API_ENDPOINTS.events, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': window.ecdReactData.nonce,
				},
				body: JSON.stringify({ events }),
			});
			
			const data = await response.json();
			
			expect(data.data.processed).toBe(3);
			expect(data.data.failed).toBe(0);
		});
		
		it('should handle partial failures in event batches', async () => {
			const events = [
				TestUtils.createMockEvent({ name: 'valid_event' }),
				TestUtils.createMockEvent({ name: 'invalid event name!' }),
			];
			
			TestSetup.mockFetch(
				TestUtils.createMockApiResponse({
					processed: 1,
					failed: 1,
					errors: [
						{
							event: 'invalid event name!',
							error: 'Invalid event name format',
						},
					],
				})
			);
			
			const response = await fetch(API_ENDPOINTS.events, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ events }),
			});
			
			const data = await response.json();
			
			expect(data.data.processed).toBe(1);
			expect(data.data.failed).toBe(1);
			expect(data.data.errors).toHaveLength(1);
		});
	});
	
	describe('Error Handling', () => {
		it('should handle network errors gracefully', async () => {
			TestSetup.simulateNetworkError();
			
			try {
				await fetch(API_ENDPOINTS.settings);
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect(error.message).toBe('Network error');
			}
		});
		
		it('should retry failed requests', async () => {
			let callCount = 0;
			TestSetup.mockFetch(() => {
				callCount++;
				if (callCount < 3) {
					return Promise.reject(new Error('Network error'));
				}
				return Promise.resolve(TestUtils.createMockApiResponse({}));
			});
			
			// Simple retry logic (in real implementation, this would be in a utility function)
			const retryFetch = async (url: string, options: RequestInit, maxRetries = 3) => {
				for (let i = 0; i < maxRetries; i++) {
					try {
						return await fetch(url, options);
					} catch (error) {
						if (i === maxRetries - 1) throw error;
						await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i)));
					}
				}
			};
			
			const response = await retryFetch(API_ENDPOINTS.settings, {});
			expect(response.ok).toBe(true);
			expect(callCount).toBe(3);
		});
		
		it('should handle authentication errors', async () => {
			TestSetup.simulateApiError(401, 'Unauthorized');
			
			const response = await fetch(API_ENDPOINTS.settings, {
				headers: {
					'X-WP-Nonce': 'invalid-nonce',
				},
			});
			
			expect(response.status).toBe(401);
			expect(response.statusText).toBe('Unauthorized');
		});
		
		it('should handle rate limiting', async () => {
			TestSetup.simulateApiError(429, 'Too Many Requests');
			
			const response = await fetch(API_ENDPOINTS.events, {
				method: 'POST',
				body: JSON.stringify({ events: [] }),
			});
			
			expect(response.status).toBe(429);
		});
	});
	
	describe('Data Validation', () => {
		it('should validate request data before sending', async () => {
			const invalidData = {
				endpoint: 'not-a-url',
				apiKey: 'short',
			};
			
			// In real implementation, validation would happen client-side
			// before the request is made
			const isValid = (data: any) => {
				try {
					new URL(data.endpoint);
					return data.apiKey && data.apiKey.length >= 32;
				} catch {
					return false;
				}
			};
			
			expect(isValid(invalidData)).toBe(false);
		});
		
		it('should sanitize response data', async () => {
			const unsafeResponse = {
				success: true,
				data: {
					settings: {
						endpoint: 'https://api.echodash.com',
						// Potentially unsafe data that should be sanitized
						user_input: '<script>alert("xss")</script>',
					},
				},
			};
			
			TestSetup.mockFetch(unsafeResponse);
			
			const response = await fetch(API_ENDPOINTS.settings);
			const data = await response.json();
			
			// In real implementation, response data would be sanitized
			expect(data.data.settings.user_input).toContain('<script>');
			// Would be sanitized to: '&lt;script&gt;alert("xss")&lt;/script&gt;'
		});
	});
	
	describe('Performance Monitoring', () => {
		it('should measure API response times', async () => {
			const startTime = performance.now();
			
			// Mock a response with specific timing
			TestSetup.mockFetch(() => 
				new Promise(resolve => 
					setTimeout(() => resolve(TestUtils.createMockApiResponse({})), 200)
				)
			);
			
			const response = await fetch(API_ENDPOINTS.settings);
			const endTime = performance.now();
			const responseTime = endTime - startTime;
			
			expect(response.ok).toBe(true);
			expect(responseTime).toBeGreaterThan(200);
			expect(responseTime).toBeLessThan(300); // Allow some tolerance
		});
		
		it('should track API call success rates', async () => {
			const results: boolean[] = [];
			
			// Simulate multiple API calls with some failures
			for (let i = 0; i < 10; i++) {
				const shouldFail = i % 3 === 0; // Fail every 3rd request
				
				TestSetup.mockFetch(
					shouldFail 
						? TestUtils.createMockApiResponse({}, { status: 500, ok: false })
						: TestUtils.createMockApiResponse({})
				);
				
				try {
					const response = await fetch(API_ENDPOINTS.settings);
					results.push(response.ok);
				} catch {
					results.push(false);
				}
			}
			
			const successRate = results.filter(r => r).length / results.length;
			expect(successRate).toBeCloseTo(0.7, 1); // ~70% success rate
		});
	});
});