# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EchoDash is a production-ready WordPress plugin that tracks user events and interactions across WordPress sites. It serves as a bridge between WordPress plugins and the EchoDash analytics platform, providing real-time event tracking with support for 20+ WordPress plugins including WooCommerce, LearnDash, Gravity Forms, and more.

## Architecture Status: **Production-Ready Dual System**

EchoDash operates with a **sophisticated dual architecture** that combines modern React technology with traditional WordPress plugin functionality:

### React Application (Primary Interface) ✅ **Production Ready**
- **Modern TypeScript React**: Professional React 18 application with strict TypeScript configuration
- **Advanced Build System**: Webpack with code splitting, compression, and bundle analysis
- **Performance Optimized**: Bundle size monitoring (500KB limits), asset optimization, caching strategies
- **Professional Testing**: Jest + Playwright with comprehensive coverage and visual regression testing
- **Code Quality**: ESLint + Prettier + Stylelint with WordPress standards compliance

### WordPress Plugin Backend ✅ **Production Ready**
- **Robust PHP Architecture**: Traditional WordPress plugin with comprehensive integration system
- **REST API**: Complete WordPress REST API for React-backend communication
- **Quality Assurance**: PHPStan level 5, PHPCS with WordPress standards, PHPUnit testing
- **Legacy Support**: jQuery admin interface coexists for compatibility

## Core Architecture

### Modern React Frontend (Primary Interface)
**Location**: `assets/src/` - Professional TypeScript React application

**Build System**: `webpack.config.js`
- Advanced webpack configuration with code splitting and performance optimization
- Vendor chunk separation (`wordpress`, `vendors`) for optimal caching
- Gzip compression and bundle analysis for production
- Development server with hot module replacement
- Performance budgets and asset optimization

**Component Architecture**:
- `assets/src/components/` - Professional React components with TypeScript
- `assets/src/hooks/` - Custom React hooks for data fetching and state management  
- `assets/src/services/` - API services and utilities
- `assets/src/types/` - Comprehensive TypeScript type definitions

**Key Features**:
- Modern React patterns (hooks, functional components, context)
- WordPress component library integration
- Real-time event tracking and testing
- Dynamic form generation based on integration capabilities
- Professional error handling and user feedback

### WordPress Plugin Backend (API & Integration Engine)
**Main Entry**: `echodash.php` - Singleton pattern with integration management

**Core Components**:
- **Integration System**: `includes/integrations/` - Each plugin integration extends `EchoDash_Integration`
- **REST API**: `includes/admin/class-echodash-rest-api.php` - Comprehensive API for React frontend
- **React Bridge**: `includes/admin/class-echodash-react-admin.php` - WordPress-React integration layer
- **Event Tracking**: `includes/public/class-echodash-public.php` - Public event tracking system
- **Legacy Admin**: `includes/admin/class-echodash-admin.php` - Traditional PHP admin interface (coexisting)

## Development Commands

### React Development (Primary)
```bash
# Development server with hot reloading
npm run dev
# or
npm run start

# Production build with optimization
npm run build

# Build with bundle size analysis
npm run build:analyze

# Development workflow
npm run dev           # Start development server
npm run build        # Production build
npm run build:analyze # Build with bundle analysis report
```

### Testing Framework (Comprehensive)
```bash
# Complete testing suite
npm run test:all      # Run all test types

# Specific test types
npm run test         # Basic Jest unit tests  
npm run test:unit    # Unit tests only
npm run test:integration # Integration tests
npm run test:performance # Performance tests
npm run test:e2e     # End-to-end tests
npm run test:visual  # Playwright visual regression tests

# Test utilities
npm run test:watch   # Watch mode for development
npm run test:coverage # Generate coverage reports
npm run test:ci      # CI-optimized test run
npm run test:visual:ui    # Interactive visual test runner
npm run test:visual:update # Update visual baselines
```

### Code Quality (Professional Standards)
```bash
# Comprehensive linting
npm run lint         # ESLint + Stylelint
npm run lint:js      # JavaScript/TypeScript linting
npm run lint:css     # CSS/SCSS linting
npm run format       # Prettier code formatting

# WordPress tools
npm run makepot      # Generate translation files
npm run makejson     # Generate JSON translations
npm run plugin-zip   # Create plugin distribution package
```

### PHP Quality Assurance (Backend)
```bash
# PHPUnit testing
composer test

# Static analysis (PHPStan level 5)
composer phpstan

# WordPress coding standards
composer phpcs

# Auto-fix coding standards issues
composer phpcbf
# or
./vendor/bin/phpcbf --standard=phpcs.xml
```

## Code Quality Standards

### React/TypeScript Standards
- **TypeScript Strict Mode**: Complete type safety with strict configuration
- **ESLint Configuration**: React + WordPress + Accessibility rules
- **Code Formatting**: Prettier with WordPress-compatible settings (tabs, 80 width)
- **Component Standards**: Functional components, hooks, proper prop typing
- **Performance**: Bundle size monitoring, code splitting, lazy loading

