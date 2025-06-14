import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

const eslintConfig = [
    js.configs.recommended,
    ...compat.extends(
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
        'plugin:jsx-a11y/recommended',
        'plugin:promise/recommended',
        'next/core-web-vitals'
    ),
    {
        languageOptions: {
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
            },
        },
    },
    {
        rules: {
            // Base formatting rules
            'quotes': ['error', 'single'],
            'jsx-quotes': ['error', 'prefer-single'],
            'indent': ['error', 4],
            'react/jsx-indent': ['error', 4],
            'react/jsx-indent-props': ['error', 4],
            'semi': ['error', 'always'],
            'comma-dangle': ['error', 'always-multiline'],
            'object-curly-spacing': ['error', 'always'],
            'array-bracket-spacing': ['error', 'never'],
            'arrow-parens': ['error', 'always'],
            'eol-last': ['error', 'always'],
            'linebreak-style': ['error', 'unix'],
            'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 0 }],
            
            // TypeScript strict rules
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/explicit-function-return-type': 'error',
            '@typescript-eslint/explicit-module-boundary-types': 'error',
            '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
            '@typescript-eslint/no-non-null-assertion': 'error',
            '@typescript-eslint/no-unnecessary-condition': 'error',
            '@typescript-eslint/strict-boolean-expressions': 'error',
            '@typescript-eslint/prefer-nullish-coalescing': 'error',
            '@typescript-eslint/prefer-optional-chain': 'error',
            
            // React specific rules
            'react/prop-types': 'off', // TypeScript handles this
            'react/react-in-jsx-scope': 'off', // Not needed in Next.js
            'react/jsx-no-bind': 'error',
            'react/jsx-pascal-case': 'error',
            'react/jsx-no-useless-fragment': 'error',
            'react/no-array-index-key': 'error',
            
            // Import rules
            'import/no-unresolved': 'off', // TypeScript handles this
            'import/order': ['error', {
                'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                'newlines-between': 'always',
                'alphabetize': { 'order': 'asc', 'caseInsensitive': true }
            }],
            'import/no-default-export': 'off', // Next.js uses default exports
            
            // Additional strict rules
            'complexity': ['error', 10],
            'max-depth': ['error', 3],
            'max-lines': ['error', 300],
            'max-nested-callbacks': ['error', 3],
            'max-params': ['error', 4]
        },
        settings: {
            react: {
                version: 'detect',
            },
        }
    }
];

export default eslintConfig;
