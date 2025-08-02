import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Global setup for EchoDash visual testing
 * 
 * This runs once before all tests and handles:
 * - WordPress environment verification
 * - Test database setup
 * - Mockup file verification
 * - Screenshot directory preparation
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting EchoDash Visual Testing Setup...');

  // Create necessary directories
  const dirs = [
    'tests/visual/screenshots',
    'tests/visual/reports',
    'tests/visual/reports/html'
  ];

  for (const dir of dirs) {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  }

  // Verify mockup files exist
  const mockupsPath = path.join(process.cwd(), 'tmp', 'mockups');
  const requiredMockups = [
    '1-echodash-setup.jpg',
    '2-echodash-single-integration-empty.jpg', 
    '3-echodash-single-integration-with-triggers.jpg',
    '4-echodash-add-trigger-with-default-values.jpg'
  ];

  console.log('🖼️  Verifying mockup files...');
  for (const mockup of requiredMockups) {
    const mockupPath = path.join(mockupsPath, mockup);
    if (!fs.existsSync(mockupPath)) {
      console.warn(`⚠️  Warning: Mockup file missing: ${mockup}`);
    } else {
      console.log(`✅ Found mockup: ${mockup}`);
    }
  }

  // Test WordPress connection
  const baseURL = config.projects[0].use.baseURL;
  if (baseURL) {
    console.log(`🔗 Testing WordPress connection: ${baseURL}`);
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      await page.goto(`${baseURL}/wp-admin`, { timeout: 10000 });
      console.log('✅ WordPress admin accessible');
      
      // Check if EchoDash plugin is active
      await page.goto(`${baseURL}/wp-admin/options-general.php?page=echodash`);
      const title = await page.title();
      if (title.includes('EchoDash') || title.includes('Settings')) {
        console.log('✅ EchoDash plugin is accessible');
      } else {
        console.warn('⚠️  EchoDash plugin may not be active');
      }
    } catch (error) {
      console.error('❌ WordPress connection failed:', error);
      throw new Error(`Cannot connect to WordPress at ${baseURL}`);
    } finally {
      await browser.close();
    }
  }

  // Create test environment info file
  const envInfo = {
    timestamp: new Date().toISOString(),
    baseURL: baseURL,
    mockupsFound: requiredMockups.filter(mockup => 
      fs.existsSync(path.join(mockupsPath, mockup))
    ),
    nodeVersion: process.version,
    playwrightVersion: require('@playwright/test/package.json').version
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'tests', 'visual', 'reports', 'env-info.json'),
    JSON.stringify(envInfo, null, 2)
  );

  console.log('✅ Global setup complete!');
  console.log('📊 Environment info saved to tests/visual/reports/env-info.json');
}

export default globalSetup;