### PHP Standards  
- **WordPress Coding Standards**: PHPCS with custom EchoDash configuration
- **Static Analysis**: PHPStan level 5 with WordPress stubs
- **Security**: Custom sanitization function `echodash_clean` registered
- **Naming**: Prefixes `echodash`, `EchoDash` for global functions and classes
- **Text Domain**: `echodash` for all translation strings

### Performance Standards
- **Bundle Limits**: 500KB per chunk with automated warnings
- **Core Web Vitals**: Optimized loading and rendering performance
- **Asset Optimization**: Image optimization, font loading strategies, compression
- **Caching**: Transient caching for API responses and expensive operations

## Testing Strategy

### React Testing (Jest + Testing Library)
**Configuration**: `jest.config.js` - Multi-project setup with comprehensive coverage

**Test Types**:
- **Unit Tests**: `assets/src/**/*.test.{js,jsx,ts,tsx}` - Component and utility testing
- **Integration Tests**: `assets/tests/integration/` - API and data flow testing  
- **Performance Tests**: `assets/tests/performance/` - Performance metrics and benchmarks

**Coverage Requirements**:
- **Global Thresholds**: 80% branches, functions, lines, statements
- **Critical Files**: Higher thresholds for validation and core utilities
- **Reporting**: HTML, LCOV, JSON reports with CI integration

**Features**:
- **WordPress Mocks**: Comprehensive WordPress environment mocking
- **Visual Testing**: Screenshot-based UI testing with Playwright
- **Watch Mode**: Development-friendly test watching
- **CI Integration**: Optimized for continuous integration

### End-to-End Testing (Playwright)
**Configuration**: Advanced Playwright setup for cross-browser testing

**Capabilities**:
- **Multi-Browser**: Chrome, Firefox, Safari, Edge testing
- **Visual Regression**: Automated screenshot comparison
- **Performance Monitoring**: Core Web Vitals and load time testing
- **User Simulation**: Real user interaction patterns and workflows

### PHP Testing (PHPUnit)
- **Unit Tests**: Traditional PHP unit testing for core functionality
- **WordPress Integration**: WordPress test environment setup
- **Static Analysis**: PHPStan with WordPress and WooCommerce stubs

## API Architecture

### REST API Integration
**Base URL**: `/wp-json/echodash/v1/`

**Key Endpoints**:
- **Settings**: `GET/POST /settings` - Global plugin configuration
- **Integrations**: `GET /integrations` - Available plugin integrations
- **Integration Management**: `GET/PUT /integrations/{slug}` - Individual integration settings
- **Trigger Management**: `GET/POST/PUT/DELETE /integrations/{slug}/triggers/` - Event trigger configuration
- **Event Testing**: `POST /test-event` - Send test events to EchoDash
- **Event Preview**: `POST /preview` - Generate event previews with merge tags

**Security**:
- **Authentication**: WordPress nonces and capability checks
- **Validation**: Comprehensive input sanitization and validation
- **Error Handling**: Structured error responses with proper HTTP status codes

### Data Flow
1. **React Configuration** → API calls with WordPress nonces
2. **REST API Validation** → Permission and data validation
3. **WordPress Storage** → Options and database persistence
4. **Event Processing** → Integration classes process configured events
5. **EchoDash Service** → Analytics platform event delivery

## Performance Optimization

### React Application Performance
- **Code Splitting**: Vendor chunks (`wordpress`, `vendors`) for optimal caching
- **Bundle Analysis**: Regular monitoring with `webpack-bundle-analyzer`
- **Asset Optimization**: Image optimization, font preloading, compression
- **Lazy Loading**: Component-level code splitting
- **Performance Budgets**: 500KB chunk limits with automated warnings

### Backend Performance
- **Transient Caching**: REST API responses and expensive operations cached
- **Non-blocking Requests**: Event tracking via asynchronous HTTP requests  
- **Conditional Loading**: Integration classes loaded only when dependencies exist
- **Database Optimization**: Efficient queries and proper indexing

### Build Optimization
- **Webpack Cache**: Filesystem caching for faster rebuilds
- **Compression**: Gzip compression for production assets
- **Source Maps**: Optimized source maps for debugging
- **Tree Shaking**: Dead code elimination for smaller bundles

## Integration Development

### Creating New Integrations
**Base Class**: All integrations extend `EchoDash_Integration`

```php
class EchoDash_Your_Integration extends EchoDash_Integration {
    public $slug = 'your-integration';
    public $name = 'Your Integration Name';

    public function init() {
        // WordPress hooks for the target plugin
        add_action('your_plugin_action', array($this, 'handle_event'));
    }

    protected function setup_triggers() {
        return array(
            'trigger_name' => array(
                'name' => __('Human Readable Name', 'echodash'),
                'description' => __('When this happens...', 'echodash'),
                'has_global' => true,
                'has_single' => true,
                'post_types' => array('post', 'product'),
                'option_types' => array('user', 'your_data_type'),
                'default_event' => array(
                    'name' => 'Default Event Name',
                    'mappings' => array(
                        'user_email' => '{user:user_email}',
                        'item_name' => '{your_data_type:name}',
                    ),
                ),
            ),
        );
    }

    // Data source methods
    public function get_your_data_type_options() { /* return available fields */ }
    public function get_your_data_type_vars($id) { /* return actual data */ }
}
```

