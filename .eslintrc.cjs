// @ts-check
const { defineConfig } = require('eslint-define-config')

module.exports = defineConfig({
	root: true,
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	env: {
		es2021: true,
		node: true,
	},
	plugins: ['import', 'n', 'promise', 'unicorn'],
	extends: ['eslint:recommended', 'plugin:unicorn/recommended'],
	reportUnusedDisableDirectives: true,
	rules: {
		// additional
		'quotes': ['error', 'single', { avoidEscape: true }],
		'quote-props': ['error', 'consistent-as-needed'],
		'semi': ['error', 'never'],
		'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
		'eol-last': ['error', 'always'],
		'indent': ['error', 'tab', { SwitchCase: 1 }],
		'comma-dangle': [
			'error',
			{
				arrays: 'always-multiline',
				objects: 'always-multiline',
				imports: 'always-multiline',
				exports: 'always-multiline',
				functions: 'always-multiline',
			},
		],
		'comma-spacing': ['error', { before: false, after: true }],
		'comma-style': ['error', 'last'],

		// overrides
		'unicorn/prevent-abbreviations': 'off',
	},
	overrides: [
		{
			files: ['*.ts'],
			parser: '@typescript-eslint/parser',
			parserOptions: {
				tsconfigRootDir: __dirname,
				project: [
					'./tsconfig.json',
				],
			},
			plugins: ['@typescript-eslint'],
			extends: [
				'plugin:@typescript-eslint/recommended',
				'plugin:@typescript-eslint/recommended-requiring-type-checking',
				'plugin:@typescript-eslint/strict',
			],
			rules: {
				'indent': 'off',
				'@typescript-eslint/indent': ['error', 'tab', { SwitchCase: 1 }],
				'comma-dangle': 'off',
				'@typescript-eslint/comma-dangle': [
					'error',
					{
						arrays: 'always-multiline',
						objects: 'always-multiline',
						imports: 'always-multiline',
						exports: 'always-multiline',
						functions: 'always-multiline',
					},
				],

				// additional official rules
				'@typescript-eslint/type-annotation-spacing': 'error',
				'@typescript-eslint/switch-exhaustiveness-check': 'warn',
				'@typescript-eslint/prefer-regexp-exec': 'warn',
				'@typescript-eslint/no-useless-empty-export': 'warn',
				'@typescript-eslint/no-unnecessary-qualifier': 'warn',
				'@typescript-eslint/member-delimiter-style': 'error',
			},
		},
	],
})
