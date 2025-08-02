# EchoDash WordPress Plugin - Project Index

## Quick Navigation
- [Core Architecture](#core-architecture)
- [Plugin Integrations](#plugin-integrations)
- [API Reference](#api-reference)
- [Development Guide](#development-guide)
- [File Structure](#file-structure)

## Core Architecture

### Main Classes

| Class | File | Purpose |
|-------|------|---------|
| `EchoDash` | `echodash.php` | Main singleton class, plugin initialization |
| `EchoDash_Integration` | `includes/integrations/class-echodash-integration.php` | Abstract base class for all integrations |
| `EchoDash_Public` | `includes/public/class-echodash-public.php` | Public API for event tracking |
| `EchoDash_Admin` | `includes/admin/class-echodash-admin.php` | Admin interface management |

### Key Concepts

**Integrations**: Bridge between WordPress plugins and EchoDash analytics
- Each supported plugin has its own integration class
- Integrations extend the `EchoDash_Integration` base class
- Auto-loaded when dependency plugin is detected

**Event Tracking Flow**:
1. WordPress action fires → Integration method called
2. Integration calls `track_event($trigger, $objects)`
3. System retrieves configured events for trigger
4. Data collected using `get_{type}_vars` methods
5. Merge tags replaced with actual values
6. Events sent to EchoDash platform

**Settings Hierarchy**:
- **Global Settings**: Stored in `echodash_options` WordPress option
- **Post-Specific Settings**: Stored in `echodash_settings` post meta
- **Inheritance**: Post-specific settings override global settings

## Plugin Integrations

### E-Commerce Plugins

| Plugin | Integration Class | Triggers |
|--------|-------------------|----------|
| **WooCommerce** | `EchoDash_WooCommerce` | Order placed, Product purchased, Status changed |
| **Easy Digital Downloads** | `EchoDash_EDD` | Purchase completed, Download purchased |
| **Give Donations** | `EchoDash_Give` | Donation completed |
| **WooCommerce Subscriptions** | `EchoDash_Woo_Subscriptions` | Subscription created, Status changed |
| **EDD Recurring** | `EchoDash_EDD_Recurring` | Subscription created, Payment processed |

### Learning Management Systems

| Plugin | Integration Class | Triggers |
|--------|-------------------|----------|
| **LearnDash** | `EchoDash_LearnDash` | Course completed, Lesson completed, Quiz completed |
| **LifterLMS** | `EchoDash_LifterLMS` | Course enrollment, Course completion, Lesson completion |

### Community & Membership

| Plugin | Integration Class | Triggers |
|--------|-------------------|----------|
| **BuddyPress** | `EchoDash_BuddyPress` | Profile updated, Activity posted |
| **bbPress** | `EchoDash_bbPress` | Topic created, Reply posted |
| **GamiPress** | `EchoDash_GamiPress` | Achievement earned, Points awarded, Rank achieved |

### Forms & Lead Generation

| Plugin | Integration Class | Triggers |
|--------|-------------------|----------|
| **Gravity Forms** | `EchoDash_Gravity_Forms` | Form submitted, Entry created |

### Core WordPress

| Plugin | Integration Class | Triggers |
|--------|-------------------|----------|
| **WordPress Core** | `EchoDash_WordPress` | User registration, Post published, Comment posted |
| **User Management** | `EchoDash_User` | Profile updated, Role changed, Login/Logout |

### Specialized Plugins

| Plugin | Integration Class | Triggers |
|--------|-------------------|----------|
| **AffiliateWP** | `EchoDash_AffiliateWP` | Referral created, Commission earned |
| **Presto Player** | `EchoDash_Presto_Player` | Video watched, Progress updated |
| **Abandoned Cart** | `EchoDash_Abandoned_Cart` | Cart abandoned, Recovery email sent |

## API Reference

### Core Functions

#### `echodash_track_event($event_name, $values, $source, $trigger)`
Track a custom event directly.

**Parameters:**
- `$event_name` (string) - Name of the event
- `$values` (array) - Key-value pairs of event data
- `$source` (string) - Source integration name
- `$trigger` (string) - Trigger that fired the event

**Example:**
```php
echodash_track_event('custom_action', array(
    'user_id' => get_current_user_id(),
    'action_type' => 'button_click',
    'page_url' => $_SERVER['REQUEST_URI']
), 'custom', 'user_interaction');
```

#### `echodash_get_option($key, $default)`
Retrieve EchoDash plugin options.

**Parameters:**
- `$key` (string) - Option key
- `$default` (mixed) - Default value if option doesn't exist

#### `echodash_clean($data)`
Sanitize data recursively using WordPress sanitize_text_field.

### Integration Base Class Methods

#### Abstract Methods (Must Implement)

**`init()`** - Initialize integration hooks
**`setup_triggers()`** - Define available triggers

#### Data Source Methods (Optional)

**`get_{type}_options()`** - Define available fields for object type
**`get_{type}_vars($id)`** - Retrieve actual data for object ID

**Example:**
```php
public function get_product_options() {
    return array(
        'name' => __('Product', 'echodash'),
        'type' => 'product',
        'options' => array(
            array(
                'meta' => 'title',
                'preview' => 'Sample Product',
                'placeholder' => __('Product name', 'echodash'),
            ),
            array(
                'meta' => 'price',
                'preview' => '$99.99',
                'placeholder' => __('Product price', 'echodash'),
            ),
        ),
    );
}
```

### Event Tracking Methods

#### `track_event($trigger, $objects, $args)`
Main method for tracking events from integrations.

**Parameters:**
- `$trigger` (string) - Trigger identifier
- `$objects` (array) - Object IDs by type (e.g., ['user' => 123, 'order' => 456])
- `$args` (array) - Additional data to merge into event

### Hooks & Filters

#### Actions

**`echodash_track_event`** - Fires when an event is tracked
```php
do_action('echodash_track_event', $event_name, $event_data, $source, $trigger);
```

**`echodash_integrations_loaded`** - Fires after all integrations are loaded

#### Filters

**`echodash_event_data`** - Modify event data before sending
```php
add_filter('echodash_event_data', function($data, $objects) {
    // Modify $data array
    return $data;
}, 10, 2);
```

**`echodash_event_objects`** - Add custom objects to events
```php
add_filter('echodash_event_objects', function($objects, $trigger) {
    // Add additional objects
    return $objects;
}, 10, 2);
```

**`echodash_{integration}_triggers`** - Modify available triggers for integration

## Development Guide

### Adding New Integrations

1. **Create Integration Class**
   - Extend `EchoDash_Integration`
   - Place in `includes/integrations/{slug}/class-echodash-{slug}.php`

2. **Register Integration**
   - Add to `$integrations` array in `echodash.php`
   - Format: `'slug' => 'Dependency_Class'`

3. **Implement Required Methods**
   - `init()` - Add WordPress action/filter hooks
   - `setup_triggers()` - Define triggers and their properties

4. **Add Data Sources** (Optional)
   - `get_{type}_options()` - Available fields
   - `get_{type}_vars($id)` - Actual data retrieval

### Testing Integration

1. **Manual Testing**
   - Ensure dependency plugin is active
   - Configure events in WordPress admin
   - Trigger the action that should fire events
   - Verify events appear in EchoDash dashboard

2. **Quality Assurance**
   ```bash
   composer phpcs     # Code standards
   composer phpstan   # Static analysis
   composer test      # Unit tests
   ```

### Coding Standards

- **WordPress Coding Standards** with custom configurations
- **PHPStan Level 5** static analysis
- **Custom prefixes**: `ecd`, `EchoDash`
- **Text domain**: `echodash`
- **Sanitization**: Use `echodash_clean()` for user input

## File Structure

```
echodash/
├── echodash.php                    # Main plugin file
├── CLAUDE.md                       # Claude Code guidance
├── README.md                       # Project overview
├── composer.json                   # Dependencies & scripts
├── phpcs.xml                       # Code standards config
├── phpstan.neon                    # Static analysis config
├── assets/                         # Plugin assets
│   ├── echodash-admin.css
│   ├── echodash-admin.js
│   └── jquery-repeater/
├── includes/
│   ├── functions.php               # Global functions
│   ├── admin/                      # Admin interface
│   │   ├── class-echodash-admin.php
│   │   ├── admin-functions.php
│   │   └── option-page.php
│   ├── public/                     # Public API
│   │   └── class-echodash-public.php
│   └── integrations/               # Plugin integrations
│       ├── class-echodash-integration.php  # Base class
│       ├── wordpress/              # Core WordPress
│       ├── woocommerce/            # E-commerce
│       ├── learndash/              # LMS
│       ├── gravity-forms/          # Forms
│       └── [other-plugins]/
├── languages/                      # Translations
├── vendor/                         # Composer dependencies
└── node_modules/                   # Node.js dependencies
```

### Key Files by Function

**Core Plugin Logic:**
- `echodash.php` - Main plugin bootstrap
- `includes/functions.php` - Global utility functions
- `includes/integrations/class-echodash-integration.php` - Integration base class

**Event Tracking:**
- `includes/public/class-echodash-public.php` - Public event tracking API
- Individual integration files handle specific plugin events

**Admin Interface:**
- `includes/admin/class-echodash-admin.php` - Admin functionality
- `includes/admin/option-page.php` - Settings page
- `assets/echodash-admin.js` - Admin JavaScript

**Quality Assurance:**
- `phpcs.xml` - WordPress coding standards configuration
- `phpstan.neon` - Static analysis configuration
- `composer.json` - Development dependencies and scripts

## Configuration Files

### Composer Scripts
```json
{
  "test": "./vendor/bin/phpunit -c phpunit.xml",
  "phpstan": "./vendor/bin/phpstan analyse --memory-limit=2G",
  "phpcs": "./vendor/bin/phpcs --standard=phpcs.xml"
}
```

### PHPStan Configuration
- **Level 5** analysis
- WordPress and WooCommerce stubs loaded
- Custom bootstrap file for plugin context

### PHPCS Configuration
- **WordPress-Extra** standard
- **WordPress-Docs** for documentation
- Custom prefixes: `ecd`, `EchoDash`
- Custom sanitization functions registered