**Integration Activation**:
- Add to `$integrations` array in `echodash.php:255`
- Format: `'slug' => 'Dependency_Class_Or_Function'`
- File location: `includes/integrations/slug/class-echodash-slug.php`

### Required Methods
- `init()` - WordPress hook registration
- `setup_triggers()` - Define available triggers and data mappings
- `get_{type}_options()` - Available fields for data type
- `get_{type}_vars($id)` - Actual data for object ID

## Development Best Practices

### React Development (Primary Focus)
- **React First**: New admin features built in React with TypeScript
- **Component Patterns**: Use existing component patterns and WordPress design system
- **State Management**: React hooks and context for state management
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Accessibility**: WCAG 2.1 AA compliance with jsx-a11y eslint rules

### PHP Development (Backend/Integrations)
- **Integration Classes**: All new integrations extend `EchoDash_Integration`
- **WordPress Standards**: Follow WordPress coding standards and security practices
- **API First**: All data changes work through the REST API
- **Backward Compatibility**: Maintain compatibility with existing integrations

### Documentation Standards
- Only use `@access` tags for non-public methods and properties
- Public methods and properties should not include `@access` tags
- **ALWAYS use `x.x.x` as the version placeholder for new code** - this makes it easy to update all new additions during release

**Class docblocks:**
```php
/**
 * Class description.
 *
 * @package EchoDash
 * @since x.x.x
 */
```

**Method docblocks:**
```php
/**
 * Method description.
 *
 * @since x.x.x
 *
 * @param  string $param Description.
 * @return mixed Description.
 */
```

**Property docblocks:**
```php
/**
 * Property description.
 *
 * @since x.x.x
 * @var string $property_name
 */
```

**Version Tagging Guidelines:**
- **New classes**: Use `@since x.x.x`
- **New methods**: Use `@since x.x.x`
- **New properties**: Use `@since x.x.x`
- **Modified existing code**: Keep existing `@since` tags unchanged
- **Before release**: Find and replace all `x.x.x` with the actual version number

### Performance Guidelines
- **Bundle Monitoring**: Regular bundle size analysis and optimization
- **API Optimization**: Efficient data structures and caching strategies
- **Database Queries**: Optimize WordPress database interactions
- **Asset Loading**: Optimize JavaScript and CSS loading strategies

### Testing Requirements
- **Unit Testing**: Minimum 80% code coverage for new React components
- **Integration Testing**: API endpoints thoroughly tested
- **E2E Testing**: Critical user workflows covered by Playwright tests
- **Visual Testing**: UI changes validated with visual regression tests

## Security Considerations

### React Application Security
- **XSS Prevention**: React's built-in protection plus input sanitization
- **CSRF Protection**: WordPress nonces on all API requests
- **Input Validation**: Client-side validation with server-side verification
- **Error Handling**: No sensitive information in error responses

### PHP Security
- **Input Sanitization**: Custom `echodash_clean()` function for all user input
- **Capability Checks**: `manage_options` capability required for admin functions
- **Nonce Verification**: WordPress nonces on all form submissions
- **SQL Injection Prevention**: Prepared statements and WordPress database methods

### API Security
- **Authentication**: WordPress REST API authentication with nonces
- **Authorization**: Proper capability checks on all endpoints
- **Rate Limiting**: WordPress built-in API rate limiting
- **Data Validation**: Comprehensive validation and sanitization

## Migration & Compatibility

### Dual System Architecture
The plugin currently supports both modern React and legacy jQuery interfaces:

**React Interface** (Primary):
- Modern TypeScript React application
- REST API communication
- Real-time event testing and preview
- Performance optimized

**Legacy Interface** (Coexisting):
- Traditional jQuery admin interface  
- Direct PHP form processing
- Backward compatibility
- Fallback functionality

### Development Strategy
- **React First**: New features developed in React when possible
- **API Consistency**: All data operations work through REST API
- **Legacy Support**: Maintain existing PHP integration functionality
- **Progressive Enhancement**: Ensure core functionality works without JavaScript

## Important Notes

### For Claude Code Development
- **Prefer React**: Use React components and TypeScript for new admin features
- **Maintain PHP**: Keep integration classes and event tracking in PHP
- **Use REST API**: All React-PHP communication through comprehensive REST API
- **Test Both Systems**: Ensure changes work with both React and legacy interfaces
- **Follow Patterns**: Use established component patterns and API structures

### Code Organization
- **React Components**: Organized by feature with comprehensive TypeScript typing
- **Integration Classes**: Each plugin integration in separate class file
- **API Endpoints**: RESTful design with proper HTTP methods and status codes
- **Testing**: Comprehensive test coverage across all layers of the application

### Performance Monitoring
- **Bundle Analysis**: Regular monitoring with automated size warnings
- **Performance Budgets**: Enforced limits with build-time warnings
- **Core Web Vitals**: Production performance monitoring
- **Database Performance**: Query optimization and caching strategies

This documentation reflects the current production-ready state of EchoDash with its sophisticated React-based architecture, comprehensive testing framework, and professional development practices.