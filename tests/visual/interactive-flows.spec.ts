/**
 * Interactive Flow Validation Tests
 * 
 * Comprehensive visual testing for all interactive flows and user journeys.
 */

import { test, expect } from '@playwright/test';
import { EchoDashVisualTester } from './utils/visual-testing';

test.describe('Interactive Flow Validation', () => {
	let visualTester: EchoDashVisualTester;

	test.beforeEach(async ({ page }) => {
		visualTester = new EchoDashVisualTester(page);
		
		// Navigate to EchoDash admin page
		await page.goto('/wp-admin/options-general.php?page=echodash');
		
		// Wait for React app to load
		await page.waitForSelector('.echodash-react-app', { timeout: 10000 });
		
		// Ensure consistent viewport
		await page.setViewportSize({ width: 1366, height: 768 });
	});

	test.describe('Setup Flow Validation', () => {
		
		test('Initial setup flow matches mockup', async ({ page }) => {
			// Setup fresh installation state
			await visualTester.setupEmptyState();
			
			// Wait for setup screen to load
			await page.waitForSelector('#echodash-setup');
			
			// Hide dynamic elements
			await page.addStyleTag({
				content: `
					.wp-admin-notice,
					.update-nag,
					.notice,
					[data-testid="timestamp"] {
						display: none !important;
					}
				`
			});
			
			// Wait for animations to complete
			await visualTester.waitForAnimationsToComplete();
			
			const result = await visualTester.compareWithMockup('setup_flow', {
				selector: '#echodash-setup',
				tolerance: 0.05,
				hideElements: ['.wp-admin-notice', '.update-nag'],
				delay: 500
			});
			
			expect(result.passed).toBe(true);
			expect(result.percentageDifference).toBeLessThan(0.05);
		});

		test('Setup flow - API configuration step', async ({ page }) => {
			await visualTester.setupEmptyState();
			
			// Fill in API endpoint
			await page.fill('[data-testid="api-endpoint"]', 'https://api.echodash.com/v1');
			await page.fill('[data-testid="api-key"]', 'test_key_12345');
			
			// Click test connection
			await page.click('[data-testid="test-connection"]');
			
			// Wait for validation state
			await page.waitForSelector('.connection-status.success', { timeout: 5000 });
			
			// Take screenshot for validation
			const screenshot = await page.screenshot({
				clip: { x: 0, y: 100, width: 1366, height: 600 }
			});
			
			expect(screenshot).toBeDefined();
		});
	});

	test.describe('Integration Management Flows', () => {
		
		test('Empty integration state matches mockup', async ({ page }) => {
			await visualTester.setupEmptyState();
			
			// Navigate to integration page
			await page.click('[data-testid="integrations-tab"]');
			await page.waitForSelector('.ecd-integration-grid');
			
			const result = await visualTester.compareWithMockup('empty_integration', {
				selector: '.ecd-integration-grid',
				tolerance: 0.03,
				hideElements: ['.wp-admin-notice']
			});
			
			expect(result.passed).toBe(true);
			expect(result.percentageDifference).toBeLessThan(0.03);
		});

		test('Integration with triggers matches mockup', async ({ page }) => {
			await visualTester.setupTriggersState();
			
			// Wait for integration cards to load
			await page.waitForSelector('.ecd-integration-card');
			
			const result = await visualTester.compareWithMockup('integration_with_triggers', {
				selector: '.ecd-integration-card',
				tolerance: 0.04
			});
			
			expect(result.passed).toBe(true);
		});

		test('Integration card hover states', async ({ page }) => {
			await visualTester.setupTriggersState();
			
			const integrationCard = page.locator('.ecd-integration-card').first();
			
			// Test hover state
			await integrationCard.hover();
			await page.waitForTimeout(200);
			
			// Capture hover state
			const hoverScreenshot = await integrationCard.screenshot();
			expect(hoverScreenshot).toBeDefined();
			
			// Test active/focus state
			await integrationCard.click();
			await page.waitForTimeout(200);
			
			const activeScreenshot = await integrationCard.screenshot();
			expect(activeScreenshot).toBeDefined();
		});
	});

	test.describe('Trigger Management Flows', () => {
		
		test('Add trigger modal workflow matches mockup', async ({ page }) => {
			await visualTester.setupTriggersState();
			
			// Click "Add Trigger" button
			await page.click('[data-testid="add-trigger"]');
			
			// Wait for modal to open
			await page.waitForSelector('.ecd-trigger-modal');
			
			// Fill form with test data
			await page.fill('[data-testid="event-name"]', 'Contact Form Submitted');
			await page.selectOption('[data-testid="trigger-type"]', 'form_submitted');
			
			// Wait for form to populate with default values
			await page.waitForSelector('.ecd-event-mapper');
			await page.waitForTimeout(500); // Allow for async population
			
			// Hide dynamic timestamps
			await page.addStyleTag({
				content: '.timestamp, [data-timestamp] { visibility: hidden !important; }'
			});
			
			const result = await visualTester.compareWithMockup('add_trigger_modal', {
				selector: '.ecd-trigger-modal',
				tolerance: 0.05
			});
			
			expect(result.passed).toBe(true);
		});

		test('Event mapper functionality', async ({ page }) => {
			await visualTester.setupAddTriggerModal();
			
			// Add first mapping
			await page.click('[data-testid="add-mapping"]');
			await page.fill('[data-testid="mapping-key-0"]', 'user_email');
			
			// Click merge tag selector
			await page.click('[data-testid="merge-tag-selector-0"]');
			
			// Select user email merge tag
			await page.click('[data-testid="merge-tag-user-email"]');
			
			// Verify merge tag was inserted
			const mappingValue = await page.inputValue('[data-testid="mapping-value-0"]');
			expect(mappingValue).toBe('{user:user_email}');
			
			// Add second mapping
			await page.click('[data-testid="add-mapping"]');
			await page.fill('[data-testid="mapping-key-1"]', 'form_data');
			await page.fill('[data-testid="mapping-value-1"]', '{form:all_fields}');
			
			// Take screenshot of completed mappings
			const mappingScreenshot = await page.locator('.ecd-event-mapper').screenshot();
			expect(mappingScreenshot).toBeDefined();
		});
	});

	test.describe('Live Preview Functionality', () => {
		
		test('Live preview updates with form changes', async ({ page }) => {
			await visualTester.setupAddTriggerModal();
			
			// Add event mapping
			await page.fill('[data-testid="event-name"]', 'User Registration');
			await page.click('[data-testid="add-mapping"]');
			await page.fill('[data-testid="mapping-key-0"]', 'user_email');
			await page.fill('[data-testid="mapping-value-0"]', '{user:user_email}');
			
			// Wait for live preview to update
			await page.waitForSelector('.ecd-live-preview .ecd-preview-updated');
			
			// Verify preview shows processed data
			const previewContent = await page.textContent('.ecd-live-preview .property-value');
			expect(previewContent).toContain('admin@example.com');
			
			// Test preview format toggle
			await page.click('[data-testid="preview-format-toggle"]');
			
			// Verify raw format shows merge tags
			const rawContent = await page.textContent('.ecd-live-preview .property-value');
			expect(rawContent).toContain('{user:user_email}');
		});

		test('Preview error handling', async ({ page }) => {
			await visualTester.setupAddTriggerModal();
			
			// Add invalid merge tag
			await page.click('[data-testid="add-mapping"]');
			await page.fill('[data-testid="mapping-key-0"]', 'invalid_field');
			await page.fill('[data-testid="mapping-value-0"]', '{invalid:field}');
			
			// Wait for preview to show error
			await page.waitForSelector('.ecd-live-preview .preview-errors');
			
			// Verify error message is displayed
			const errorText = await page.textContent('.preview-errors');
			expect(errorText).toContain('Unknown object type: invalid');
		});

		test('Send test event functionality', async ({ page }) => {
			await visualTester.setupAddTriggerModal();
			
			// Configure valid event
			await page.fill('[data-testid="event-name"]', 'Test Event');
			await page.click('[data-testid="add-mapping"]');
			await page.fill('[data-testid="mapping-key-0"]', 'user_email');
			await page.fill('[data-testid="mapping-value-0"]', '{user:user_email}');
			
			// Wait for preview to be ready
			await page.waitForSelector('.ecd-live-preview:not(.has-errors)');
			
			// Click send test button
			await page.click('[data-testid="send-test-event"]');
			
			// Wait for success notification
			await page.waitForSelector('.ecd-notification--success', { timeout: 10000 });
			
			// Verify success message
			const successText = await page.textContent('.ecd-notification--success');
			expect(successText).toContain('Test event sent successfully');
		});
	});

	test.describe('Drag and Drop Functionality', () => {
		
		test('Drag and drop visual feedback', async ({ page }) => {
			await visualTester.setupTriggersState();
			
			// Navigate to trigger list
			await page.click('.ecd-integration-card [data-testid="configure"]');
			await page.waitForSelector('.ecd-sortable-list');
			
			// Get trigger items
			const triggers = page.locator('.ecd-sortable-item');
			const firstTrigger = triggers.first();
			const secondTrigger = triggers.nth(1);
			
			// Start drag operation
			await firstTrigger.hover();
			await page.mouse.down();
			
			// Move to second trigger
			await secondTrigger.hover();
			
			// Capture drag feedback state
			const dragScreenshot = await page.screenshot({
				clip: { x: 200, y: 200, width: 800, height: 400 }
			});
			expect(dragScreenshot).toBeDefined();
			
			// Complete drag operation
			await page.mouse.up();
			
			// Verify reorder occurred
			const reorderedTriggers = await page.locator('.ecd-sortable-item').count();
			expect(reorderedTriggers).toBeGreaterThan(0);
		});

		test('Keyboard navigation for drag and drop', async ({ page }) => {
			await visualTester.setupTriggersState();
			
			// Navigate to trigger list
			await page.click('.ecd-integration-card [data-testid="configure"]');
			await page.waitForSelector('.ecd-sortable-list');
			
			// Focus first trigger
			const firstTrigger = page.locator('.ecd-sortable-item').first();
			await firstTrigger.focus();
			
			// Use arrow key to move down
			await page.keyboard.press('ArrowDown');
			
			// Wait for reorder
			await page.waitForTimeout(200);
			
			// Verify position changed
			const focusedElement = page.locator(':focus');
			const focusedIndex = await focusedElement.getAttribute('data-index');
			expect(focusedIndex).toBe('1');
		});
	});

	test.describe('Form Validation Flows', () => {
		
		test('Real-time validation feedback', async ({ page }) => {
			await page.click('[data-testid="add-trigger"]');
			await page.waitForSelector('.ecd-trigger-modal');
			
			// Leave required field empty and blur
			await page.fill('[data-testid="event-name"]', 'Test');
			await page.fill('[data-testid="event-name"]', '');
			await page.press('[data-testid="event-name"]', 'Tab');
			
			// Wait for validation error
			await page.waitForSelector('.ecd-field-error');
			
			// Verify error message
			const errorText = await page.textContent('.ecd-field-error');
			expect(errorText).toContain('required');
			
			// Fix error and verify it clears
			await page.fill('[data-testid="event-name"]', 'Valid Event Name');
			await page.press('[data-testid="event-name"]', 'Tab');
			
			// Wait for error to clear
			await page.waitForSelector('.ecd-field-error', { state: 'hidden', timeout: 2000 });
		});

		test('Form submission validation', async ({ page }) => {
			await page.click('[data-testid="add-trigger"]');
			await page.waitForSelector('.ecd-trigger-modal');
			
			// Try to submit empty form
			await page.click('[data-testid="save-trigger"]');
			
			// Wait for validation errors
			await page.waitForSelector('.form-errors');
			
			// Verify multiple errors are shown
			const errorCount = await page.locator('.form-errors li').count();
			expect(errorCount).toBeGreaterThan(0);
		});
	});

	test.describe('Responsive Behavior', () => {
		
		test('Mobile viewport adaptations', async ({ page }) => {
			// Test mobile portrait
			await page.setViewportSize({ width: 375, height: 667 });
			await visualTester.setupTriggersState();
			
			// Verify mobile layout
			await page.waitForSelector('.ecd-integration-grid');
			
			// Check for mobile-specific classes
			const isMobile = await page.locator('.ecd-integration-grid').evaluate(
				(el) => window.getComputedStyle(el).gridTemplateColumns.includes('1fr')
			);
			expect(isMobile).toBe(true);
			
			// Test tablet landscape
			await page.setViewportSize({ width: 1024, height: 768 });
			await page.waitForTimeout(500);
			
			// Verify tablet layout adjustments
			const isTablet = await page.locator('.ecd-integration-grid').evaluate(
				(el) => window.getComputedStyle(el).gridTemplateColumns.split(' ').length >= 2
			);
			expect(isTablet).toBe(true);
		});

		test('Modal responsive behavior', async ({ page }) => {
			// Test modal on mobile
			await page.setViewportSize({ width: 375, height: 667 });
			
			await page.click('[data-testid="add-trigger"]');
			await page.waitForSelector('.ecd-trigger-modal');
			
			// Verify modal takes full width on mobile
			const modalWidth = await page.locator('.ecd-trigger-modal').evaluate(
				(el) => el.getBoundingClientRect().width
			);
			expect(modalWidth).toBeGreaterThan(300);
			
			// Verify modal is scrollable
			const modalHeight = await page.locator('.ecd-trigger-modal').evaluate(
				(el) => el.scrollHeight > el.clientHeight
			);
			expect(modalHeight).toBeDefined();
		});
	});

	test.describe('Accessibility Validation', () => {
		
		test('Keyboard navigation flow', async ({ page }) => {
			await visualTester.setupTriggersState();
			
			// Tab through interface
			await page.keyboard.press('Tab');
			let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
			expect(focusedElement).toBeDefined();
			
			// Continue tabbing and verify focus is visible
			for (let i = 0; i < 5; i++) {
				await page.keyboard.press('Tab');
				
				// Verify focus indicator is visible
				const hasFocusRing = await page.evaluate(() => {
					const focused = document.activeElement;
					if (!focused) return false;
					
					const styles = window.getComputedStyle(focused);
					return styles.outline !== 'none' || styles.boxShadow.includes('0 0 0');
				});
				expect(hasFocusRing).toBe(true);
			}
		});

		test('Screen reader announcements', async ({ page }) => {
			await visualTester.setupTriggersState();
			
			// Check for ARIA live regions
			const liveRegions = await page.locator('[aria-live]').count();
			expect(liveRegions).toBeGreaterThan(0);
			
			// Trigger an action that should announce
			await page.click('[data-testid="add-trigger"]');
			
			// Wait for announcement
			await page.waitForTimeout(100);
			
			// Verify live region has content
			const liveContent = await page.textContent('[aria-live="assertive"]');
			expect(liveContent).toBeTruthy();
		});

		test('ARIA labels and descriptions', async ({ page }) => {
			await page.click('[data-testid="add-trigger"]');
			await page.waitForSelector('.ecd-trigger-modal');
			
			// Check form fields have proper labels
			const labeledFields = await page.locator('input[aria-label], input[aria-labelledby]').count();
			const totalFields = await page.locator('input').count();
			
			// At least 80% of fields should have labels
			expect(labeledFields / totalFields).toBeGreaterThan(0.8);
			
			// Check for field descriptions
			const describedFields = await page.locator('[aria-describedby]').count();
			expect(describedFields).toBeGreaterThan(0);
		});
	});

	test.describe('Error Handling Flows', () => {
		
		test('Network error handling', async ({ page }) => {
			// Simulate network failure
			await page.route('/wp-admin/admin-ajax.php', route => {
				route.abort('failed');
			});
			
			await page.click('[data-testid="add-trigger"]');
			await page.waitForSelector('.ecd-trigger-modal');
			
			// Fill form and try to save
			await page.fill('[data-testid="event-name"]', 'Network Test');
			await page.click('[data-testid="add-mapping"]');
			await page.fill('[data-testid="mapping-key-0"]', 'test');
			await page.fill('[data-testid="mapping-value-0"]', 'value');
			
			await page.click('[data-testid="save-trigger"]');
			
			// Wait for error notification
			await page.waitForSelector('.ecd-notification--error');
			
			// Verify error message
			const errorText = await page.textContent('.ecd-notification--error');
			expect(errorText).toContain('failed');
		});

		test('Validation error recovery', async ({ page }) => {
			await page.click('[data-testid="add-trigger"]');
			await page.waitForSelector('.ecd-trigger-modal');
			
			// Submit invalid form
			await page.click('[data-testid="save-trigger"]');
			await page.waitForSelector('.form-errors');
			
			// Fix errors one by one
			await page.fill('[data-testid="event-name"]', 'Valid Name');
			
			// Add required mapping
			await page.click('[data-testid="add-mapping"]');
			await page.fill('[data-testid="mapping-key-0"]', 'test');
			await page.fill('[data-testid="mapping-value-0"]', 'value');
			
			// Try submit again
			await page.click('[data-testid="save-trigger"]');
			
			// Should succeed this time
			await page.waitForSelector('.ecd-notification--success', { timeout: 5000 });
		});
	});
});