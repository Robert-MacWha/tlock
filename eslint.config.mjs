import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

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
            'coverage/**'
        ]
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
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        },
    },
);