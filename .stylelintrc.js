/**
 * Stylelint Configuration for EchoDash
 *
 * Follows WordPress CSS Coding Standards:
 * https://developer.wordpress.org/coding-standards/wordpress-coding-standards/css/
 *
 * Key principles:
 * - Use lowercase with hyphens for selectors (avoid camelCase)
 * - Allow underscores for WordPress core compatibility
 * - Exclude third-party libraries from linting
 */
module.exports = {
	extends: ['@wordpress/stylelint-config'],
	ignoreFiles: [
		// Ignore build outputs
		'assets/dist/**/*',

		// Ignore vendor files
		'vendor/**/*',
		'node_modules/**/*',
	],
	rules: {
		// Relax some rules for WordPress development
		'comment-empty-line-before': null,
		'rule-empty-line-before': null,
		'at-rule-empty-line-before': null,
		'no-descending-specificity': null,
		'no-duplicate-selectors': null,

		// Enforce WordPress naming conventions (allow both hyphens and underscores)
		// WordPress core sometimes uses underscores, especially for legacy compatibility
		'selector-class-pattern':
			'^[a-z]([a-z0-9_-]+)?(__([a-z0-9_-]+-?)+)?(--([a-z0-9_-]+-?)+){0,2}$',
		'selector-id-pattern': '^[a-z]([a-z0-9_-]+)?$',

		// Allow flexible units and formatting
		'declaration-property-unit-allowed-list': null,
		'length-zero-no-unit': null,
		'function-url-quotes': null,
		'font-weight-notation': null,
		'color-named': null,
		'selector-attribute-quotes': null,
	},
};
