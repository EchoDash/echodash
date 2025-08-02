/**
 * Visual Component Validation Tests
 * 
 * Tests to validate EchoDash React components match design mockups.
 */

import { test, expect, Page } from '@playwright/test';
import { EchoDashVisualTester, visualTestUtils, MOCKUPS } from './utils/visual-testing';

let visualTester: EchoDashVisualTester;

test.describe('EchoDash Component Visual Validation', () => {
	
	test.beforeEach(async ({ page }) => {
		visualTester = new EchoDashVisualTester(page);
		
		// Setup WordPress admin environment
		await visualTestUtils.setupWordPressEnvironment(page);
		await visualTestUtils.authenticateAsAdmin(page);
		
		// Navigate to EchoDash admin page
		await page.goto('/wp-admin/options-general.php?page=echodash');
		
		// Wait for React app to load
		await page.waitForSelector('.echodash-dashboard', { timeout: 10000 });
	});

	test.afterEach(async ({ page }) => {
		await visualTestUtils.cleanupTestEnvironment(page);
	});

	test('IntegrationGrid empty state matches mockup', async ({ page }) => {
		// Setup empty integrations state
		await visualTester.setupEmptyState();
		await page.reload();
		await page.waitForSelector('.ecd-empty-state');
		
		const result = await visualTester.compareWithMockup('empty_integration', {
			hideElements: ['.wp-admin-notice', '.notice'],
			waitForAnimations: true,
			delay: 500
		});
		
		expect(result.passed).toBe(true);
		expect(result.percentageDifference).toBeLessThan(MOCKUPS.empty_integration.tolerance);
		
		if (!result.passed) {
			console.log(`Visual test failed: ${result.percentageDifference * 100}% difference`);
			console.log(`Expected: ${result.expectedImagePath}`);
			console.log(`Actual: ${result.actualImagePath}`);
			console.log(`Diff: ${result.diffImagePath}`);
		}
	});

	test('IntegrationCard with triggers matches mockup', async ({ page }) => {
		// Setup integration with triggers
		await visualTester.setupTriggersState();
		await page.reload();
		await page.waitForSelector('.ecd-integration-card');
		
		const result = await visualTester.compareWithMockup('integration_with_triggers', {
			hideElements: ['.wp-admin-notice', '.notice'],
			waitForAnimations: true
		});
		
		expect(result.passed).toBe(true);
		expect(result.percentageDifference).toBeLessThan(MOCKUPS.integration_with_triggers.tolerance);
	});

	test('Add trigger modal matches mockup', async ({ page }) => {
		// Setup trigger modal state
		await visualTester.setupTriggersState();
		await page.reload();
		await page.waitForSelector('.ecd-integration-card');
		
		// Click configure button to open modal
		await page.locator('.ecd-configure-button').first().click();
		await page.waitForSelector('.ecd-trigger-modal', { timeout: 5000 });
		
		const result = await visualTester.compareWithMockup('add_trigger_modal', {
			selector: '.ecd-trigger-modal',
			hideElements: ['.wp-admin-notice'],
			waitForAnimations: true,
			delay: 300
		});
		
		expect(result.passed).toBe(true);
		expect(result.percentageDifference).toBeLessThan(MOCKUPS.add_trigger_modal.tolerance);
	});

	test('Responsive behavior validation', async ({ page }) => {
		const viewports = [
			{ width: 1920, height: 1080, name: 'desktop-xl' },
			{ width: 1366, height: 768, name: 'desktop-standard' },
			{ width: 1024, height: 768, name: 'tablet-landscape' },
			{ width: 768, height: 1024, name: 'tablet-portrait' }
		];

		await visualTester.setupTriggersState();
		await page.reload();
		await page.waitForSelector('.ecd-integration-card');

		const results = await visualTester.testResponsiveBehavior('integration_with_triggers', viewports);

		// Validate each viewport
		for (const [viewport, result] of Object.entries(results)) {
			expect(result.passed, `Responsive test failed for ${viewport}`).toBe(true);
			expect(result.percentageDifference).toBeLessThan(0.05);
		}

		// Generate responsive test report
		console.log('Responsive Test Results:', results);
	});

	test('Cross-browser visual consistency', async ({ page, browserName }) => {
		await visualTester.setupTriggersState();
		await page.reload();
		await page.waitForSelector('.ecd-integration-card');

		const result = await visualTester.testCrossBrowserConsistency(
			'integration_with_triggers',
			browserName
		);

		expect(result.passed).toBe(true);
		
		// Log browser-specific results
		console.log(`${browserName} visual test: ${(result.percentageDifference * 100).toFixed(2)}% difference`);
	});

	test('Search and filter interactions', async ({ page }) => {
		// Setup multiple integrations for testing
		await page.evaluate(() => {
			(window as any).ecdTestData = {
				integrations: [
					{
						slug: 'woocommerce',
						name: 'WooCommerce',
						icon: 'dashicons-cart',
						triggerCount: 3,
						enabled: true,
						description: 'Track WooCommerce events'
					},
					{
						slug: 'gravity-forms',
						name: 'Gravity Forms',
						icon: 'dashicons-forms',
						triggerCount: 0,
						enabled: false,
						description: 'Track form submissions'
					}
				],
				loading: { integrations: false },
				errors: {}
			};
		});

		await page.reload();
		await page.waitForSelector('.ecd-integration-grid');

		// Test search functionality
		await page.fill('.ecd-integration-search input', 'WooCommerce');
		await page.waitForTimeout(300);

		// Verify filtered results
		const visibleCards = await page.locator('.ecd-integration-card:visible').count();
		expect(visibleCards).toBe(1);

		// Test filter functionality
		await page.selectOption('.ecd-status-filter select', 'active');
		await page.waitForTimeout(300);

		// Clear search to see filtered results
		await page.fill('.ecd-integration-search input', '');
		await page.waitForTimeout(300);

		const activeCards = await page.locator('.ecd-integration-card:visible').count();
		expect(activeCards).toBe(1);
	});

	test('Accessibility features validation', async ({ page }) => {
		await visualTester.setupTriggersState();
		await page.reload();
		await page.waitForSelector('.ecd-integration-card');

		// Test keyboard navigation
		await page.keyboard.press('Tab');
		const focusedElement = await page.evaluate(() => document.activeElement?.className);
		expect(focusedElement).toContain('ecd-');

		// Test ARIA attributes
		const gridElement = await page.locator('.ecd-integration-grid');
		const ariaLabel = await gridElement.getAttribute('aria-label');
		expect(ariaLabel).toContain('integration');

		// Test screen reader announcements (check for aria-live regions)
		const liveRegions = await page.locator('[aria-live]').count();
		expect(liveRegions).toBeGreaterThan(0);

		// Test role attributes
		const statusElements = await page.locator('[role="status"]').count();
		expect(statusElements).toBeGreaterThan(0);
	});

	test('Loading and error states', async ({ page }) => {
		// Test loading state
		await page.evaluate(() => {
			(window as any).ecdTestData = {
				integrations: [],
				loading: { integrations: true },
				errors: {}
			};
		});

		await page.reload();
		await page.waitForSelector('.ecd-loading-state, .skeleton');

		const loadingElements = await page.locator('.ecd-loading-state, .skeleton').count();
		expect(loadingElements).toBeGreaterThan(0);

		// Test error state
		await page.evaluate(() => {
			(window as any).ecdTestData = {
				integrations: [],
				loading: { integrations: false },
				errors: { integrations: 'Failed to load integrations' }
			};
		});

		await page.reload();
		await page.waitForSelector('.ecd-integration-grid-error');

		const errorNotice = await page.locator('.components-notice.is-error');
		expect(await errorNotice.count()).toBeGreaterThan(0);
	});

	test('Performance validation', async ({ page }) => {
		// Measure page load performance
		const navigationPromise = page.waitForLoadState('networkidle');
		await page.goto('/wp-admin/options-general.php?page=echodash');
		await navigationPromise;

		const performanceMetrics = await page.evaluate(() => {
			const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
			return {
				loadTime: navigation.loadEventEnd - navigation.loadEventStart,
				domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
				firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
			};
		});

		// Validate performance thresholds
		expect(performanceMetrics.loadTime).toBeLessThan(3000); // <3s load time
		expect(performanceMetrics.domContentLoaded).toBeLessThan(1000); // <1s DOM ready

		console.log('Performance Metrics:', performanceMetrics);
	});

	test('Generate comprehensive visual test report', async ({ page }) => {
		const testResults = [];

		// Run all visual tests
		const mockupTests = Object.keys(MOCKUPS) as Array<keyof typeof MOCKUPS>;
		
		for (const mockupName of mockupTests) {
			try {
				// Setup appropriate state for each test
				switch (mockupName) {
					case 'empty_integration':
						await visualTester.setupEmptyState();
						break;
					case 'integration_with_triggers':
						await visualTester.setupTriggersState();
						break;
					case 'add_trigger_modal':
						await visualTester.setupTriggersState();
						await page.reload();
						await page.waitForSelector('.ecd-configure-button');
						await page.locator('.ecd-configure-button').first().click();
						await page.waitForSelector('.ecd-trigger-modal');
						break;
				}

				if (mockupName !== 'add_trigger_modal') {
					await page.reload();
					await page.waitForTimeout(1000);
				}

				const result = await visualTester.compareWithMockup(mockupName);
				testResults.push(result);
			} catch (error) {
				testResults.push({
					passed: false,
					percentageDifference: 100,
					error: error instanceof Error ? error.message : 'Unknown error'
				});
			}
		}

		// Generate and log comprehensive report
		const report = visualTester.generateTestReport(testResults);
		
		console.log('Visual Test Report:', JSON.stringify(report, null, 2));
		
		// Validate overall test success
		expect(report.summary.passed).toBeGreaterThan(report.summary.failed);
		expect(report.summary.averageDifference).toBeLessThan(0.05);
	});
});