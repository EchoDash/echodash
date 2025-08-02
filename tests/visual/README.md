# EchoDash Visual Testing

This directory contains the visual testing infrastructure for the EchoDash React migration project. It uses Playwright for browser automation and Pixelmatch for visual comparison against design mockups.

## 🎯 Purpose

Visual tests ensure that the new React implementation matches the approved design mockups pixel-perfectly during the jQuery to React migration process.

## 📁 Structure

```
tests/visual/
├── utils/
│   ├── visual-testing.ts      # Core visual testing utilities
│   ├── global-setup.ts        # Test environment setup
│   └── global-teardown.ts     # Cleanup and reporting
├── screenshots/               # Generated screenshots and diffs
├── reports/                   # HTML and JSON test reports
├── echodash-mockups.spec.ts   # Main visual test suite
├── playwright.config.ts       # Playwright configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## 🖼️ Mockup Mapping

The tests compare against these design mockups located in `tmp/mockups/`:

| Test Scenario | Mockup File | Description |
|---------------|-------------|-------------|
| `setup_flow` | `1-echodash-setup.jpg` | Initial plugin setup and connection |
| `empty_integration` | `2-echodash-single-integration-empty.jpg` | Integration page with no triggers |
| `integration_with_triggers` | `3-echodash-single-integration-with-triggers.jpg` | Integration page showing configured triggers |
| `add_trigger_modal` | `4-echodash-add-trigger-with-default-values.jpg` | Add trigger modal with form fields |

## 🚀 Quick Start

### Prerequisites

1. WordPress development environment running
2. EchoDash plugin activated
3. Node.js 18+ installed
4. All npm packages installed (`npm install`)

### Running Tests

```bash
# Run all visual tests
npm run test:visual

# Run in UI mode for debugging
npm run test:visual:ui

# Update baseline screenshots
npm run test:visual:update

# Run specific test
npx playwright test --config=tests/visual/playwright.config.ts -g "Setup flow"
```

### Environment Setup

Set these environment variables:

```bash
# WordPress base URL (default: http://localhost:8888)
export WP_BASE_URL=http://your-wp-site.local

# WordPress admin credentials (default: admin/admin)
export WP_USERNAME=admin
export WP_PASSWORD=password
```

## 🔧 Configuration

### Tolerance Settings

Visual comparison tolerance can be adjusted:

- **Default**: 3% pixel difference allowed
- **Setup flow**: 5% (more dynamic content)
- **Form interactions**: 4% (user input variations)

### Viewport Testing

Tests run across multiple viewports:

- **Desktop XL**: 1920×1080
- **Desktop Standard**: 1366×768 (default)
- **Tablet Landscape**: 1024×768
- **Tablet Portrait**: 768×1024

### Browser Coverage

- Chrome (primary)
- Firefox
- Safari/WebKit
- Edge

## 📊 Understanding Results

### Test Reports

After running tests, check these locations:

- **HTML Report**: `tests/visual/reports/html/index.html`
- **JSON Results**: `tests/visual/reports/results.json`
- **Summary**: `tests/visual/reports/summary.json`
- **Environment Info**: `tests/visual/reports/env-info.json`

### Screenshot Analysis

When tests fail, diff images are generated in `tests/visual/screenshots/`:

- **Naming**: `diff-{mockup-key}-{timestamp}.png`
- **Colors**: Red = removed pixels, Green = added pixels
- **Tolerance**: Highlighted differences that exceed threshold

### Interpreting Failures

Common failure causes and solutions:

#### High Pixel Difference (>5%)
- **Cause**: Major layout or styling changes
- **Solution**: Review implementation against mockup, adjust design

#### Font Rendering Issues (1-3%)
- **Cause**: Cross-browser font rendering differences
- **Solution**: Use web fonts, increase tolerance for font-heavy areas

#### Dynamic Content (2-4%)
- **Cause**: Timestamps, user-specific data, animations
- **Solution**: Hide dynamic elements, use test data fixtures

#### Color Variations (<1%)
- **Cause**: Browser color profile differences
- **Solution**: Use CSS color profiles, adjust tolerance

## 🛠️ Development Workflow

### Adding New Tests

1. **Create test data setup**:
   ```typescript
   await visualTester.testData.setupCustomState();
   ```

2. **Define mockup mapping**:
   ```typescript
   const newMockup = {
     name: 'new_feature',
     mockupFile: 'new-feature-mockup.jpg',
     description: 'New feature description',
     selector: '.new-feature-container'
   };
   ```

3. **Write test**:
   ```typescript
   test('New feature matches mockup', async ({ page }) => {
     await visualTester.runVisualTest('new_feature', async () => {
       // Setup specific to this test
     });
   });
   ```

### Debugging Failed Tests

1. **Run in UI mode**:
   ```bash
   npm run test:visual:ui
   ```

2. **Check diff images**:
   ```bash
   open tests/visual/screenshots/diff-*.png
   ```

3. **Adjust tolerance if needed**:
   ```typescript
   { tolerance: 0.05 } // 5% tolerance
   ```

4. **Hide problematic elements**:
   ```typescript
   await visualTester.screenshot.captureWordPressAdmin({
     hideElements: ['.dynamic-element']
   });
   ```

### Updating Baselines

When design changes are intentional:

```bash
# Update all baselines
npm run test:visual:update

