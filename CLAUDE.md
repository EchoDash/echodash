# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EchoDash is a WordPress plugin that tracks user events and interactions across WordPress sites. It acts as a bridge between WordPress plugins and the EchoDash analytics platform, providing real-time event tracking with support for 20+ WordPress plugins including WooCommerce, LearnDash, Gravity Forms, and more.

## React Conversion Progress

EchoDash is currently undergoing a **major architectural transformation** from a traditional jQuery-based WordPress admin interface to a modern React-based system. This conversion represents a significant modernization effort.

### Conversion Status: **Phase 6+ Complete**
- ✅ **React Foundation**: Complete React app setup with TypeScript
- ✅ **Build System**: Advanced webpack configuration with code splitting and performance optimization  
- ✅ **Component Architecture**: Well-structured React components with modern patterns
- ✅ **REST API**: Comprehensive WordPress REST API for React-backend communication
- ✅ **Testing Infrastructure**: Jest, Playwright, and visual testing setup
- ✅ **Performance Optimization**: Bundle analysis, compression, and caching strategies
- 🔄 **Progressive Migration**: Legacy jQuery system coexists with React system
- 📋 **Future**: Complete migration of all admin interfaces to React

## Core Architecture

The plugin now operates with a **dual architecture** supporting both legacy and modern systems:

### Modern React Architecture (Primary)
- **React App**: `assets/src/` - TypeScript React application with modern component structure
- **REST API**: `includes/admin/class-echodash-rest-api.php` - Comprehensive API for React-backend communication
- **React Integration**: `includes/admin/class-echodash-react-admin.php` - WordPress-React bridge with performance optimization
- **Build System**: `webpack.config.js` - Advanced webpack with code splitting, compression, and bundle analysis
- **Component Structure**:
  - `assets/src/components/` - Reusable UI components
  - `assets/src/hooks/` - Custom React hooks for data fetching and state management
  - `assets/src/services/` - API services and utilities
  - `assets/src/types/` - TypeScript type definitions

### Legacy PHP Architecture (Coexisting)
- **Main entry point**: `echodash.php` - Singleton pattern with integration management
- **Base classes**: All integrations extend `EchoDash_Integration` abstract class
- **Integration system**: Each plugin integration has its own class in `includes/integrations/`
- **Legacy Admin**: `includes/admin/class-echodash-admin.php` - Traditional PHP admin interface
- **Public API**: Event tracking handled through `EchoDash_Public` class
- **jQuery Interface**: `assets/echodash-admin.js` - Legacy JavaScript for backward compatibility

### Key Components

**Integration Base Class** (`includes/integrations/class-echodash-integration.php`):
- Abstract class that all plugin integrations extend
- Handles trigger setup, event tracking, and data mapping
- Provides meta box functionality for post-specific events
- Manages global vs. single event configurations

**Event System**:
- **Triggers**: Specific actions that can fire events (e.g., "order_completed")
- **Events**: What gets sent to EchoDash (event name + data mappings)
- **Objects**: Data sources for events (user, order, course, etc.)
- **Mappings**: Transform WordPress data into EchoDash event properties

**Settings Architecture**:
- Global settings stored in `echodash_options` option
- Post-specific settings stored in `echodash_settings` post meta
- Hierarchical: post-specific overrides global settings

## Development Commands

### Modern React Development
```bash
# Start React development server with hot reloading
npm run start
# or
npm run dev

# Build React application for production
npm run build

# Build with bundle analysis
npm run build:analyze

# Run all tests (unit, integration, visual)
npm run test:all

# Run specific test suites
npm run test:unit          # Jest unit tests
npm run test:integration   # Integration tests  
npm run test:visual        # Playwright visual tests
npm run test:e2e           # End-to-end tests

# Visual testing with Playwright
npm run test:visual:ui     # Interactive visual testing
npm run test:visual:update # Update visual baselines

# Code quality for React
npm run lint              # ESLint + Stylelint
npm run lint:js           # JavaScript/TypeScript linting
npm run lint:css          # CSS/SCSS linting
npm run format            # Prettier formatting
```

### Traditional PHP Quality Assurance  
```bash
# Run PHPUnit tests
composer test

# Static analysis with PHPStan (level 5)
composer phpstan

# Code style checking with PHPCS (WordPress standards)
composer phpcs

# Fix coding standard issues automatically
./vendor/bin/phpcbf --standard=phpcs.xml
```

### Code Standards

**React/TypeScript Standards**:
- TypeScript strict mode enabled
- ESLint with React and WordPress configurations  
- Prettier for code formatting
- Modern React patterns (hooks, functional components)
- WordPress component library integration

