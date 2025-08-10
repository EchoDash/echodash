/**
 * Jest Test Setup File
 *
 * Global test configuration and setup for EchoDash React tests.
 * This file is automatically loaded by Jest before any tests run.
 */

import '@testing-library/jest-dom';

// Mock WordPress i18n functions
const mockI18n = {
	__: (text: string) => text,
	_x: (text: string) => text,
	_n: (single: string, plural: string, number: number) =>
		number === 1 ? single : plural,
	_nx: (single: string, plural: string, number: number) =>
		number === 1 ? single : plural,
	sprintf: (format: string, ...args: (string | number)[]) => {
		let i = 0;
		return format.replace(/%s/g, () => args[i++] || '');
	},
};

// Mock WordPress globals
Object.defineProperty(window, 'wp', {
	value: {
		i18n: mockI18n,
		apiFetch: jest.fn().mockImplementation(options => {
			// Handle different API endpoints based on options
			const { path, method = 'GET', data } = options;

			// Mock responses for different endpoints
			if (path === '/echodash/v1/settings') {
				if (method === 'GET') {
					return Promise.resolve({
						endpoint:
							'https://test.echodash.com/webhook/test-endpoint',
						isConnected: true,
						connectUrl: 'https://echodash.com/connect',
					});
				} else if (method === 'POST') {
					return Promise.resolve({
						success: true,
						message: 'Settings saved successfully',
						data: data,
					});
				}
			}

			if (path === '/echodash/v1/integrations') {
				return Promise.resolve([
					{
						slug: 'woocommerce',
						name: 'WooCommerce',
						enabled: true,
						triggerCount: 3,
					},
					{
						slug: 'gravity-forms',
						name: 'Gravity Forms',
						enabled: true,
						triggerCount: 1,
					},
				]);
			}

			if (path && path.includes('/echodash/v1/integrations/')) {
				const slug = path.split('/').pop();
				return Promise.resolve({
					slug: slug,
					name: slug.charAt(0).toUpperCase() + slug.slice(1),
					enabled: true,
					triggers: [],
				});
			}

			if (path === '/echodash/v1/test-event') {
				return Promise.resolve({
					success: true,
					message: 'Test event sent successfully',
				});
			}

			if (path === '/echodash/v1/preview') {
				return Promise.resolve({
					success: true,
					preview: {
						event_name: 'Test Event',
						mappings: {
							user_email: 'test@example.com',
							user_id: 123,
						},
					},
				});
			}

			// Default response for unknown endpoints
			return Promise.resolve({
				success: true,
				data: {},
			});
		}),
	},
	writable: true,
});

// Mock WordPress ajaxurl global
Object.defineProperty(window, 'ajaxurl', {
	value: '/wp-admin/admin-ajax.php',
	writable: true,
});

// Mock echodash_vars global for legacy PHP admin interface
Object.defineProperty(window, 'echodash_vars', {
	value: {
		nonce: 'test-nonce-12345',
		ajax_url: '/wp-admin/admin-ajax.php',
		api_url: '/wp-json/echodash/v1/',
		version: '2.0.0',
		plugin_url: '/wp-content/plugins/echodash/',
		admin_url: '/wp-admin/admin.php?page=echodash',
		i18n: {
			save: 'Save',
			cancel: 'Cancel',
			delete: 'Delete',
			edit: 'Edit',
			loading: 'Loading...',
			confirm_delete: 'Are you sure you want to delete this item?',
			error_occurred: 'An error occurred. Please try again.',
		},
		settings: {
			endpoint: 'https://test.echodash.com/webhook/test-endpoint',
			isConnected: true,
			connectUrl: 'https://echodash.com/connect',
		},
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
							{
								key: 'customer_email',
								value: '{user:user_email}',
							},
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
// eslint-disable-next-line no-console
console.error = jest.fn();
// eslint-disable-next-line no-console
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

	// Reset wp.apiFetch mock
	if (window.wp && window.wp.apiFetch) {
		(
			window.wp.apiFetch as jest.MockedFunction<typeof window.wp.apiFetch>
		).mockClear();
	}

	// Reset window methods
	(
		window.confirm as jest.MockedFunction<typeof window.confirm>
	).mockReturnValue(true);
	(window.alert as jest.MockedFunction<typeof window.alert>).mockClear();
	(
		window.history.pushState as jest.MockedFunction<
			typeof window.history.pushState
		>
	).mockClear();

	// Mock RAF for animations if not present
	if (!window.requestAnimationFrame) {
		window.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
	}
	if (!window.cancelAnimationFrame) {
		window.cancelAnimationFrame = jest.fn();
	}
});

// Global test utilities
export const mockFetchResponse = (
	data: Record<string, unknown>,
	status = 200,
	ok = true
): void => {
	(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
		ok,
		status,
		json: async () => data,
		text: async () => JSON.stringify(data),
	} as Response);
};

export const mockFetchError = (message = 'Network error'): void => {
	(fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
		new Error(message)
	);
};

// Helper to wait for async operations
export const waitFor = (ms: number = 0): Promise<void> =>
	new Promise(resolve => setTimeout(resolve, ms));
