module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',

    testMatch: ['**/packages/**/*.test.{ts,tsx}'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

    // TypeScript configuration
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: {
                types: ['jest', '@types/jest']
            }
        }]
    },

    // Basic coverage
    collectCoverageFrom: [
        'packages/*/src/**/*.{ts,tsx}',
        '!packages/**/*.test.{ts,tsx}',
        '!packages/**/__tests__/**/*',
    ],
};