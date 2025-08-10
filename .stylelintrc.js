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
		'max-line-length': null,
		'no-descending-specificity': null,
		'no-duplicate-selectors': null,

		// Enforce WordPress naming conventions (allow both hyphens and underscores)
		// WordPress core sometimes uses underscores, especially for legacy compatibility
		'selector-class-pattern':
			'^[a-z]([a-z0-9_-]+)?(__([a-z0-9_-]+-?)+)?(--([a-z0-9_-]+-?)+){0,2}$',
		'selector-id-pattern': '^[a-z]([a-z0-9_-]+)?$',

		// Allow flexible units
		'declaration-property-unit-allowed-list': null,
		'length-zero-no-unit': null,
		'number-leading-zero': null,
		'number-no-trailing-zeros': null,

		// Allow flexible formatting
		'function-url-quotes': null,
		'string-quotes': null,
		'color-hex-case': null,
		'font-weight-notation': null,
		'color-named': null,
		'block-opening-brace-space-before': null,
		'block-opening-brace-newline-after': null,
		'block-closing-brace-newline-before': null,
		'block-closing-brace-newline-after': null,
		'declaration-colon-space-after': null,
		'declaration-block-semicolon-newline-after': null,
		'declaration-block-trailing-semicolon': null,
		'selector-combinator-space-before': null,
		'selector-combinator-space-after': null,
		'selector-attribute-quotes': null,
		'no-missing-end-of-source-newline': null,
		'max-empty-lines': null,
	},
};
