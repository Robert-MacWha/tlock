import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import jest from 'eslint-plugin-jest';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,

    {
        ignores: [
            'eslint.config.mjs',
            '*.config.js',
            '*.config.mjs',
            '*.config.ts',
            'node_modules/**',
            'dist/**',
            'build/**',
            '**/*.d.ts',
            'coverage/**',
        ],
    },

    {
        files: ['**/*.ts', '**/*.tsx'],
        extends: [...tseslint.configs.recommendedTypeChecked],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            '@typescript-eslint/await-thenable': 'error',
            '@typescript-eslint/require-await': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/no-unsafe-member-access': 'warn',
            '@typescript-eslint/no-unsafe-assignment': 'warn',
            '@typescript-eslint/no-unsafe-return': 'warn',
        },
    },

    // Jest-specific configuration for test files
    {
        files: ['**/__test__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
        plugins: {
            jest,
        },
        languageOptions: {
            globals: jest.environments.globals.globals,
        },
        rules: {
            // Disable TypeScript's unbound-method rule for test files
            '@typescript-eslint/unbound-method': 'off',
            // Enable Jest's unbound-method rule instead
            'jest/unbound-method': 'off',
        },
    },
);
