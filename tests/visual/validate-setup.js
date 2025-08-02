#!/usr/bin/env node

/**
 * EchoDash Visual Testing Setup Validator
 * 
 * This script validates that all dependencies and mockups are properly
 * configured for visual testing.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating EchoDash Visual Testing Setup...\n');

let errors = 0;
let warnings = 0;

function error(message) {
  console.log(`❌ ERROR: ${message}`);
  errors++;
}

function warning(message) {
  console.log(`⚠️  WARNING: ${message}`);
  warnings++;
}

function success(message) {
  console.log(`✅ ${message}`);
}

// Check package.json and dependencies
console.log('📦 Checking dependencies...');

const packageJsonPath = path.join(__dirname, '../../package.json');
if (!fs.existsSync(packageJsonPath)) {
  error('package.json not found in project root');
} else {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  const requiredDevDeps = [
    '@playwright/test',
    'pixelmatch',
    'pngjs',
    '@wordpress/scripts'
  ];
  
  const missingDeps = requiredDevDeps.filter(dep => 
    !packageJson.devDependencies || !packageJson.devDependencies[dep]
  );
  
  if (missingDeps.length > 0) {
    error(`Missing dependencies: ${missingDeps.join(', ')}`);
  } else {
    success('All required dependencies found');
  }
  
  // Check scripts
  const requiredScripts = ['test:visual', 'test:visual:update', 'test:visual:ui'];
  const missingScripts = requiredScripts.filter(script => 
    !packageJson.scripts || !packageJson.scripts[script]
  );
  
  if (missingScripts.length > 0) {
    warning(`Missing npm scripts: ${missingScripts.join(', ')}`);
  } else {
    success('All test scripts configured');
  }
}

// Check Playwright configuration
console.log('\n🎭 Checking Playwright configuration...');

const playwrightConfigPath = path.join(__dirname, 'playwright.config.ts');
if (!fs.existsSync(playwrightConfigPath)) {
  error('playwright.config.ts not found');
} else {
  success('Playwright configuration found');
}

// Check test utilities
console.log('\n🛠️ Checking test utilities...');

const utilsPath = path.join(__dirname, 'utils');
const requiredUtils = [
  'visual-testing.ts',
  'global-setup.ts', 
  'global-teardown.ts'
];

requiredUtils.forEach(util => {
  const utilPath = path.join(utilsPath, util);
  if (!fs.existsSync(utilPath)) {
    error(`Missing utility file: ${util}`);
  } else {
    success(`Found utility: ${util}`);
  }
});

// Check test files
console.log('\n🧪 Checking test files...');

const testFiles = [
  'echodash-mockups.spec.ts'
];

testFiles.forEach(testFile => {
  const testPath = path.join(__dirname, testFile);
  if (!fs.existsSync(testPath)) {
    error(`Missing test file: ${testFile}`);
  } else {
    success(`Found test file: ${testFile}`);
  }
});

// Check mockup files
console.log('\n🖼️ Checking mockup files...');

const mockupsPath = path.join(__dirname, '../../tmp/mockups');
const requiredMockups = [
  '1-echodash-setup.jpg',
  '2-echodash-single-integration-empty.jpg',
  '3-echodash-single-integration-with-triggers.jpg',
  '4-echodash-add-trigger-with-default-values.jpg'
];

if (!fs.existsSync(mockupsPath)) {
  warning('Mockups directory not found at tmp/mockups/');
} else {
  requiredMockups.forEach(mockup => {
    const mockupPath = path.join(mockupsPath, mockup);
    if (!fs.existsSync(mockupPath)) {
      warning(`Missing mockup file: ${mockup}`);
    } else {
      success(`Found mockup: ${mockup}`);
    }
  });
}

// Check directory structure
console.log('\n📁 Checking directory structure...');

const requiredDirs = [
  'tests/visual/utils',
  'tests/visual/screenshots', 
  'tests/visual/reports'
];

requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '../..', dir);
  if (!fs.existsSync(dirPath)) {
    warning(`Missing directory: ${dir}`);
    // Try to create it
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      success(`Created directory: ${dir}`);
    } catch (e) {
      error(`Failed to create directory: ${dir}`);
    }
  } else {
    success(`Found directory: ${dir}`);
  }
});

// Check Node.js and npm versions
console.log('\n🌟 Checking environment...');

const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  error(`Node.js ${nodeVersion} is too old. Requires Node.js 18+`);
} else {
  success(`Node.js ${nodeVersion} is compatible`);
}

// Try to check npm version
try {
  const { execSync } = require('child_process');
  const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
  success(`npm ${npmVersion} available`);
} catch (e) {
  warning('Could not check npm version');
}

// Check if playwright browsers are installed
try {
  const playwrightPath = path.join(__dirname, '../../node_modules/@playwright/test');
  if (fs.existsSync(playwrightPath)) {
    success('Playwright package installed');
    
    // Check if browsers are installed
    const browsersPath = path.join(require.resolve('@playwright/test'), '../../../.browsers');
    if (fs.existsSync(browsersPath)) {
      success('Playwright browsers appear to be installed');
    } else {
      warning('Playwright browsers may not be installed. Run: npx playwright install');
    }
  }
} catch (e) {
  warning('Could not verify Playwright installation');
}

// Summary
console.log('\n📊 Validation Summary:');
console.log(`   ✅ Successes: ${process.stdout._writes ? 'Multiple' : 'Unknown'}`);
console.log(`   ⚠️  Warnings: ${warnings}`);
console.log(`   ❌ Errors: ${errors}`);

if (errors === 0 && warnings === 0) {
  console.log('\n🎉 Perfect! Visual testing setup is fully configured.');
  console.log('\n🚀 Ready to run: npm run test:visual');
} else if (errors === 0) {
  console.log('\n👍 Good! Setup is functional with minor warnings.');
  console.log('   Fix warnings for optimal experience.');
  console.log('\n🚀 Ready to run: npm run test:visual');
} else {
  console.log('\n❌ Issues found! Please fix errors before running tests.');
  console.log('\n💡 Common fixes:');
  console.log('   - Run: npm install');
  console.log('   - Run: npx playwright install');
  console.log('   - Ensure mockup files are in tmp/mockups/');
  process.exit(1);
}

console.log('\n📖 For more help, see: tests/visual/README.md');