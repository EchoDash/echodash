/**
 * Testing Utilities
 * 
 * Comprehensive testing utilities for the EchoDash React application
 * including custom render functions, mocks, and test helpers.
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import { ValidationProvider } from './validation';
import { ErrorBoundaryProvider } from '../components/common/ErrorBoundary';

// Mock WordPress globals
const mockEcdReactData = {
	apiUrl: 'https://test.example.com/wp-json/echodash/v1/',
	nonce: 'test-nonce-12345',
	currentUser: {
		ID: 1,
		display_name: 'Test User',
		user_email: 'test@example.com',
		roles: ['administrator'],
		capabilities: {
			manage_options: true,
		},
	},
	integrations: [],
	settings: {
		endpoint: 'https://api.echodash.com',
		options: {},
		isConnected: true,
	},
	featureFlags: {
		reactEnabled: true,
		betaUser: false,
		rolloutStats: {
			rollout_percentage: 50,
			beta_users_count: 0,
			total_users: 100,
			estimated_react_users: 50,
		},
	},
	environment: {
		debugMode: true,
		wpVersion: '6.0',
		pluginVersion: '2.0.0',
		adminUrl: 'https://test.example.com/wp-admin/',
		assetsUrl: 'https://test.example.com/wp-content/plugins/echodash/assets/',
	},
	i18n: {
		loading: 'Loading...',
		error: 'Error',
		success: 'Success',
		saving: 'Saving...',
		saved: 'Saved',
		cancel: 'Cancel',
		delete: 'Delete',
		edit: 'Edit',
		add: 'Add',
		remove: 'Remove',
		confirm: 'Confirm',
		confirmDelete: 'Are you sure you want to delete this item?',
		noResults: 'No results found',
		searchPlaceholder: 'Search...',
	},
	performance: {
		enableMetrics: true,
		bundleSize: {
			js: 150000,
			css: 25000,
			total: 175000,
			formatted: {
				js: '146.5 KB',
				css: '24.4 KB',
				total: '170.9 KB',
			},
		},
	},
};

// Setup global mocks
beforeAll(() => {
	// Mock window.ecdReactData
	Object.defineProperty(window, 'ecdReactData', {
		value: mockEcdReactData,
		writable: true,
	});
	
	// Mock performance API
	Object.defineProperty(window, 'performance', {
		value: {
			now: jest.fn(() => Date.now()),
			mark: jest.fn(),
			measure: jest.fn(),
			getEntriesByName: jest.fn(() => []),
			getEntriesByType: jest.fn(() => []),
		},
		writable: true,
	});
	
	// Mock IntersectionObserver
	Object.defineProperty(window, 'IntersectionObserver', {
		value: jest.fn().mockImplementation(() => ({
			observe: jest.fn(),
			unobserve: jest.fn(),
			disconnect: jest.fn(),
		})),
		writable: true,
	});
	
	// Mock ResizeObserver
	Object.defineProperty(window, 'ResizeObserver', {
		value: jest.fn().mockImplementation(() => ({
			observe: jest.fn(),
			unobserve: jest.fn(),
			disconnect: jest.fn(),
		})),
		writable: true,
	});
	
	// Mock fetch
	global.fetch = jest.fn(() =>
		Promise.resolve({
			ok: true,
			status: 200,
			json: () => Promise.resolve({}),
			text: () => Promise.resolve(''),
		})
	) as jest.Mock;
	
	// Mock console methods to reduce noise in tests
	global.console.warn = jest.fn();
	global.console.error = jest.fn();
});

// Clean up after each test
afterEach(() => {
	jest.clearAllMocks();
	
	// Clear any timers
	jest.clearAllTimers();
	
	// Reset DOM
	document.body.innerHTML = '';
});

// Test providers wrapper
interface TestProvidersProps {
	children: React.ReactNode;
	initialState?: Partial<typeof mockEcdReactData>;
}

const TestProviders: React.FC<TestProvidersProps> = ({ children, initialState = {} }) => {
	// Merge initial state with default mock data
	React.useEffect(() => {
		Object.assign(window.ecdReactData, initialState);
	}, [initialState]);
	
	return (
		<ErrorBoundaryProvider>
			<ValidationProvider>
				{children}
			</ValidationProvider>
		</ErrorBoundaryProvider>
	);
};

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
	initialState?: Partial<typeof mockEcdReactData>;
	wrapper?: React.ComponentType<any>;
}

export function renderWithProviders(
	ui: ReactElement,
	options: CustomRenderOptions = {}
) {
	const { initialState, wrapper, ...renderOptions } = options;
	
	const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
		const TestWrapper = wrapper || React.Fragment;
		return (
			<TestProviders initialState={initialState}>
				<TestWrapper>{children}</TestWrapper>
			</TestProviders>
		);
	};
	
	return {
		user: userEvent.setup(),
		...render(ui, { wrapper: Wrapper, ...renderOptions }),
	};
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { userEvent };

// Custom render as default export
export { renderWithProviders as render };

// Test utilities and helpers
export const TestUtils = {
	/**
	 * Wait for component to finish loading
	 */
	async waitForLoad(timeout = 5000) {
		await waitFor(
			() => {
				expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
			},
			{ timeout }
		);
	},
	
	/**
	 * Wait for API call to complete
	 */
	async waitForApiCall(mockFetch = global.fetch as jest.Mock, timeout = 5000) {
		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalled();
		}, { timeout });
	},
	
	/**
	 * Simulate form submission
	 */
	async submitForm(formElement: HTMLElement) {
		const user = userEvent.setup();
		const submitButton = screen.getByRole('button', { name: /submit|save|update/i });
		await user.click(submitButton);
	},
	
	/**
	 * Fill form field by label
	 */
	async fillField(labelText: string, value: string) {
		const user = userEvent.setup();
		const field = screen.getByLabelText(labelText);
		await user.clear(field);
		await user.type(field, value);
	},
	
	/**
	 * Select option from dropdown
	 */
	async selectOption(labelText: string, optionText: string) {
		const user = userEvent.setup();
		const select = screen.getByLabelText(labelText);
		await user.selectOptions(select, optionText);
	},
	
	/**
	 * Click button by text
	 */
	async clickButton(buttonText: string) {
		const user = userEvent.setup();
		const button = screen.getByRole('button', { name: new RegExp(buttonText, 'i') });
		await user.click(button);
	},
	
	/**
	 * Mock performance observer
	 */
	mockPerformanceObserver() {
		const mockObserver = {
			observe: jest.fn(),
			unobserve: jest.fn(),
			disconnect: jest.fn(),
		};
		
		global.PerformanceObserver = jest.fn().mockImplementation((callback) => {
			return mockObserver;
		});
		
		return mockObserver;
	},
	
	/**
	 * Create mock integration data
	 */
	createMockIntegration(overrides = {}) {
		return {
			slug: 'test-integration',
			name: 'Test Integration',
			icon: 'admin-plugins',
			triggerCount: 2,
			enabled: true,
			isActive: true,
			description: 'Test integration for unit tests',
			triggers: [
				{
					id: 'test_trigger',
					name: 'Test Trigger',
					description: 'A test trigger for unit tests',
					enabled: true,
					mappingCount: 3,
					lastModified: '',
					hasErrors: false,
				},
			],
			availableTriggers: [
				{
					id: 'test_trigger',
					name: 'Test Trigger',
					description: 'A test trigger for unit tests',
					hasGlobal: true,
					hasSingle: true,
					postTypes: ['post', 'page'],
					optionTypes: ['user', 'post'],
					defaultEvent: {
						name: 'test_event',
						mappings: {
							user_email: '{user:user_email}',
							post_title: '{post:post_title}',
						},
					},
				},
			],
			...overrides,
		};
	},
	
	/**
	 * Create mock event data
	 */
	createMockEvent(overrides = {}) {
		return {
			name: 'test_event',
			mappings: {
				user_email: '{user:user_email}',
				event_time: '{system:timestamp}',
				page_url: '{system:current_url}',
			},
			conditions: [],
			...overrides,
		};
	},
	
	/**
	 * Create mock API response
	 */
	createMockApiResponse(data = {}, options = {}) {
		return {
			ok: true,
			status: 200,
			statusText: 'OK',
			json: () => Promise.resolve({
				success: true,
				data,
				...options,
			}),
			text: () => Promise.resolve(JSON.stringify({ success: true, data, ...options })),
			headers: new Headers({
				'Content-Type': 'application/json',
			}),
			...options,
		};
	},
	
	/**
	 * Mock fetch with specific response
	 */
	mockFetch(response: any) {
		const mockResponse = typeof response === 'function' ? response : () => Promise.resolve(response);
		(global.fetch as jest.Mock).mockImplementation(mockResponse);
	},
	
	/**
	 * Mock console methods
	 */
	mockConsole() {
		const originalConsole = { ...console };
		
		console.log = jest.fn();
		console.warn = jest.fn();
		console.error = jest.fn();
		console.info = jest.fn();
		console.debug = jest.fn();
		
		return {
			restore: () => {
				Object.assign(console, originalConsole);
			},
			mocks: {
				log: console.log as jest.Mock,
				warn: console.warn as jest.Mock,
				error: console.error as jest.Mock,
				info: console.info as jest.Mock,
				debug: console.debug as jest.Mock,
			},
		};
	},
	
	/**
	 * Create mock validation result
	 */
	createMockValidationResult(isValid = true, errors = {}, fieldErrors = {}) {
		return {
			isValid,
			errors,
			fieldErrors,
			data: isValid ? { test: 'data' } : undefined,
		};
	},
	
	/**
	 * Wait for error boundary to catch error
	 */
	async waitForError(timeout = 2000) {
		await waitFor(
			() => {
				expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
			},
			{ timeout }
		);
	},
	
	/**
	 * Simulate network error
	 */
	simulateNetworkError() {
		(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
	},
	
	/**
	 * Simulate API error response
	 */
	simulateApiError(status = 500, message = 'Internal Server Error') {
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: false,
			status,
			statusText: message,
			json: () => Promise.resolve({
				success: false,
				error: message,
			}),
		});
	},
	
	/**
	 * Create performance measurement
	 */
	createPerformanceMeasurement(name: string, duration: number) {
		return {
			name,
			duration,
			startTime: performance.now() - duration,
			entryType: 'measure',
		};
	},
	
	/**
	 * Mock localStorage
	 */
	mockLocalStorage() {
		const mockStorage: Record<string, string> = {};
		
		Object.defineProperty(window, 'localStorage', {
			value: {
				getItem: jest.fn((key: string) => mockStorage[key] || null),
				setItem: jest.fn((key: string, value: string) => {
					mockStorage[key] = value;
				}),
				removeItem: jest.fn((key: string) => {
					delete mockStorage[key];
				}),
				clear: jest.fn(() => {
					Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
				}),
				length: 0,
				key: jest.fn(),
			},
			writable: true,
		});
		
		return mockStorage;
	},
	
	/**
	 * Mock sessionStorage
	 */
	mockSessionStorage() {
		const mockStorage: Record<string, string> = {};
		
		Object.defineProperty(window, 'sessionStorage', {
			value: {
				getItem: jest.fn((key: string) => mockStorage[key] || null),
				setItem: jest.fn((key: string, value: string) => {
					mockStorage[key] = value;
				}),
				removeItem: jest.fn((key: string) => {
					delete mockStorage[key];
				}),
				clear: jest.fn(() => {
					Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
				}),
				length: 0,
				key: jest.fn(),
			},
			writable: true,
		});
		
		return mockStorage;
	},
};

