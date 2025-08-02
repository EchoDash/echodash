# EchoDash API Reference

## Table of Contents
- [Core Functions](#core-functions)
- [Integration Base Class](#integration-base-class)
- [Event System](#event-system)
- [Data Sources](#data-sources)
- [Hooks & Filters](#hooks--filters)
- [Settings Management](#settings-management)

## Core Functions

### `echodash_track_event($event_name, $values, $source, $trigger)`

Track a custom event directly to EchoDash.

**Parameters:**
- `$event_name` (string) - The name of the event to track
- `$values` (array) - Key-value pairs of event data
- `$source` (string|bool) - Source integration name (optional)
- `$trigger` (string|bool) - Trigger that fired the event (optional)

**Return:** (mixed) Result from the public track_event method

**Example:**
```php
// Simple event tracking
echodash_track_event('user_action', array(
    'action_type' => 'button_click',
    'user_id' => get_current_user_id(),
    'page_url' => $_SERVER['REQUEST_URI']
));

// Event with source and trigger
echodash_track_event(
    'purchase_completed',
    array(
        'total' => 99.99,
        'product_id' => 123,
        'customer_email' => 'user@example.com'
    ),
    'WooCommerce',
    'order_completed'
);
```

### `echodash_get_option($key, $default_value)`

Retrieve EchoDash plugin options with fallback support.

**Parameters:**
- `$key` (string) - The option key to retrieve
- `$default_value` (mixed) - Default value if option doesn't exist

**Return:** (mixed) The option value or default

**Special Cases:**
- `'endpoint'` - Retrieved from separate `echodash_endpoint` option
- Other keys - Retrieved from `echodash_options` array

**Example:**
```php
$api_endpoint = echodash_get_option('endpoint');
$debug_mode = echodash_get_option('debug_mode', false);
```

### `echodash_clean($data)`

Recursively sanitize data using WordPress `sanitize_text_field()`.

**Parameters:**
- `$data` (string|array) - Data to sanitize

**Return:** (string|array) Sanitized data

**Usage:**
```php
$clean_data = echodash_clean($_POST['user_input']);
$clean_array = echodash_clean(array(
    'name' => 'John <script>',
    'email' => 'john@example.com'
));
```

## Integration Base Class

### Abstract Class: `EchoDash_Integration`

Base class that all plugin integrations must extend.

#### Required Properties
```php
public $slug = 'integration-slug';     // Unique identifier
public $name = 'Integration Name';     // Human-readable name
```

#### Abstract Methods (Must Implement)

##### `protected function init()`
Initialize the integration by adding WordPress hooks.

**Example:**
```php
public function init() {
    add_action('woocommerce_payment_complete', array($this, 'order_completed'));
    add_action('user_register', array($this, 'user_registered'));
}
```

##### `protected function setup_triggers()`
Define available triggers and their configuration.

**Return:** (array) Triggers configuration array

**Trigger Configuration:**
```php
protected function setup_triggers() {
    return array(
        'trigger_id' => array(
            'name'               => __('Human Readable Name', 'echodash'),
            'description'        => __('When this trigger fires...', 'echodash'),
            'has_global'         => true,        // Show in global settings
            'has_single'         => true,        // Show on individual posts
            'post_types'         => array('post', 'product'), // Applicable post types
            'option_types'       => array('user', 'order'),   // Available data sources
            'enabled_by_default' => false,       // Default state
            'default_event'      => array(       // Default configuration
                'name'     => 'Default Event Name',
                'mappings' => array(
                    'user_email' => '{user:user_email}',
                    'order_id'   => '{order:id}',
                ),
            ),
        ),
    );
}
```

#### Core Methods

##### `track_event($trigger, $objects, $args)`
Track an event for the current integration.

**Parameters:**
- `$trigger` (string) - Trigger identifier
- `$objects` (array) - Object IDs by type (e.g., `['user' => 123, 'order' => 456]`)
- `$args` (array) - Additional data to merge into event (optional)

**Example:**
```php
public function order_completed($order_id) {
    $this->track_event(
        'order_completed',
        array(
            'user'  => get_current_user_id(),
            'order' => $order_id,
        ),
        array(
            'order' => array(
                'completion_time' => current_time('mysql'),
            ),
        )
    );
}
```

##### `get_triggers()`
Get all configured triggers for the integration.

**Return:** (array) Filtered triggers array

##### `get_events($trigger, $post_id)`
Retrieve configured events for a specific trigger.

**Parameters:**
- `$trigger` (string) - Trigger identifier
- `$post_id` (int|bool) - Post ID for single events, false for global

**Return:** (array) Array of configured events

## Event System

### Event Configuration Structure

Events are configured with the following structure:
```php
array(
    'name'    => 'Event Name',           // Display name in EchoDash
    'trigger' => 'trigger_id',           // Associated trigger
    'value'   => array(                  // Data mappings
        array(
            'key'   => 'property_name',
            'value' => '{object:field}', // Merge tag
        ),
    ),
)
```

### Merge Tag System

Merge tags allow dynamic data insertion using the format `{object_type:field_name}`.

**Available Objects:**
- `{user:field}` - Current user data
- `{post:field}` - Post/page data
- `{order:field}` - WooCommerce order data
- `{product:field}` - WooCommerce product data
- Custom objects defined by integrations

**Common User Fields:**
- `{user:ID}` - User ID
- `{user:user_email}` - Email address
- `{user:display_name}` - Display name
- `{user:user_login}` - Username

**Example Usage:**
```php
'mappings' => array(
    'customer_id'    => '{user:ID}',
    'customer_email' => '{user:user_email}',
    'order_total'    => '{order:total}',
    'product_name'   => '{product:title}',
)
```

## Data Sources

### Defining Data Sources

Integrations can define custom data sources by implementing option and variable methods.

#### `get_{type}_options()`
Define available fields for an object type.

**Return:** (array) Options configuration

**Structure:**
```php
public function get_product_options() {
    return array(
        'name'    => __('Product', 'echodash'),
        'type'    => 'product',
        'options' => array(
            array(
                'meta'        => 'title',           // Field identifier
                'preview'     => 'Sample Product',  // Example value
                'placeholder' => __('Product name', 'echodash'),
            ),
            array(
                'meta'        => 'price',
                'preview'     => '$99.99',
                'placeholder' => __('Product price', 'echodash'),
            ),
        ),
    );
}
```

#### `get_{type}_vars($id)`
Retrieve actual data for an object ID.

**Parameters:**
- `$id` (int) - Object ID

**Return:** (array) Data array keyed by object type

**Example:**
```php
public function get_product_vars($product_id) {
    $product = wc_get_product($product_id);
    
    return array(
        'product' => array(
            'id'          => $product->get_id(),
            'title'       => $product->get_title(),
            'price'       => $product->get_price(),
            'description' => $product->get_description(),
            'sku'         => $product->get_sku(),
        ),
    );
}
```

## Hooks & Filters

### Actions

#### `echodash_track_event`
Fires when an event is being tracked.

**Parameters:**
- `$event_name` (string) - Event name
- `$event_data` (array) - Event data
- `$source` (string) - Source integration
- `$trigger` (string) - Trigger identifier

**Example:**
```php
add_action('echodash_track_event', function($event_name, $event_data, $source, $trigger) {
    error_log("EchoDash Event: {$event_name} from {$source}");
}, 10, 4);
```

#### `echodash_integrations_loaded`
Fires after all integrations have been loaded and initialized.

**Example:**
```php
add_action('echodash_integrations_loaded', function() {
    // Custom initialization after integrations load
});
```

### Filters

#### `echodash_event_data`
Modify event data before it's sent to EchoDash.

**Parameters:**
- `$event_data` (array) - Current event data
- `$objects` (array) - Object IDs array

**Return:** (array) Modified event data

**Example:**
```php
add_filter('echodash_event_data', function($data, $objects) {
    // Add custom timestamp
    $data['custom'] = array(
        'timestamp' => current_time('timestamp'),
        'site_url'  => home_url(),
    );
    return $data;
}, 10, 2);
```

#### `echodash_event_objects`
Add custom objects to events before data collection.

**Parameters:**
- `$objects` (array) - Current objects array
- `$trigger` (string) - Trigger identifier

**Return:** (array) Modified objects array

**Example:**
```php
add_filter('echodash_event_objects', function($objects, $trigger) {
    // Always include current user
    if (!isset($objects['user'])) {
        $objects['user'] = get_current_user_id();
    }
    return $objects;
}, 10, 2);
```

#### `echodash_{integration}_triggers`
Modify available triggers for a specific integration.

**Example:**
```php
add_filter('echodash_woocommerce_triggers', function($triggers) {
    // Add custom trigger
    $triggers['custom_action'] = array(
        'name' => 'Custom Action',
        'description' => 'Custom trigger description',
        'has_global' => true,
        'option_types' => array('order'),
    );
    return $triggers;
});
```

#### `echodash_get_option_{key}`
Filter specific option values.

**Example:**
```php
add_filter('echodash_get_option_endpoint', function($value) {
    // Override endpoint in development
    if (WP_DEBUG) {
        return 'https://dev-api.echodash.com';
    }
    return $value;
});
```

## Settings Management

### Global Settings
Stored in WordPress `echodash_options` option as an array.

**Structure:**
```php
array(
    'integration_slug' => array(
        array(
            'trigger' => 'trigger_id',
            'name'    => 'Event Name',
            'value'   => array(/* mappings */),
        ),
    ),
)
```

### Post-Specific Settings
Stored in `echodash_settings` post meta.

**Structure:**
```php
array(
    'trigger_id' => array(
        'name'  => 'Event Name',
        'value' => array(/* mappings */),
    ),
)
```

### Settings Priority
1. Post-specific settings (highest priority)
2. Global settings
3. Default configurations from trigger setup

### Admin Interface

#### Meta Boxes
Automatically added to post types specified in trigger configuration.

#### JavaScript API
Admin JavaScript provides dynamic event configuration interface:
- Field selection dropdowns
- Merge tag previews
- Event name input
- Add/remove field mappings

**Localization:**
Options are localized to JavaScript via `echodash()->admin->localize()` method.

### Helper Methods

#### `get_settings($post_id)`
Retrieve settings for a specific post with defaults.

#### `get_options($trigger, $post_id)`
Get available options for event configuration with previews.

#### `get_defaults($trigger)`
Get default event configuration for a trigger.

**Example:**
```php
$defaults = $integration->get_defaults('order_completed');
if ($defaults) {
    // Use default mappings
    $event_config = $defaults;
}
```