# Update specific test
npx playwright test --update-snapshots -g "Integration with triggers"
```

## 🧪 Testing Utilities

### EchoDashVisualTester

Main testing class with utilities:

```typescript
const visualTester = new EchoDashVisualTester(page);

// Authentication
await visualTester.auth.login();
await visualTester.auth.navigateToEchoDash();

// Test data setup
await visualTester.testData.setupEmptyState();
await visualTester.testData.setupWithTriggers();

// Visual comparison
await visualTester.comparison.expectToMatchMockup(page, 'setup_flow');

// Screenshots
await visualTester.screenshot.captureWordPressAdmin({
  selector: '.ecd-integration',
  hideElements: ['.notice']
});
```

### WordPress Integration

Tests include WordPress-specific helpers:

- **Login automation** with admin credentials
- **Plugin state management** for consistent testing
- **Admin notice hiding** to avoid false positives
- **WordPress theme compatibility** validation

## 📈 Performance Considerations

### Optimization Tips

1. **Parallel execution**: Tests run in parallel by default
2. **Screenshot caching**: Reuse screenshots when possible
3. **Selective testing**: Use `test.only()` during development
4. **Cleanup automation**: Old screenshots auto-deleted (keeps last 50)

### CI/CD Integration

For automated testing:

```yaml
# GitHub Actions example
- name: Run Visual Tests
  run: |
    npm run test:visual
    
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: visual-test-results
    path: tests/visual/reports/
```

## 🚨 Troubleshooting

### Common Issues

#### WordPress Not Accessible
```
❌ WordPress connection failed
```
**Solution**: Check `WP_BASE_URL` and ensure WordPress is running

#### Missing Mockups
```
⚠️ Warning: Mockup file missing: 1-echodash-setup.jpg
```
**Solution**: Ensure mockup files are in `tmp/mockups/` directory

#### Plugin Not Active
```
⚠️ EchoDash plugin may not be active
```
**Solution**: Activate plugin in WordPress admin or check plugin path

#### High Memory Usage
```
JavaScript heap out of memory
```
**Solution**: Reduce parallel workers or increase Node.js memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run test:visual
```

### Debug Mode

Enable verbose logging:

```bash
DEBUG=pw:api npm run test:visual
```

### Support

For issues with visual testing setup:

1. Check test reports in `tests/visual/reports/`
2. Review environment info in `env-info.json`
3. Examine diff images for specific failures
4. Adjust tolerance settings if needed
5. Use UI mode for interactive debugging

## 🎯 Success Criteria

Visual tests pass when:

- ✅ Pixel difference < 3% (configurable)
- ✅ No layout shifts or broken elements
- ✅ Cross-browser consistency maintained
- ✅ Responsive design validated
- ✅ Interactive states properly styled

This ensures the React implementation maintains visual fidelity with the approved designs throughout the migration process.