// Custom matchers for Jest
declare global {
	namespace jest {
		interface Matchers<R> {
			toBeValidationError(): R;
			toHaveValidationError(field: string): R;
			toBeLoadingState(): R;
			toBeErrorState(): R;
		}
	}
}

// Add custom matchers
expect.extend({
	toBeValidationError(received) {
		const pass = received && typeof received === 'object' && 
					  'isValid' in received && received.isValid === false &&
					  'errors' in received && typeof received.errors === 'object';
		
		return {
			message: () => pass 
				? `Expected not to be a validation error`
				: `Expected to be a validation error with isValid: false and errors object`,
			pass,
		};
	},
	
	toHaveValidationError(received, fieldName) {
		const pass = received && typeof received === 'object' &&
					 'errors' in received && fieldName in received.errors;
		
		return {
			message: () => pass
				? `Expected not to have validation error for field "${fieldName}"`
				: `Expected to have validation error for field "${fieldName}"`,
			pass,
		};
	},
	
	toBeLoadingState(received) {
		const pass = received && received.textContent && 
					 received.textContent.includes('Loading');
		
		return {
			message: () => pass
				? `Expected not to be in loading state`
				: `Expected to be in loading state`,
			pass,
		};
	},
	
	toBeErrorState(received) {
		const pass = received && received.textContent && 
					 (received.textContent.includes('Error') || 
					  received.textContent.includes('Something went wrong'));
		
		return {
			message: () => pass
				? `Expected not to be in error state`
				: `Expected to be in error state`,
			pass,
		};
	},
});

// Export test data generators
export const TestData = {
	integration: TestUtils.createMockIntegration,
	event: TestUtils.createMockEvent,
	apiResponse: TestUtils.createMockApiResponse,
	validationResult: TestUtils.createMockValidationResult,
	performanceMeasurement: TestUtils.createPerformanceMeasurement,
};

// Export test setup helpers
export const TestSetup = {
	mockConsole: TestUtils.mockConsole,
	mockFetch: TestUtils.mockFetch,
	mockLocalStorage: TestUtils.mockLocalStorage,
	mockSessionStorage: TestUtils.mockSessionStorage,
	mockPerformanceObserver: TestUtils.mockPerformanceObserver,
	simulateNetworkError: TestUtils.simulateNetworkError,
	simulateApiError: TestUtils.simulateApiError,
};

// Export interaction helpers
export const TestInteraction = {
	waitForLoad: TestUtils.waitForLoad,
	waitForApiCall: TestUtils.waitForApiCall,
	waitForError: TestUtils.waitForError,
	fillField: TestUtils.fillField,
	selectOption: TestUtils.selectOption,
	clickButton: TestUtils.clickButton,
	submitForm: TestUtils.submitForm,
};