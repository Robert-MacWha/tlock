module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',

    testMatch: ['**/packages/**/*.test.{ts,tsx}'],

    // Basic coverage
    collectCoverageFrom: [
        'packages/*/src/**/*.{ts,tsx}',
        '!packages/**/*.test.{ts,tsx}',
        '!packages/**/__tests__/**/*',
    ],
};