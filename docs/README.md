# EchoDash WordPress Plugin Documentation

## Overview

EchoDash is a comprehensive WordPress plugin that bridges popular WordPress plugins with the EchoDash analytics platform. It provides real-time event tracking for user interactions across 20+ WordPress plugins including WooCommerce, LearnDash, Gravity Forms, and more.

## Documentation Structure

### 📚 [Project Index](PROJECT_INDEX.md)
Complete overview of the project structure, integrations, and development workflow.

**What you'll find:**
- Core architecture overview
- Complete list of supported plugin integrations
- File structure and organization
- Development commands and quality assurance

### 🔧 [API Reference](API_REFERENCE.md)
Detailed technical documentation for developers working with the EchoDash API.

**What you'll find:**
- Core functions and their usage
- Integration base class documentation
- Event system and merge tag syntax
- Hooks, filters, and extension points
- Settings management system

### 💻 [CLAUDE.md](../CLAUDE.md)
Guidance for Claude Code instances working in this repository.

**What you'll find:**
- Development setup and commands
- Architecture patterns and conventions
- Integration creation guide
- Testing and quality workflows

## Quick Start

### For Users
1. Install and activate the EchoDash plugin
2. Configure your EchoDash API endpoint in Settings → EchoDash
3. Configure event tracking for your installed plugins
4. Events will automatically appear in your EchoDash dashboard

### For Developers
1. **Setup Development Environment:**
   ```bash
   composer install  # Install PHP dependencies
   ```

2. **Run Quality Checks:**
   ```bash
   composer phpcs     # Check coding standards
   composer phpstan   # Run static analysis
   composer test      # Run unit tests
   ```

3. **Create New Integration:**
   - Extend `EchoDash_Integration` class
   - Implement `init()` and `setup_triggers()` methods
   - Add to integration registry in main plugin file

## Key Concepts

### Event Tracking Flow
1. WordPress action fires → Integration method called
2. Integration calls `track_event($trigger, $objects)`
3. System retrieves configured events for trigger
4. Data collected using `get_{type}_vars` methods
5. Merge tags like `{user:email}` replaced with actual values
6. Events sent to EchoDash platform

### Integration System
- **Automatic Loading**: Integrations load when dependency plugins are detected
- **Extensible Architecture**: Easy to add support for new plugins
- **Consistent API**: All integrations follow the same patterns
- **Flexible Configuration**: Global and post-specific event settings

### Merge Tag System
Dynamic data insertion using `{object_type:field_name}` format:
- `{user:user_email}` - Current user's email
- `{order:total}` - WooCommerce order total
- `{product:title}` - Product name
- Custom objects defined by integrations

## Supported Integrations

### E-Commerce (5 plugins)
- WooCommerce, Easy Digital Downloads, Give Donations, WooCommerce Subscriptions, EDD Recurring

### Learning Management (2 plugins)
- LearnDash, LifterLMS

### Community & Membership (3 plugins)
- BuddyPress, bbPress, GamiPress

### Forms & Lead Generation (1 plugin)
- Gravity Forms

### Core WordPress (2 integrations)
- WordPress Core, User Management

### Specialized (4 plugins)
- AffiliateWP, Presto Player, Abandoned Cart, EDD Software Licensing

## Development Standards

- **WordPress Coding Standards** with custom configurations
- **PHPStan Level 5** static analysis
- **Custom prefixes**: `ecd`, `EchoDash`
- **Text domain**: `echodash`
- **Sanitization**: Use `echodash_clean()` for user input

## Getting Help

- **GitHub Issues**: [Create an issue](../../issues/new) for bugs or feature requests
- **Documentation**: Start with [Project Index](PROJECT_INDEX.md) for comprehensive overview
- **API Reference**: See [API Reference](API_REFERENCE.md) for technical details
- **Support**: Visit [EchoDash Support](https://echodash.com/support/)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow coding standards (run `composer phpcs`)
4. Add/update tests as needed
5. Submit a pull request

## License

GPL v3 or later - see [LICENSE](../LICENSE) file for details.