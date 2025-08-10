module.exports = {
	env: {
		browser: true,
		es6: true,
		node: true,
		jest: true,
	},
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
		ecmaFeatures: {
			jsx: true,
		},
	},
	plugins: ['@typescript-eslint', 'react', 'react-hooks', 'jsx-a11y'],
	settings: {
		react: {
			version: 'detect',
		},
	},
	rules: {
		// TypeScript rules
		'@typescript-eslint/no-unused-vars': 'error',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/no-explicit-any': 'warn',

		// React rules
		'react/prop-types': 'off', // We use TypeScript for prop validation
		'react-hooks/rules-of-hooks': 'error',
		'react-hooks/exhaustive-deps': 'warn',

		// Accessibility rules
		'jsx-a11y/alt-text': 'error',
		'jsx-a11y/anchor-is-valid': 'warn',
		'jsx-a11y/aria-props': 'error',
		'jsx-a11y/aria-role': 'error',
		'jsx-a11y/click-events-have-key-events': 'warn',
		'jsx-a11y/no-static-element-interactions': 'warn',
		'jsx-a11y/label-has-associated-control': 'error',

		// General rules
		'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
		'prefer-const': 'error',
		'no-var': 'error',
	},
	overrides: [
		{
			files: ['**/*.ts', '**/*.tsx'],
			rules: {
				'@typescript-eslint/explicit-function-return-type': [
					'error',
					{
						allowExpressions: true,
						allowTypedFunctionExpressions: true,
					},
				],
			},
		},
	],
};
