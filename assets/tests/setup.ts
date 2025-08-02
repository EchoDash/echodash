/**
 * Jest Test Setup
 * 
 * Global test setup and configuration for Jest tests.
 * This file is executed before each test file.
 */

import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Increase default timeout for integration tests
jest.setTimeout(10000);

// Mock WordPress globals that might be accessed during tests
global.window.wp = {
	element: {
		createElement: jest.fn(),
		Fragment: jest.fn(),
	},
	components: {
		Button: jest.fn(),
		Card: jest.fn(),
		CardBody: jest.fn(),
		Flex: jest.fn(),
		Text: jest.fn(),
		Spinner: jest.fn(),
	},
	apiFetch: jest.fn(() => Promise.resolve({})),
	hooks: {
		addAction: jest.fn(),
		addFilter: jest.fn(),
		removeAction: jest.fn(),
		removeFilter: jest.fn(),
		doAction: jest.fn(),
		applyFilters: jest.fn(),
	},
};

// Mock WordPress admin AJAX
global.window.ajaxurl = '/wp-admin/admin-ajax.php';

// Mock jQuery if needed
global.window.jQuery = jest.fn();
global.window.$ = global.window.jQuery;

// Suppress console warnings/errors in tests unless explicitly testing them
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
	// Reset console mocks
	console.error = jest.fn();
	console.warn = jest.fn();
});

afterEach(() => {
	// Restore original console methods
	console.error = originalConsoleError;
	console.warn = originalConsoleWarn;
});

// Add custom matchers
expect.extend({
	toHaveBeenCalledWithPartialObject(received, expected) {
		const pass = received.mock.calls.some((call: any[]) => {
			return call.some((arg) => {
				if (typeof arg === 'object' && arg !== null) {
					return Object.keys(expected).every(key => 
						arg.hasOwnProperty(key) && arg[key] === expected[key]
					);
				}
				return false;
			});
		});

		return {
			message: () => pass
				? `Expected not to have been called with partial object ${JSON.stringify(expected)}`
				: `Expected to have been called with partial object ${JSON.stringify(expected)}`,
			pass,
		};
	},

	toBeWithinRange(received, floor, ceiling) {
		const pass = received >= floor && received <= ceiling;
		return {
			message: () => pass
				? `Expected ${received} not to be within range ${floor} - ${ceiling}`
				: `Expected ${received} to be within range ${floor} - ${ceiling}`,
			pass,
		};
	},
});

// Extend global types for custom matchers
declare global {
	namespace jest {
		interface Matchers<R> {
			toHaveBeenCalledWithPartialObject(expected: Record<string, any>): R;
			toBeWithinRange(floor: number, ceiling: number): R;
		}
	}
}

// Mock URL constructor for environments that don't have it
if (typeof global.URL === 'undefined') {
	global.URL = class URL {
		protocol: string;
		hostname: string;
		port: string;
		pathname: string;
		search: string;
		hash: string;
		href: string;

		constructor(url: string, base?: string) {
			this.href = url;
			this.protocol = 'https:';
			this.hostname = 'test.example.com';
			this.port = '';
			this.pathname = '/';
			this.search = '';
			this.hash = '';
		}

		toString() {
			return this.href;
		}
	} as any;
}

// Mock URLSearchParams
if (typeof global.URLSearchParams === 'undefined') {
	global.URLSearchParams = class URLSearchParams {
		private params: Map<string, string> = new Map();

		constructor(init?: string | Record<string, string>) {
			if (typeof init === 'string') {
				// Parse query string
				init.split('&').forEach(pair => {
					const [key, value] = pair.split('=');
					if (key) {
						this.params.set(decodeURIComponent(key), decodeURIComponent(value || ''));
					}
				});
			} else if (init) {
				Object.entries(init).forEach(([key, value]) => {
					this.params.set(key, value);
				});
			}
		}

		append(name: string, value: string) {
			this.params.set(name, value);
		}

		set(name: string, value: string) {
			this.params.set(name, value);
		}

		get(name: string) {
			return this.params.get(name);
		}

		has(name: string) {
			return this.params.has(name);
		}

		toString() {
			const pairs: string[] = [];
			this.params.forEach((value, key) => {
				pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
			});
			return pairs.join('&');
		}
	} as any;
}

// Mock Headers for fetch API
if (typeof global.Headers === 'undefined') {
	global.Headers = class Headers {
		private headers: Map<string, string> = new Map();

		constructor(init?: Record<string, string>) {
			if (init) {
				Object.entries(init).forEach(([key, value]) => {
					this.headers.set(key.toLowerCase(), value);
				});
			}
		}

		get(name: string) {
			return this.headers.get(name.toLowerCase());
		}

		set(name: string, value: string) {
			this.headers.set(name.toLowerCase(), value);
		}

		has(name: string) {
			return this.headers.has(name.toLowerCase());
		}

		append(name: string, value: string) {
			const existing = this.headers.get(name.toLowerCase());
			if (existing) {
				this.headers.set(name.toLowerCase(), `${existing}, ${value}`);
			} else {
				this.headers.set(name.toLowerCase(), value);
			}
		}
	} as any;
}