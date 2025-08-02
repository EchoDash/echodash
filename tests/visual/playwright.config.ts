import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for EchoDash visual testing
 * 
 * This config is specifically designed for WordPress admin interface testing
 * with visual regression capabilities against design mockups.
 */
export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'tests/visual/reports/html' }],
    ['json', { outputFile: 'tests/visual/reports/results.json' }],
    ['line']
  ],
  use: {
    baseURL: process.env.WP_BASE_URL || 'http://localhost:8888',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 }, // Standard WordPress admin viewport
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1366, height: 768 },
      },
    },
    // Responsive testing
    {
      name: 'desktop-xl',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'tablet-landscape',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 768 },
      },
    },
    {
      name: 'tablet-portrait',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
      },
    },
  ],

  // Global setup and teardown
  globalSetup: require.resolve('./utils/global-setup.ts'),
  globalTeardown: require.resolve('./utils/global-teardown.ts'),

  // Test timeout settings
  timeout: 30000,
  expect: {
    timeout: 10000,
    // Visual comparison threshold - 3% pixel difference allowed
    toHaveScreenshot: {
      threshold: 0.03,
    },
  },
});