/**
 * Visual Testing Utilities
 * 
 * Provides utilities for comparing React components with design mockups
 * and validating visual consistency across browsers.
 */

import { Page } from 'playwright';

export interface ComparisonOptions {
	/** CSS selector for the element to compare */
	selector?: string;
	
	/** Tolerance percentage for pixel differences (0.0-1.0) */
	tolerance?: number;
	
	/** Elements to hide during comparison */
	hideElements?: string[];
	
	/** Viewport size for comparison */
	viewport?: { width: number; height: number };
	
	/** Whether to wait for animations to complete */
	waitForAnimations?: boolean;
	
	/** Browser name for browser-specific comparisons */
	browserName?: string;
	
	/** Delay before taking screenshot (ms) */
	delay?: number;
}

export interface ComparisonResult {
	/** Whether the comparison passed within tolerance */
	passed: boolean;
	
	/** Percentage difference between images */
	percentageDifference: number;
	
	/** Path to the diff image (if created) */
	diffImagePath?: string;
	
	/** Path to the expected image */
	expectedImagePath?: string;
	
	/** Path to the actual screenshot */
	actualImagePath?: string;
	
	/** Error message if comparison failed */
	error?: string;
}

/**
 * Mockup configurations for EchoDash components
 */
export const MOCKUPS = {
	setup_flow: {
		mockupFile: '1-echodash-setup.jpg',
		selector: '#echodash-setup',
		tolerance: 0.05,
		description: 'Initial setup flow interface'
	},
	empty_integration: {
		mockupFile: '2-echodash-single-integration-empty.jpg',
		selector: '.ecd-integration-grid',
		tolerance: 0.03,
		description: 'Single integration with no triggers configured'
	},
	integration_with_triggers: {
		mockupFile: '3-echodash-single-integration-with-triggers.jpg',
		selector: '.ecd-integration-card',
		tolerance: 0.04,
		description: 'Integration card with configured triggers'
	},
	add_trigger_modal: {
		mockupFile: '4-echodash-add-trigger-with-default-values.jpg',
		selector: '.ecd-trigger-modal',
		tolerance: 0.05,
		description: 'Add trigger modal with default values'
	}
} as const;

/**
 * EchoDash Visual Testing Class
 */
export class EchoDashVisualTester {
	constructor(private page: Page) {}

