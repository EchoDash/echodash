/**
 * Jest Configuration for EchoDash React Tests
 *
 * Comprehensive Jest configuration with TypeScript support,
 * performance testing, and WordPress environment mocking.
 */

module.exports = {
	// Test environment
	testEnvironment: 'jsdom',

	// Setup files
	setupFilesAfterEnv: [
		'<rootDir>/assets/src/utils/test-utils.tsx',
		'<rootDir>/assets/tests/setup.ts',
	],

	// File extensions
	moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],

	// Transform configuration
	transform: {
		'^.+\\.(ts|tsx)$': [
			'ts-jest',
			{
				tsconfig: {
					jsx: 'react-jsx',
					esModuleInterop: true,
					allowSyntheticDefaultImports: true,
				},
			},
		],
		'^.+\\.(js|jsx)$': [
			'babel-jest',
			{
				presets: [
					'@babel/preset-env',
					['@babel/preset-react', { runtime: 'automatic' }],
				],
			},
		],
	},

	// Transform ignore patterns
	transformIgnorePatterns: [
		'node_modules/(?!(@wordpress|@testing-library)/)',
	],

	// Module mocking
	moduleNameMapping: {
		// Mock CSS and asset imports
		'\\.(css|less|scss|sass)$': 'identity-obj-proxy',
		'\\.(jpg|jpeg|png|gif|svg)$':
			'<rootDir>/assets/tests/__mocks__/fileMock.js',

		// Alias mappings
		'^@/(.*)$': '<rootDir>/assets/src/$1',
		'^@tests/(.*)$': '<rootDir>/assets/tests/$1',

		// WordPress component mocks
		'^@wordpress/(.*)$': '<rootDir>/assets/tests/__mocks__/wordpress/$1.js',
	},

	// Test match patterns
	testMatch: [
		'<rootDir>/assets/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
		'<rootDir>/assets/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
		'<rootDir>/assets/tests/**/*.{test,spec}.{js,jsx,ts,tsx}',
	],

	// Coverage configuration
	collectCoverage: true,
	collectCoverageFrom: [
		'assets/src/**/*.{js,jsx,ts,tsx}',
		'!assets/src/**/*.d.ts',
		'!assets/src/index.tsx',
		'!assets/src/**/__tests__/**',
		'!assets/src/**/*.test.{js,jsx,ts,tsx}',
		'!assets/src/**/*.spec.{js,jsx,ts,tsx}',
		'!assets/src/**/*.stories.{js,jsx,ts,tsx}',
	],

	// Coverage thresholds
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80,
		},
		// Specific thresholds for critical files
		'assets/src/utils/validation.ts': {
			branches: 90,
			functions: 90,
			lines: 90,
			statements: 90,
		},
		'assets/src/utils/performance.ts': {
			branches: 85,
			functions: 85,
			lines: 85,
			statements: 85,
		},
	},

	// Coverage reporters
	coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'json-summary'],

	// Coverage directory
	coverageDirectory: '<rootDir>/coverage',

	// Test timeout
	testTimeout: 10000,

	// Verbose output
	verbose: true,

	// Error handling
	errorOnDeprecated: true,

	// Watch plugins
	watchPlugins: [
		'jest-watch-typeahead/filename',
		'jest-watch-typeahead/testname',
	],

	// Global setup/teardown
	globalSetup: '<rootDir>/assets/tests/globalSetup.ts',
	globalTeardown: '<rootDir>/assets/tests/globalTeardown.ts',

	// Custom test environment options
	testEnvironmentOptions: {
		url: 'https://test.example.com/wp-admin/admin.php?page=echodash',
	},

	// Reporter configuration
	reporters: [
		'default',
		[
			'jest-html-reporters',
			{
				publicPath: './test-reports',
				filename: 'jest-report.html',
				expand: true,
				hideIcon: false,
			},
		],
		[
			'jest-junit',
			{
				outputDirectory: './test-reports',
				outputName: 'junit.xml',
				ancestorSeparator: ' › ',
				uniqueOutputName: 'false',
				suiteNameTemplate: '{filepath}',
				classNameTemplate: '{classname}',
				titleTemplate: '{title}',
			},
		],
	],

	// Cache configuration
	cacheDirectory: '<rootDir>/node_modules/.cache/jest',

	// Preset configuration for different test types
	projects: [
		{
			displayName: 'Unit Tests',
			testMatch: ['<rootDir>/assets/src/**/*.test.{js,jsx,ts,tsx}'],
			testEnvironment: 'jsdom',
		},
		{
			displayName: 'Integration Tests',
			testMatch: [
				'<rootDir>/assets/tests/integration/**/*.test.{js,jsx,ts,tsx}',
			],
			testEnvironment: 'jsdom',
		},
		{
			displayName: 'Performance Tests',
			testMatch: [
				'<rootDir>/assets/tests/performance/**/*.test.{js,jsx,ts,tsx}',
			],
			testEnvironment: 'jsdom',
			testTimeout: 30000,
		},
	],

	// Max workers for parallel execution
	maxWorkers: '50%',

	// Fail fast on first test failure in CI
	bail: process.env.CI ? 1 : 0,

	// Clear mocks between tests
	clearMocks: true,

	// Reset modules between tests
	resetModules: true,

	// Restore mocks between tests
	restoreMocks: true,
};
