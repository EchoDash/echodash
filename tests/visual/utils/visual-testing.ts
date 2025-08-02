import { Page, expect } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Visual testing utilities for EchoDash mockup comparisons
 */

export interface VisualComparisonResult {
  pixelDifference: number;
  percentageDifference: number;
  passed: boolean;
  diffImagePath?: string;
}

export interface MockupMapping {
  name: string;
  mockupFile: string;
  description: string;
  selector?: string;
  viewport?: { width: number; height: number };
}

/**
 * Available mockups for comparison
 */
export const MOCKUPS: Record<string, MockupMapping> = {
  setup_flow: {
    name: 'setup_flow',
    mockupFile: '1-echodash-setup.jpg',
    description: 'Initial plugin setup and connection',
    selector: '#echodash-info'
  },
  empty_integration: {
    name: 'empty_integration', 
    mockupFile: '2-echodash-single-integration-empty.jpg',
    description: 'Integration page with no triggers',
    selector: '.ecd-integration'
  },
  integration_with_triggers: {
    name: 'integration_with_triggers',
    mockupFile: '3-echodash-single-integration-with-triggers.jpg', 
    description: 'Integration page showing configured triggers',
    selector: '.ecd-integration'
  },
  add_trigger_modal: {
    name: 'add_trigger_modal',
    mockupFile: '4-echodash-add-trigger-with-default-values.jpg',
    description: 'Add trigger modal with form fields',
    selector: '.components-modal__content, [role="dialog"]'
  }
};

/**
 * WordPress admin authentication helper
 */
export class WordPressAuthHelper {
  constructor(private page: Page) {}

  async login(username: string = 'admin', password: string = 'admin') {
    await this.page.goto('/wp-admin');
    
    // Check if already logged in
    if (await this.page.locator('#wpadminbar').isVisible({ timeout: 2000 }).catch(() => false)) {
      return;
    }

    // Login flow
    await this.page.fill('#user_login', username);
    await this.page.fill('#user_pass', password);
    await this.page.click('#wp-submit');
    await this.page.waitForSelector('#wpadminbar');
  }

  async navigateToEchoDash() {
    await this.page.goto('/wp-admin/options-general.php?page=echodash');
    await this.page.waitForLoadState('networkidle');
  }
}

/**
 * Test data setup helper
 */
export class TestDataHelper {
  constructor(private page: Page) {}

  async setupEmptyState() {
    // Clear all existing triggers via WordPress REST API or direct manipulation
    await this.page.evaluate(() => {
      // Reset to empty state - this would integrate with your actual data clearing logic
      if (window.ecdEventData) {
        window.ecdEventData.triggers = {};
      }
    });
  }

  async setupWithTriggers() {
    // Load test triggers that match the mockup
    const testTriggers = {
      'gravity-forms': [
        {
          trigger: 'form_submitted',
          name: 'Contact Form Submitted',
          value: [
            { key: 'user_name', value: '{user:display_name}' },
            { key: 'user_id', value: '{user:ID}' }
          ]
        },
        {
          trigger: 'form_submitted', 
          name: 'Request Form Submitted',
          value: [
            { key: 'user_name', value: '{user:display_name}' },
            { key: 'user_id', value: '{user:ID}' }
          ]
        },
        {
          trigger: 'form_submitted',
          name: 'Inquiry Form Submitted', 
          value: [
            { key: 'user_name', value: '{user:display_name}' },
            { key: 'user_id', value: '{user:ID}' }
          ]
        }
      ]
    };

    await this.page.evaluate((triggers) => {
      if (window.ecdEventData) {
        window.ecdEventData.triggers = triggers;
      }
    }, testTriggers);
  }
}

/**
 * Visual comparison utility
 */
export class VisualComparison {
  private mockupsPath: string;
  private screenshotsPath: string;

  constructor() {
    this.mockupsPath = path.join(process.cwd(), 'tmp', 'mockups');
    this.screenshotsPath = path.join(process.cwd(), 'tests', 'visual', 'screenshots');
  }