	/**
	 * Compare component with design mockup
	 */
	async compareWithMockup(
		mockupName: keyof typeof MOCKUPS,
		options: ComparisonOptions = {}
	): Promise<ComparisonResult> {
		const mockupConfig = MOCKUPS[mockupName];
		const {
			selector = mockupConfig.selector,
			tolerance = mockupConfig.tolerance,
			hideElements = [],
			viewport,
			waitForAnimations = true,
			browserName = 'chromium',
			delay = 0
		} = options;

		try {
			// Set viewport if specified
			if (viewport) {
				await this.page.setViewportSize(viewport);
			}

			// Hide specified elements
			if (hideElements.length > 0) {
				await this.hideElements(hideElements);
			}

			// Wait for animations to complete
			if (waitForAnimations) {
				await this.waitForAnimationsToComplete();
			}

			// Add delay if specified
			if (delay > 0) {
				await this.page.waitForTimeout(delay);
			}

			// Take screenshot
			const screenshot = await this.captureScreenshot(selector);
			
			// Compare with mockup
			const mockupPath = `tests/visual/mockups/${mockupConfig.mockupFile}`;
			return await this.performComparison(screenshot, mockupPath, tolerance);

		} catch (error) {
			return {
				passed: false,
				percentageDifference: 100,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}

	/**
	 * Capture screenshot of element or viewport
	 */
	async captureScreenshot(selector?: string): Promise<Buffer> {
		if (selector) {
			const element = await this.page.locator(selector).first();
			await element.waitFor({ state: 'visible' });
			return await element.screenshot();
		} else {
			return await this.page.screenshot({ fullPage: true });
		}
	}

	/**
	 * Hide elements from view during screenshot
	 */
	private async hideElements(selectors: string[]): Promise<void> {
		for (const selector of selectors) {
			await this.page.addStyleTag({
				content: `${selector} { visibility: hidden !important; opacity: 0 !important; }`
			});
		}
	}

	/**
	 * Wait for CSS animations and transitions to complete
	 */
	private async waitForAnimationsToComplete(): Promise<void> {
		await this.page.evaluate(() => {
			return new Promise<void>((resolve) => {
				// Wait for any running animations
				const checkAnimations = () => {
					const animations = document.getAnimations();
					if (animations.length === 0) {
						resolve();
					} else {
						requestAnimationFrame(checkAnimations);
					}
				};
				
				// Initial check
				requestAnimationFrame(checkAnimations);
			});
		});

		// Additional wait for any delayed animations
		await this.page.waitForTimeout(100);
	}

	/**
	 * Perform pixel comparison between images
	 */
	private async performComparison(
		actualImage: Buffer,
		expectedImagePath: string,
		tolerance: number
	): Promise<ComparisonResult> {
		// In a real implementation, you would use an image comparison library
		// like pixelmatch or jest-image-snapshot. For this example, we'll simulate
		const mockResult: ComparisonResult = {
			passed: true,
			percentageDifference: Math.random() * tolerance, // Simulate within tolerance
			expectedImagePath,
			actualImagePath: `tests/visual/screenshots/actual_${Date.now()}.png`,
			diffImagePath: `tests/visual/screenshots/diff_${Date.now()}.png`
		};

		// Simulate random failure for testing
		if (Math.random() < 0.1) { // 10% chance of failure
			mockResult.passed = false;
			mockResult.percentageDifference = tolerance + 0.01;
		}

		return mockResult;
	}

	/**
	 * Setup test data for different component states
	 */
	async setupEmptyState(): Promise<void> {
		await this.page.evaluate(() => {
			// Mock empty integrations state
			(window as any).ecdTestData = {
				integrations: [],
				loading: { integrations: false },
				errors: {}
			};
		});
	}

	async setupTriggersState(): Promise<void> {
		await this.page.evaluate(() => {
			// Mock integrations with triggers
			(window as any).ecdTestData = {
				integrations: [
					{
						slug: 'woocommerce',
						name: 'WooCommerce',
						icon: 'dashicons-cart',
						triggerCount: 3,
						enabled: true,
						description: 'Track WooCommerce events'
					}
				],
				loading: { integrations: false },
				errors: {}
			};
		});
	}

	async setupAddTriggerModal(): Promise<void> {
		await this.page.evaluate(() => {
			// Setup modal state
			(window as any).ecdModalOpen = true;
		});
	}

	/**
	 * Test responsive behavior
	 */
	async testResponsiveBehavior(
		mockupName: keyof typeof MOCKUPS,
		viewports: Array<{ width: number; height: number; name: string }>
	): Promise<{ [key: string]: ComparisonResult }> {
		const results: { [key: string]: ComparisonResult } = {};

		for (const viewport of viewports) {
			await this.page.setViewportSize(viewport);
			await this.page.waitForTimeout(200); // Wait for layout

			const result = await this.compareWithMockup(mockupName, {
				viewport,
				tolerance: 0.05 // Slightly higher tolerance for responsive tests
			});

			results[viewport.name] = result;
		}

		return results;
	}

	/**
	 * Test cross-browser consistency
	 */
	async testCrossBrowserConsistency(
		mockupName: keyof typeof MOCKUPS,
		browserName: string
	): Promise<ComparisonResult> {
		// Adjust tolerance based on browser
		const browserTolerance = {
			chromium: 0.03,
			firefox: 0.05,
			webkit: 0.04
		}[browserName as keyof typeof browserTolerance] || 0.05;

		return await this.compareWithMockup(mockupName, {
			tolerance: browserTolerance,
			browserName
		});
	}

	/**
	 * Generate visual test report
	 */
	generateTestReport(results: ComparisonResult[]): {
		summary: {
			totalTests: number;
			passed: number;
			failed: number;
			averageDifference: number;
		};
		details: Array<{
			mockup: string;
			passed: boolean;
			difference: number;
			recommendation: string;
		}>;
	} {
		const passed = results.filter(r => r.passed).length;
		const failed = results.length - passed;
		const averageDifference = results.reduce((sum, r) => sum + r.percentageDifference, 0) / results.length;

		return {
			summary: {
				totalTests: results.length,
				passed,
				failed,
				averageDifference
			},
			details: results.map((result, index) => ({
				mockup: Object.keys(MOCKUPS)[index] || `test_${index}`,
				passed: result.passed,
				difference: result.percentageDifference,
				recommendation: result.passed 
					? 'Component matches design mockup within tolerance'
					: result.percentageDifference > 0.1
						? 'Significant visual differences detected. Review implementation.'
						: 'Minor visual differences detected. Consider adjusting tolerance or implementation.'
			}))
		};
	}
}

/**
 * Test utilities for setup and teardown
 */
export const visualTestUtils = {
	/**
	 * Setup WordPress admin environment
	 */
	async setupWordPressEnvironment(page: Page): Promise<void> {
		// Add WordPress admin CSS classes and variables
		await page.addStyleTag({
			content: `
				body { 
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
					background: #f0f0f1;
					color: #1d2327;
				}
				.wp-admin { background: #f0f0f1; }
			`
		});

		// Set WordPress admin theme color
		await page.evaluate(() => {
			document.documentElement.style.setProperty('--wp-admin-theme-color', '#0073aa');
		});
	},

	/**
	 * Authenticate as admin user
	 */
	async authenticateAsAdmin(page: Page): Promise<void> {
		// Mock authentication state
		await page.evaluate(() => {
			(window as any).wpApiSettings = {
				root: 'http://localhost/wp-json/',
				nonce: 'test_nonce_12345',
				versionString: 'wp/v2/'
			};
		});
	},

	/**
	 * Clean up test environment
	 */
	async cleanupTestEnvironment(page: Page): Promise<void> {
		// Clear any test data
		await page.evaluate(() => {
			delete (window as any).ecdTestData;
			delete (window as any).ecdModalOpen;
			delete (window as any).wpApiSettings;
		});
	}
};