**PHP Standards**:
- WordPress Coding Standards with custom configurations
- PHPStan level 5 analysis
- Custom sanitization function `echodash_clean` registered
- Text domain: `echodash`
- Namespace prefixes: `ecd`, `EchoDash`

**Performance Standards**:
- Bundle size limits: 500KB per chunk
- Core Web Vitals optimization
- Asset compression and caching
- Code splitting for optimal loading

## Creating New Integrations

### Basic Integration Template
```php
class EchoDash_Your_Integration extends EchoDash_Integration {
    public $slug = 'your-integration';
    public $name = 'Your Integration Name';

    public function init() {
        // Add hooks for the plugin you're integrating
        add_action('your_plugin_action', array($this, 'handle_event'));
    }

    protected function setup_triggers() {
        return array(
            'trigger_name' => array(
                'name' => __('Human Readable Name', 'echodash'),
                'description' => __('When this happens...', 'echodash'),
                'has_global' => true,  // Global settings
                'has_single' => true,  // Per-post settings
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

### Integration Activation
Integrations are automatically loaded if their dependency is detected:
- Add to `$integrations` array in `echodash.php:255`
- Format: `'slug' => 'Dependency_Class_Or_Function'`
- File must be in `includes/integrations/slug/class-echodash-slug.php`

## REST API Integration

The React frontend communicates with WordPress through a comprehensive REST API:

### API Structure
- **Base URL**: `/wp-json/echodash/v1/`
- **Authentication**: WordPress nonces and capability checks
- **Endpoints**:
  - `GET/POST /settings` - Global plugin settings
  - `GET /integrations` - List all available integrations
  - `GET/PUT /integrations/{slug}` - Individual integration management
  - `GET/POST /integrations/{slug}/triggers` - Trigger management
  - `PUT/DELETE /integrations/{slug}/triggers/{trigger_id}` - Individual triggers
  - `POST /preview` - Generate event previews with merge tags
  - `POST /test-event` - Send test events to EchoDash

### Data Flow
1. **React Component** → API call via `fetch()` with WordPress nonces
2. **REST API Controller** → Validates permissions and sanitizes data
3. **WordPress Options/Database** → Stores configuration
4. **Integration Classes** → Process events using stored configuration
5. **EchoDash Service** → Sends events to analytics platform

### API Features
- **Caching**: Transient caching for expensive operations
- **Validation**: Comprehensive input sanitization and validation
- **Error Handling**: Structured error responses with proper HTTP status codes
- **Performance**: Optimized queries and data structures

## Important Patterns

### Modern Event Tracking Flow (React)
1. **User Configuration** → React UI updates settings via REST API
2. **Settings Storage** → WordPress options and database
3. **Event Trigger** → WordPress action fires integration method
4. **Event Processing** → Integration uses stored React-configured settings
5. **Data Collection** → Merge tags processed with actual data
6. **Event Dispatch** → Sent to EchoDash via `echodash()->public->track_event()`

### Legacy Event Tracking Flow (PHP)
1. WordPress action fires → Integration method called
2. Integration calls `$this->track_event($trigger, $objects)`
3. System gets configured events for trigger
4. Data is collected using `get_{type}_vars` methods
5. Merge tags like `{user:email}` are replaced with actual values
6. Events sent to EchoDash via `echodash()->public->track_event()`

### Data Mapping System
- **Objects**: Identify what data is available (user ID, post ID, etc.)
- **Option Types**: Define available fields for each object type
- **Merge Tags**: `{object_type:field_name}` format for dynamic data
- **Previews**: Show example data in admin interface

### Admin Interface

**React Interface (Modern)**:
- Responsive React components with WordPress design system
- Real-time event preview and testing
- Dynamic form generation based on integration capabilities
- Inline validation and error handling
- State management through React hooks and context
- TypeScript for type safety and developer experience

**Legacy Interface (Coexisting)**:
- Meta boxes added to relevant post types automatically
- jQuery handles dynamic event configuration
- Settings saved as serialized arrays in post meta
- Global settings managed through WordPress options

## Testing Strategy

### Modern React Testing
```bash
# Unit Testing with Jest
npm run test:unit           # Run all unit tests
npm run test:coverage       # Generate coverage report
npm run test:watch          # Watch mode for development

# Integration Testing
npm run test:integration    # API and component integration

# Visual Regression Testing with Playwright
npm run test:visual         # Run visual tests
npm run test:visual:ui      # Interactive visual testing
npm run test:visual:update  # Update visual baselines