  /**
   * Compare page screenshot with mockup
   */
  async compareWithMockup(
    page: Page,
    mockupKey: string,
    options: {
      selector?: string;
      tolerance?: number;
      saveDiff?: boolean;
    } = {}
  ): Promise<VisualComparisonResult> {
    const mockup = MOCKUPS[mockupKey];
    if (!mockup) {
      throw new Error(`Mockup ${mockupKey} not found`);
    }

    const tolerance = options.tolerance ?? 0.03;
    const mockupPath = path.join(this.mockupsPath, mockup.mockupFile);

    // Take screenshot
    const screenshotBuffer = options.selector 
      ? await page.locator(options.selector).screenshot()
      : await page.screenshot();

    // Load mockup
    if (!fs.existsSync(mockupPath)) {
      throw new Error(`Mockup file not found: ${mockupPath}`);
    }

    const mockupBuffer = fs.readFileSync(mockupPath);
    const mockupPng = PNG.sync.read(mockupBuffer);
    const screenshotPng = PNG.sync.read(screenshotBuffer);

    // Ensure same dimensions (resize if needed)
    const width = Math.min(mockupPng.width, screenshotPng.width);
    const height = Math.min(mockupPng.height, screenshotPng.height);

    // Create diff image
    const diffPng = new PNG({ width, height });
    
    const pixelDiff = pixelmatch(
      mockupPng.data,
      screenshotPng.data,
      diffPng.data,
      width,
      height,
      { 
        threshold: 0.1,
        alpha: 0.1,
        diffColor: [255, 0, 0],
        diffColorAlt: [0, 255, 0]
      }
    );

    const totalPixels = width * height;
    const percentageDifference = (pixelDiff / totalPixels) * 100;
    const passed = percentageDifference <= (tolerance * 100);

    let diffImagePath: string | undefined;
    if (options.saveDiff || !passed) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      diffImagePath = path.join(
        this.screenshotsPath,
        `diff-${mockupKey}-${timestamp}.png`
      );
      fs.writeFileSync(diffImagePath, PNG.sync.write(diffPng));
    }

    return {
      pixelDifference: pixelDiff,
      percentageDifference,
      passed,
      diffImagePath
    };
  }

  /**
   * Assert that screenshot matches mockup within tolerance
   */
  async expectToMatchMockup(
    page: Page,
    mockupKey: string,
    options: {
      selector?: string;
      tolerance?: number;
    } = {}
  ) {
    const result = await this.compareWithMockup(page, mockupKey, {
      ...options,
      saveDiff: true
    });

    expect(result.passed, 
      `Visual comparison failed for ${mockupKey}. ` +
      `Difference: ${result.percentageDifference.toFixed(2)}% ` +
      `(${result.pixelDifference} pixels). ` +
      `Tolerance: ${(options.tolerance ?? 0.03) * 100}%. ` +
      `Diff saved to: ${result.diffImagePath}`
    ).toBe(true);

    return result;
  }
}

/**
 * Screenshot utilities
 */
export class ScreenshotHelper {
  constructor(private page: Page) {}

  /**
   * Take screenshot with WordPress admin context
   */
  async captureWordPressAdmin(options: {
    selector?: string;
    hideElements?: string[];
    filename?: string;
  } = {}) {
    // Hide dynamic elements that can cause false positives
    const defaultHideElements = [
      '#wpadminbar .quicklinks', // Dynamic admin bar content
      '.notice', // Admin notices
      '.wp-admin-notice-area',
      '.updated',
      '.error',
      '.notice-success',
      '.notice-error',
      '#ecd-send-test', // Test buttons that might have changing states
      '.ecd-ring' // Animations
    ];

    const hideElements = [...defaultHideElements, ...(options.hideElements || [])];

    // Hide elements
    await this.page.addStyleTag({
      content: hideElements.map(selector => `${selector} { visibility: hidden !important; }`).join('\n')
    });

    // Wait for any animations to complete
    await this.page.waitForTimeout(500);

    // Take screenshot
    const screenshot = options.selector
      ? await this.page.locator(options.selector).screenshot()
      : await this.page.screenshot({ fullPage: true });

    if (options.filename) {
      const screenshotsPath = path.join(process.cwd(), 'tests', 'visual', 'screenshots');
      fs.writeFileSync(path.join(screenshotsPath, options.filename), screenshot);
    }

    return screenshot;
  }
}

/**
 * Main visual testing class that combines all utilities
 */
export class EchoDashVisualTester {
  public auth: WordPressAuthHelper;
  public testData: TestDataHelper;
  public comparison: VisualComparison;
  public screenshot: ScreenshotHelper;

  constructor(private page: Page) {
    this.auth = new WordPressAuthHelper(page);
    this.testData = new TestDataHelper(page);
    this.comparison = new VisualComparison();
    this.screenshot = new ScreenshotHelper(page);
  }

  /**
   * Complete visual test workflow
   */
  async runVisualTest(
    mockupKey: string,
    setupFunction?: () => Promise<void>,
    options: {
      selector?: string;
      tolerance?: number;
    } = {}
  ) {
    // Setup
    await this.auth.login();
    await this.auth.navigateToEchoDash();
    
    if (setupFunction) {
      await setupFunction();
    }

    // Wait for page to be ready
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);

    // Run comparison
    return await this.comparison.expectToMatchMockup(this.page, mockupKey, options);
  }
}