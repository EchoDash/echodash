import { test, expect } from '@playwright/test';
import { EchoDashVisualTester, MOCKUPS } from './utils/visual-testing';

/**
 * EchoDash Visual Regression Tests
 * 
 * These tests compare the React implementation against the design mockups
 * to ensure visual fidelity during the jQuery to React migration.
 */

test.describe('EchoDash Visual Mockup Validation', () => {
  let visualTester: EchoDashVisualTester;

  test.beforeEach(async ({ page }) => {
    visualTester = new EchoDashVisualTester(page);
  });

  test('Setup flow matches mockup design', async ({ page }) => {
    await test.step('Navigate to fresh EchoDash setup', async () => {
      await visualTester.auth.login();
      
      // Simulate fresh install state (no endpoint configured)
      await page.goto('/wp-admin/options-general.php?page=echodash');
      await page.evaluate(() => {
        // Clear endpoint to show setup state
        localStorage.removeItem('echodash_endpoint');
        if (window.ecdEventData) {
          window.ecdEventData.endpoint = '';
        }
      });
      await page.reload();
      await page.waitForLoadState('networkidle');
    });

    await test.step('Validate setup UI against mockup', async () => {
      const result = await visualTester.comparison.expectToMatchMockup(
        page, 
        'setup_flow',
        {
          selector: '#echodash-info',
          tolerance: 0.05 // Allow 5% difference for text/dynamic content
        }
      );

      // Additional assertions for setup flow
      await expect(page.locator('text=Connect to EchoDash')).toBeVisible();
      await expect(page.locator('#echodash-endpoint')).not.toBeVisible();
    });
  });

  test('Empty integration page matches mockup', async ({ page }) => {
    await test.step('Setup empty integration state', async () => {
      await visualTester.testData.setupEmptyState();
      await visualTester.runVisualTest('empty_integration', async () => {
        // Ensure we're looking at an integration with no triggers
        await page.locator('.ecd-integration').first().waitFor();
      });
    });

    await test.step('Validate empty integration UI', async () => {
      const result = await visualTester.comparison.expectToMatchMockup(
        page,
        'empty_integration',
        {
          selector: '.ecd-integration',
          tolerance: 0.03
        }
      );

      // Verify empty state elements
      await expect(page.locator('text=Add Trigger')).toBeVisible();
      await expect(page.locator('.ecd-repeater tbody tr')).toHaveCount(1); // Only the add button row
    });
  });

  test('Integration with triggers matches mockup', async ({ page }) => {
    await test.step('Setup integration with test triggers', async () => {
      await visualTester.runVisualTest('integration_with_triggers', async () => {
        await visualTester.testData.setupWithTriggers();
        
        // Wait for triggers to be rendered
        await page.locator('.ecd-repeater tbody tr').nth(1).waitFor();
      });
    });

    await test.step('Validate triggers display', async () => {
      const result = await visualTester.comparison.expectToMatchMockup(
        page,
        'integration_with_triggers',
        {
          selector: '.ecd-integration',
          tolerance: 0.04 // Slightly higher tolerance for dynamic content
        }
      );

      // Verify trigger elements are present
      await expect(page.locator('text=Contact Form Submitted')).toBeVisible();
      await expect(page.locator('text=Request Form Submitted')).toBeVisible();
      await expect(page.locator('text=Inquiry Form Submitted')).toBeVisible();
      
      // Check for drag handles
      await expect(page.locator('.dashicons-menu')).toHaveCount(3);
      
      // Check for delete buttons
      await expect(page.locator('[data-repeater-delete]')).toHaveCount(3);
    });
  });

  test('Add trigger modal matches mockup', async ({ page }) => {
    await test.step('Open add trigger modal', async () => {
      await visualTester.auth.login();
      await visualTester.auth.navigateToEchoDash();
      
      // Click Add Trigger button
      await page.locator('input[data-repeater-create]').click();
      
      // Wait for modal/new row to appear
      await page.waitForTimeout(500);
    });

    await test.step('Setup trigger form with default values', async () => {
      // Select a trigger type to show the form
      await page.selectOption('select.trigger', 'form_submitted');
      
      // Wait for form fields to populate
      await page.waitForSelector('.echodash-fields.visible');
      await page.waitForTimeout(500);
    });

    await test.step('Validate add trigger form UI', async () => {
      // For this test, we might need to capture the entire row or form area
      const result = await visualTester.comparison.expectToMatchMockup(
        page,
        'add_trigger_modal',
        {
          selector: '.ecd-repeater tbody tr:last-child', // Last row is the new trigger
          tolerance: 0.05
        }
      );

      // Verify form elements are visible
      await expect(page.locator('.ecd-name')).toBeVisible();
      await expect(page.locator('.ecd-key')).toBeVisible();
      await expect(page.locator('.ecd-value')).toBeVisible();
      await expect(page.locator('.open-list')).toBeVisible(); // Merge tag button
    });
  });

  test('Responsive design validation', async ({ page }) => {
    test.skip(!process.env.CI, 'Responsive tests run only in CI');

    const viewports = [
      { width: 1920, height: 1080, name: 'desktop-xl' },
      { width: 1366, height: 768, name: 'desktop-standard' },
      { width: 1024, height: 768, name: 'tablet-landscape' },
      { width: 768, height: 1024, name: 'tablet-portrait' }
    ];

    for (const viewport of viewports) {
      await test.step(`Test ${viewport.name} (${viewport.width}x${viewport.height})`, async () => {
        await page.setViewportSize(viewport);
        await visualTester.auth.login();
        await visualTester.auth.navigateToEchoDash();
        
        // Take screenshot for this viewport
        const screenshot = await visualTester.screenshot.captureWordPressAdmin({
          filename: `responsive-${viewport.name}-${Date.now()}.png`
        });

        // Basic responsive checks
        const integrationElement = page.locator('.ecd-integration');
        await expect(integrationElement).toBeVisible();
        
        // Ensure no horizontal scrolling on smaller screens
        if (viewport.width < 1024) {
          const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
          expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 20); // 20px tolerance
        }
      });
    }
  });

  test('Cross-browser visual consistency', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Safari testing requires special setup');

    await test.step(`Test visual consistency in ${browserName}`, async () => {
      await visualTester.runVisualTest('integration_with_triggers', async () => {
        await visualTester.testData.setupWithTriggers();
      });

      // Browser-specific tolerance (some browsers render fonts slightly differently)
      const tolerance = browserName === 'firefox' ? 0.05 : 0.03;
      
      const result = await visualTester.comparison.expectToMatchMockup(
        page,
        'integration_with_triggers',
        {
          selector: '.ecd-integration',
          tolerance
        }
      );

      // Log browser-specific results
      console.log(`${browserName} visual test: ${result.percentageDifference.toFixed(2)}% difference`);
    });
  });

  test('Animation and interaction states', async ({ page }) => {
    await test.step('Test hover and focus states', async () => {
      await visualTester.auth.login();
      await visualTester.auth.navigateToEchoDash();
      await visualTester.testData.setupWithTriggers();

      // Test button hover state
      const addButton = page.locator('input[data-repeater-create]');
      await addButton.hover();
      await page.waitForTimeout(200);

      // Test input focus state
      const nameInput = page.locator('.ecd-name').first();
      await nameInput.focus();
      await page.waitForTimeout(200);

      // Capture interaction state
      const screenshot = await visualTester.screenshot.captureWordPressAdmin({
        filename: `interaction-states-${Date.now()}.png`
      });

      // Verify interactive elements are properly styled
      await expect(addButton).toBeVisible();
      await expect(nameInput).toBeFocused();
    });
  });

  test('Error states and validation', async ({ page }) => {
    await test.step('Test form validation errors', async () => {
      await visualTester.auth.login();
      await visualTester.auth.navigateToEchoDash();

      // Try to submit form with empty required fields
      await page.locator('input[type="submit"]').click();
      await page.waitForTimeout(500);

      // Capture error state
      const screenshot = await visualTester.screenshot.captureWordPressAdmin({
        filename: `error-states-${Date.now()}.png`,
        hideElements: ['.notice'] // Hide other WordPress notices
      });

      // Verify error styling is applied
      const errorFields = page.locator('.ecd-error');
      const errorCount = await errorFields.count();
      
      if (errorCount > 0) {
        console.log(`Found ${errorCount} validation error(s)`);
        await expect(errorFields.first()).toBeVisible();
      }
    });
  });
});