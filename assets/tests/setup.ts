/**
 * Jest Test Setup File
 *
 * Global test configuration and setup for EchoDash React tests.
 * This file is automatically loaded by Jest before any tests run.
 */

import '@testing-library/jest-dom';

// Mock WordPress i18n functions
const mockI18n = {
	__: (text: string, domain?: string) => text,
	_x: (text: string, context: string, domain?: string) => text,
	_n: (single: string, plural: string, number: number, domain?: string) =>
		number === 1 ? single : plural,
	_nx: (
		single: string,
		plural: string,
		number: number,
		context: string,
		domain?: string
	) => (number === 1 ? single : plural),
	sprintf: (format: string, ...args: any[]) => {
		let i = 0;
		return format.replace(/%s/g, () => args[i++] || '');
	},
};

// Mock WordPress globals
Object.defineProperty(window, 'wp', {
	value: {
		i18n: mockI18n,
	},
	writable: true,
});

// Mock EchoDash global data
Object.defineProperty(window, 'ecdReactData', {
	value: {
		settings: {
			endpoint: 'https://test.echodash.com/webhook/test-endpoint',
			isConnected: true,
			connectUrl: 'https://echodash.com/connect',
		},
		integrations: [
			{
				slug: 'woocommerce',
				name: 'WooCommerce',
				icon: '/wp-content/plugins/echodash/includes/integrations/woocommerce/woocommerce-icon.png',
				iconBackgroundColor: '#96588a',
				triggerCount: 3,
				enabled: true,
				description: 'Track WooCommerce events and customer data',
				availableTriggers: [
					{
						id: 'order_completed',
						name: 'Order Completed',
						description: 'Triggered when an order is completed',
						defaultEvent: {
							name: 'Order Completed',
							mappings: {
								order_id: '{order:id}',
								customer_email: '{user:user_email}',
								order_total: '{order:total}',
							},
						},
						options: [
							{
								name: 'User',
								type: 'user',
								options: [
									{
										meta: 'user_email',
										preview: 'test@example.com',
										placeholder: 'User Email',
									},
									{
										meta: 'user_id',
										preview: 123,
										placeholder: 'User ID',
									},
								],
							},
							{
								name: 'Order',
								type: 'order',
								options: [
									{
										meta: 'id',
										preview: 12345,
										placeholder: 'Order ID',
									},
									{
										meta: 'total',
										preview: 99.99,
										placeholder: 'Order Total',
									},
								],
							},
						],
					},
				],
			},
			{
				slug: 'gravity-forms',
				name: 'Gravity Forms',
				icon: '/wp-content/plugins/echodash/includes/integrations/gravity-forms/gravity-forms-icon.png',
				iconBackgroundColor: '#ff6900',
				triggerCount: 1,
				enabled: true,
				description: 'Track form submissions and user data',
				availableTriggers: [
					{
						id: 'form_submitted',
						name: 'Form Submitted',
						description: 'Triggered when a form is submitted',
						defaultEvent: {
							name: 'Form Submitted',
							mappings: {
								form_id: '{form:id}',
								user_email: '{user:user_email}',
							},
						},
						options: [
							{
								name: 'User',
								type: 'user',
								options: [
									{
										meta: 'user_email',
										preview: 'test@example.com',
										placeholder: 'User Email',
									},
								],
							},
							{
								name: 'Form',
								type: 'form',
								options: [
									{
										meta: 'id',
										preview: 5,
										placeholder: 'Form ID',
									},
									{
										meta: 'title',
										preview: 'Contact Form',
										placeholder: 'Form Title',
									},
								],
							},
						],
					},
				],
			},
		],
		userTriggers: {
			woocommerce: {
				global: [
					{
						id: '1',
						name: 'Purchase Completed',
						trigger: 'order_completed',
						event_name: 'Purchase Completed',
						description: 'Triggered when an order is completed',
						enabled: true,
						mappings: [
							{ key: 'order_id', value: '{order:id}' },
							{ key: 'customer_email', value: '{user:user_email}' },
							{ key: 'order_total', value: '{order:total}' },
						],
					},
				],
				singleItem: [],
			},
			'gravity-forms': {
				global: [],
				singleItem: [],
			},
		},
		nonce: 'test-nonce-12345',
		apiUrl: '/wp-json/echodash/v1/',
		i18n: {
			save: 'Save',
			cancel: 'Cancel',
			delete: 'Delete',
			edit: 'Edit',
			loading: 'Loading...',
		},
	},
	writable: true,
});

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
console.error = jest.fn();
console.warn = jest.fn();

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}));

// Mock window.confirm for delete confirmations
Object.defineProperty(window, 'confirm', {
	value: jest.fn(() => true),
	writable: true,
});

// Mock window.alert for error messages
Object.defineProperty(window, 'alert', {
	value: jest.fn(),
	writable: true,
});

// Mock window.location methods
Object.defineProperty(window, 'location', {
	value: {
		href: 'https://test.example.com/wp-admin/admin.php?page=echodash',
		pathname: '/wp-admin/admin.php',
		search: '?page=echodash',
		hash: '',
		reload: jest.fn(),
	},
	writable: true,
});

// Mock window.history for navigation
Object.defineProperty(window, 'history', {
	value: {
		pushState: jest.fn(),
		replaceState: jest.fn(),
		back: jest.fn(),
		forward: jest.fn(),
	},
	writable: true,
});

// Clear all mocks before each test
beforeEach(() => {
	jest.clearAllMocks();
	
	// Reset fetch mock
	(fetch as jest.MockedFunction<typeof fetch>).mockClear();
	
	// Reset window methods
	(window.confirm as jest.MockedFunction<typeof window.confirm>).mockReturnValue(true);
	(window.alert as jest.MockedFunction<typeof window.alert>).mockClear();
	(window.history.pushState as jest.MockedFunction<typeof window.history.pushState>).mockClear();
});

// Global test utilities
export const mockFetchResponse = (data: any, status = 200, ok = true) => {
	(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
		ok,
		status,
		json: async () => data,
		text: async () => JSON.stringify(data),
	} as Response);
};

export const mockFetchError = (message = 'Network error') => {
	(fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error(message));
};

// Helper to wait for async operations
export const waitFor = (ms: number = 0) => 
	new Promise(resolve => setTimeout(resolve, ms));