# End-to-End Testing
npm run test:e2e           # Full user workflow testing
```

**Testing Structure**:
- **Unit Tests**: `assets/src/**/__tests__/` - Component and utility testing
- **Integration Tests**: `assets/tests/integration/` - API and data flow testing
- **Visual Tests**: `tests/visual/` - Screenshot-based UI testing
- **Mocks**: `assets/tests/__mocks__/` - WordPress and external service mocks

### Legacy PHP Testing
- **PHPUnit**: Traditional unit tests for PHP classes
- **Manual Testing**: Browser-based integration testing
- **Static Analysis**: PHPStan for code quality

### Manual Testing Workflow

**React Interface Testing**:
1. Start development server: `npm run dev`
2. Navigate to EchoDash settings page
3. Use React interface for configuration
4. Test API endpoints via browser network tab
5. Verify data persistence in WordPress admin

**Integration Testing**:
1. Create test integration class extending `EchoDash_Integration`
2. Add dependency check to main plugin file
3. Activate integration by ensuring dependency is available
4. Configure events via React interface (preferred) or legacy interface
5. Trigger the WordPress action that should fire events
6. Check EchoDash dashboard for received events

### Required Methods for New Integrations
- `init()` - Add WordPress hooks
- `setup_triggers()` - Define available triggers
- `get_{type}_options()` - Define available fields for data type
- `get_{type}_vars($id)` - Get actual data for object ID

## Performance Considerations

### React Application Performance
- **Bundle Splitting**: Vendor chunks and WordPress chunks separated for optimal caching
- **Code Splitting**: Dynamic imports for large components
- **Asset Optimization**: Gzip compression, image optimization, font loading strategies
- **Bundle Analysis**: Regular bundle size monitoring with webpack-bundle-analyzer
- **Performance Budgets**: 500KB limits per chunk with automated warnings
- **Caching**: Transient caching for API responses and expensive operations
- **Lazy Loading**: Components loaded on demand to reduce initial bundle size

### Legacy System Performance
- Events are sent via non-blocking HTTP requests
- Data collection only happens when events are configured
- Integration classes only loaded when their dependencies exist
- Meta boxes only added to relevant post types
- Settings cached appropriately through WordPress options API

### Modern Optimizations
- **API Caching**: REST API responses cached with transients
- **Asset Preloading**: Critical assets preloaded for faster initial rendering
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Memory Management**: Proper cleanup of event listeners and React components

## Migration Strategy & Dual System Approach

### Current State: **Progressive Enhancement**
The plugin currently operates with both systems active, allowing for:

- **Graceful Fallback**: Legacy jQuery interface as backup
- **Feature Parity**: Both systems can manage the same data
- **User Choice**: Administrators can use either interface
- **Risk Mitigation**: Critical functionality preserved during migration

### Migration Phases
1. ✅ **Phase 1-6**: React foundation, API, and core components completed
2. 🔄 **Current Phase**: Dual system operation and refinement
3. 📋 **Future Phases**: Complete migration of remaining interfaces
4. 📋 **Final Phase**: Legacy system removal after thorough testing

### Development Guidelines
- **React First**: New features should be built in React when possible
- **API Consistency**: All data changes must work through the REST API
- **Backward Compatibility**: Legacy PHP integrations must continue working
- **Progressive Enhancement**: Ensure functionality without JavaScript

### For Claude Code Agents
When working on EchoDash:
- **Prefer React**: For new admin features, use React components and TypeScript
- **Maintain PHP**: Keep integration classes and core event tracking in PHP
- **Use REST API**: All React-PHP communication goes through the REST API
- **Test Both Systems**: Ensure changes work with both legacy and modern interfaces
- **Follow Patterns**: Use existing component patterns and API structures

## Security Notes

### React Application Security
- **Input Validation**: All form inputs validated client-side and server-side
- **XSS Prevention**: React's built-in XSS protection plus input sanitization
- **CSRF Protection**: WordPress nonces on all API requests
- **Capability Checks**: User permissions verified on all endpoints
- **Data Sanitization**: All API inputs sanitized before database storage

### Legacy System Security
- All user input sanitized with `echodash_clean()` function
- Nonce verification on all admin form submissions
- Capability checks for admin functionality
- No direct file access - all files check `ABSPATH`
- Validated against WordPress and security coding standards

### API Security
- **Authentication**: WordPress REST API authentication with nonces
- **Authorization**: Capability checks (`manage_options`) on all endpoints
- **Input Validation**: Comprehensive sanitization and validation
- **Rate Limiting**: WordPress built-in rate limiting for REST API
- **Error Handling**: No sensitive information in error responses