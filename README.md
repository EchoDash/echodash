[![EchoDash Banner](assets/banner-1544x500.jpg)](https://echodash.com)

# EchoDash for WordPress

Track user events and interactions across your WordPress site with EchoDash analytics. Built for developers and site owners who need detailed insights into user behavior across multiple WordPress plugins.

## Features

- 🔌 **Plugin Integrations**: Ready-made tracking for popular WordPress plugins
- 🚀 **Performance Focused**: Non-blocking API calls and minimal overhead
- 🛠 **Developer Friendly**: Extensible architecture for custom integrations
- 🎯 **Flexible Events**: Track any data point with customizable event properties
- 🔄 **Real-time Updates**: Events appear instantly in your EchoDash dashboard
- 🔒 **Secure**: All data is transmitted over HTTPS

## Requirements

- WordPress 6.0+
- PHP 7.4+

## Installation

1. Download the latest release from [GitHub Releases](../../releases/latest)
2. Upload to wp-content/plugins/
3. Activate through WordPress admin
4. Connect to EchoDash in Settings → EchoDash

## Development Setup

### Prerequisites

- Node.js 18+ and npm 8+
- PHP 7.4+ (tested up to PHP 8.2)
- Composer
- WordPress development environment

### Quick Start

1. **Clone and Install Dependencies**
   ```bash
   git clone https://github.com/yourusername/echodash.git
   cd echodash
   
   # Install PHP dependencies
   composer install
   
   # Install Node.js dependencies
   npm install
   ```

2. **Start Development**
   ```bash
   # Start React development server with hot reloading
   npm run dev
   # or
   npm run start
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

### Development Commands

#### React Development (Primary Interface)
```bash
npm run dev           # Start development server with hot reloading
npm run build         # Production build with optimization
npm run build:analyze # Build with bundle size analysis
```

#### Testing (Comprehensive Test Suite)
```bash
# Run all tests
npm run test:all      # Complete test suite (unit + integration + e2e)

# Individual test types
npm run test          # Basic Jest unit tests
npm run test:unit     # Unit tests only
npm run test:integration # API integration tests
npm run test:performance # Performance benchmarks
npm run test:e2e      # End-to-end Playwright tests
npm run test:visual   # Visual regression tests

# Test utilities
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage reports
npm run test:ci       # CI-optimized test run (used in GitHub Actions)
```

#### Code Quality
```bash
# Linting and formatting
npm run lint          # ESLint + Stylelint
npm run lint:js       # JavaScript/TypeScript linting
npm run lint:css      # CSS/SCSS linting
npm run format        # Prettier code formatting

# PHP quality checks
composer phpcs        # WordPress coding standards
composer phpcbf       # Auto-fix coding standards
composer phpstan      # Static analysis (PHPStan level 5)
```

#### Automated Quality Checks
```bash
# Run the same checks as CI
./bin/run-checks.sh   # Complete local quality check suite
```

### Understanding Test Results

#### JavaScript Tests (Jest)
- **Coverage Reports**: Generated in `/coverage/` folder
- **Test Reports**: HTML reports in `/test-reports/jest-report.html`
- **Coverage Thresholds**: 80% minimum (branches, functions, lines, statements)
- **Test Files**: `*.test.{js,jsx,ts,tsx}` in `assets/src/` and `assets/tests/`

**Interpreting Results:**
```bash
# Example successful output
✅ Test Suites: 15 passed, 15 total
✅ Tests: 89 passed, 89 total
✅ Coverage: 85.2% lines, 81.4% branches
```

#### PHP Tests (Static Analysis; optional PHPUnit)
- **PHPStan**: Level 5 static analysis with WordPress stubs
- **PHPCS**: WordPress coding standards compliance
- **PHPUnit**: Traditional PHP unit testing (optional; not configured by default in v2)

**Common Issues:**
- **PHPStan warnings** about third-party plugins are normal
- **PHPCS errors** must be fixed (warnings are acceptable)
- **Coverage** reports help identify untested code paths

#### Visual Regression Tests (Playwright)
```bash
npm run test:visual        # Run visual tests
npm run test:visual:update # Update visual baselines
npm run test:visual:ui     # Interactive test runner
```

### Performance Monitoring

#### Bundle Analysis
```bash
npm run build:analyze
# Opens bundle-report.html showing:
# - Bundle sizes and dependencies
# - Performance recommendations
# - Code splitting effectiveness
```

#### Performance Budgets
- **500KB maximum** per chunk (enforced at build time)
- **Core Web Vitals** monitoring in production
- **Bundle splitting** for WordPress components and vendors

### Continuous Integration

Our GitHub Actions workflow runs:

1. **PHP Quality Checks** (multiple PHP versions 7.4-8.2)
   - WordPress coding standards (PHPCS)
   - Static analysis (PHPStan)
   - Compatibility checks

2. **JavaScript Quality Checks**
   - ESLint + Stylelint
   - Code formatting (Prettier)
   - License compliance
   - Engine compatibility

3. **Comprehensive Testing**
   - Jest unit/integration tests
   - Playwright E2E tests
   - Visual regression tests
   - Multiple WordPress versions (6.0-6.4)

4. **Security & Compatibility**
   - Composer security audit
   - npm security audit
   - PHP compatibility checks
   - WordPress compatibility verification

5. **Build Verification**
   - Production build test
   - Bundle size analysis
   - Plugin ZIP creation

### Troubleshooting

#### Common Development Issues

**Build Errors:**
```bash
# Clear caches and reinstall
rm -rf node_modules vendor coverage test-reports
npm install && composer install
npm run build
```

**Test Failures:**
```bash
# Update test snapshots if UI changed
npm run test:visual:update

# Check for missing WordPress mocks
# See assets/tests/__mocks__/wordpress/ for available mocks
```

**PHP Issues:**
```bash
# Fix coding standards automatically
composer phpcbf

# Check PHPStan with more detail
composer phpstan -- --verbose
```

#### Performance Issues
- **Large bundles**: Check `bundle-report.html` after `npm run build:analyze`
- **Slow tests**: Run specific test suites instead of all tests
- **Memory issues**: PHPStan has 2GB memory limit configured

### File Structure

```
echodash/
├── assets/
│   ├── src/                 # React TypeScript source code
│   ├── tests/               # Jest test files and mocks
│   └── dist/                # Built assets (auto-generated)
├── includes/
│   ├── integrations/        # PHP integration classes
│   ├── admin/               # WordPress admin functionality
│   └── public/              # Public-facing functionality
├── tests/                   # PHP tests (if implemented)
├── bin/                     # Development scripts
│   └── run-checks.sh        # Local CI simulation
├── .github/workflows/       # GitHub Actions CI/CD
├── webpack.config.js        # Build configuration
├── jest.config.js           # Test configuration
├── phpcs.xml                # PHP coding standards
└── composer.json            # PHP dependencies
```

## Creating Custom Integrations

### 1. Basic Integration Structure

Create a new file in `includes/integrations/your-integration/class-echodash-your-integration.php`:

```php
class EchoDash_Your_Integration extends EchoDash_Integration {
    
    public $slug = 'your-integration';
    public $name = 'Your Integration Name';

    public function init() {
        // Add your action/filter hooks here
        add_action( 'your_plugin_event', array( $this, 'handle_event' ) );
    }

    protected function setup_triggers() {
        return array(
            'event_happened' => array(
                'name'               => __( 'Event Happened', 'echodash' ),
                'description'        => __( 'Triggered when your event occurs.', 'echodash' ),
                'has_global'         => true, // Show in global settings
                'has_single'         => true, // Show on individual posts/items
                'post_types'         => array( 'post', 'your-cpt' ),
                'option_types'       => array( 'user', 'your_data' ),
                'enabled_by_default' => true,
                'default_event'      => array(
                    'name'     => 'Your Event',
                    'mappings' => array(
                        'user_email' => '{user:user_email}',
                        'item_name'  => '{your_data:name}',
                    ),
                ),
            ),
        );
    }

    public function handle_event( $event_data ) {
        $this->track_event(
            'event_happened',
            array(
                'user'      => get_current_user_id(),
                'your_data' => $event_data->id,
            )
        );
    }
}

new EchoDash_Your_Integration();
```

### 2. Adding Custom Data Sources

Define what data is available for event tracking:

```php
public function get_your_data_options() {
    return array(
        'name'    => __( 'Your Data', 'echodash' ),
        'type'    => 'your_data',
        'options' => array(
            array(
                'meta'        => 'name',
                'preview'     => 'Example Name',
                'placeholder' => __( 'The item name', 'echodash' ),
            ),
            array(
                'meta'        => 'value',
                'preview'     => '100',
                'placeholder' => __( 'The item value', 'echodash' ),
            ),
        ),
    );
}

public function get_your_data_vars( $item_id ) {
    $item = get_your_item( $item_id );
    
    return array(
        'your_data' => array(
            'name'  => $item->name,
            'value' => $item->value,
        ),
    );
}
```

### 3. Tracking Events

```php
// Simple event tracking
echodash_track_event( 'event_name', array(
    'key' => 'value',
) );

// Full event tracking with source and trigger
echodash_track_event(
    'purchase_completed',
    array(
        'total' => $order_total,
        'items' => $items,
    ),
    'your-integration',
    'order_completed'
);
```

### 4. Available Hooks

#### Actions

```php
/**
 * Fires when an event is being tracked.
 * 
 * @param string $event_name    The name of the event being tracked
 * @param array  $event_data    The data being sent with the event
 * @param string $source        The integration/source name (e.g., 'WooCommerce')
 * @param string $trigger       The trigger name (e.g., 'order_completed')
 */
do_action( 'echodash_track_event', $event_name, $event_data, $source, $trigger );

// Example usage:
add_action( 'echodash_track_event', function( $event_name, $event_data, $source, $trigger ) {
    // Log events to a file
    if ( 'purchase_completed' === $event_name ) {
        error_log( sprintf(
            'EchoDash Event: %s from %s (%s) with data: %s',
            $event_name,
            $source,
            $trigger,
            wp_json_encode( $event_data )
        ) );
    }
}, 10, 4 );
```

#### Filters

```php
// Modify event data before sending
add_filter( 'echodash_event_data', function( $data, $objects ) {
    return $data;
}, 10, 2 );

// Add custom objects to events
add_filter( 'echodash_event_objects', function( $objects, $trigger ) {
    return $objects;
}, 10, 2 );

// Modify available triggers
add_filter( 'echodash_your-integration_triggers', function( $triggers ) {
    return $triggers;
} );
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

- Documentation: https://echodash.com/docs/integrations/wordpress/
- Support: https://echodash.com/support/
- Issues: [Create a GitHub issue](../../issues/new)

## License

GPL v3 or later