import rootConfig from '../../eslint.config.mjs';

export default [
    ...rootConfig,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
];
