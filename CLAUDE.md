# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EchoDash is a WordPress plugin that tracks user events and interactions across WordPress sites. It acts as a bridge between WordPress plugins and the EchoDash analytics platform, providing real-time event tracking with support for 20+ WordPress plugins including WooCommerce, LearnDash, Gravity Forms, and more.

## Core Architecture

### Plugin Structure
- **Main entry point**: `echodash.php` - Singleton pattern with integration management
- **Base classes**: All integrations extend `EchoDash_Integration` abstract class
- **Integration system**: Each plugin integration has its own class in `includes/integrations/`
- **Admin interface**: Separate admin classes in `includes/admin/`
- **Public API**: Event tracking handled through `EchoDash_Public` class

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

### Testing and Quality Assurance
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
- WordPress Coding Standards with custom configurations
- PHPStan level 5 analysis
- Custom sanitization function `echodash_clean` registered
- Text domain: `echodash`
- Namespace prefixes: `ecd`, `EchoDash`

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

## Important Patterns

### Event Tracking Flow
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
- Meta boxes added to relevant post types automatically
- JavaScript handles dynamic event configuration
- Settings saved as serialized arrays in post meta
- Global settings managed through WordPress options

## Testing Integration Development

### Manual Testing Workflow
1. Create test integration class extending `EchoDash_Integration`
2. Add dependency check to main plugin file
3. Activate integration by ensuring dependency is available
4. Configure events in WordPress admin (global or per-post)
5. Trigger the WordPress action that should fire events
6. Check EchoDash dashboard for received events

### Required Methods for New Integrations
- `init()` - Add WordPress hooks
- `setup_triggers()` - Define available triggers
- `get_{type}_options()` - Define available fields for data type
- `get_{type}_vars($id)` - Get actual data for object ID

## Performance Considerations

- Events are sent via non-blocking HTTP requests
- Data collection only happens when events are configured
- Integration classes only loaded when their dependencies exist
- Meta boxes only added to relevant post types
- Settings cached appropriately through WordPress options API

## Security Notes

- All user input sanitized with `echodash_clean()` function
- Nonce verification on all admin form submissions
- Capability checks for admin functionality
- No direct file access - all files check `ABSPATH`
- Validated against WordPress and security coding standards