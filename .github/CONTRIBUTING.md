# Contributing to EchoDash

Thank you for your interest in contributing to EchoDash! This document outlines the development workflow and quality standards.

## Development Workflow

### Before Submitting a Pull Request

All pull requests must pass our automated quality checks. You can run these same checks locally to ensure your changes will pass CI:

```bash
# Run all quality checks locally
./bin/run-checks.sh
```

### Quality Checks

Our CI pipeline runs the following checks on every pull request:

#### PHP Quality Checks
- **PHP CodeSniffer (PHPCS)**: Ensures code follows WordPress coding standards
- **PHPStan**: Static analysis to catch potential bugs and type issues
- **PHP Compatibility**: Verifies code works with PHP 7.4 - 8.2

#### JavaScript Quality Checks
- **ESLint**: JavaScript/TypeScript linting and best practices
- **Stylelint**: CSS/SCSS linting and formatting
- **Code Formatting**: Ensures consistent code formatting
- **License Check**: Verifies all dependencies have compatible licenses
- **Engine Compatibility**: Checks Node.js/npm version requirements

#### Tests
- **JavaScript Tests**: Jest unit and integration tests
- **PHP Tests**: PHPUnit tests (if configured)
- **WordPress Compatibility**: Tests against multiple WordPress versions
- **Build Verification**: Ensures assets build correctly

#### Security
- **Composer Audit**: Checks for known security vulnerabilities in PHP dependencies
- **npm Audit**: Checks for known security vulnerabilities in JavaScript dependencies

## Local Development

### Prerequisites
- PHP 7.4+ with required extensions
- Node.js 18+
- Composer
- npm

### Setup
```bash
# Install PHP dependencies
composer install

# Install JavaScript dependencies
npm install

# Build assets for development
npm run dev
```

### Running Individual Checks

#### PHP
```bash
# Check code style
composer run phpcs

# Fix code style automatically
composer run phpcbf

# Run static analysis
composer run phpstan

# Run PHP tests (if available)
composer run test
```

#### JavaScript
```bash
# Lint JavaScript/TypeScript
npm run lint:js

# Fix JavaScript issues automatically
npm run lint:js -- --fix

# Lint CSS/SCSS
npm run lint:css

# Fix CSS issues automatically
npm run lint:css -- --fix

# Format code
npm run format

# Run JavaScript tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

#### Build
```bash
# Build for production
npm run build

# Build and analyze bundle size
npm run build:analyze

# Create plugin ZIP
npm run plugin-zip
```

## Code Standards

### PHP
- Follow [WordPress PHP Coding Standards](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/php/)
- Use proper documentation blocks for all functions and classes
- Prefix all global functions and classes with `EchoDash_` or `echodash_`
- Use the `echodash` text domain for all translations

### JavaScript/TypeScript
- Follow the project's ESLint configuration
- Use TypeScript for type safety
- Follow React best practices for components
- Use meaningful variable and function names

### CSS
- Follow the project's Stylelint configuration
- Use BEM methodology for class naming when appropriate
- Prefer CSS custom properties for theming

## Git Workflow

1. Fork the repository
2. Create a feature branch from `master`
3. Make your changes
4. Run `./bin/run-checks.sh` to verify quality
5. Commit your changes with clear, descriptive messages
6. Push to your fork
7. Create a pull request

## Pull Request Guidelines

- **Clear Description**: Explain what your PR does and why
- **Testing**: Describe how you tested your changes
- **Screenshots**: Include screenshots for UI changes
- **Breaking Changes**: Clearly document any breaking changes
- **Documentation**: Update documentation if needed

## Automated Checks

Our GitHub Actions workflow (`pr-checks.yml`) automatically runs on every pull request:

- ✅ PHP quality checks (PHPCS, PHPStan) across PHP 7.4-8.2
- ✅ JavaScript quality checks (ESLint, Stylelint, formatting)
- ✅ Test suite (Jest for JS, PHPUnit for PHP if configured)
- ✅ Security audits (Composer and npm)
- ✅ WordPress compatibility checks
- ✅ Build verification and artifact generation

All checks must pass before a PR can be merged.

## Getting Help

If you have questions about contributing or need help with the development setup:

- Check existing [Issues](https://github.com/your-org/echodash/issues)
- Create a new issue with the `question` label
- Review the [documentation](../README.md)

Thank you for contributing to EchoDash! 🚀
