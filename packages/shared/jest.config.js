const rootConfig = require('../../jest.config.ts');

module.exports = {
    ...rootConfig,
    // Override for this package specifically
    rootDir: '.',
    testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
    setupFilesAfterEnv: ['<rootDir>/../../jest.setup.js'],
    collectCoverageFrom: [
        '<rootDir>/src/**/*.{ts,tsx}',
        '!<rootDir>/src/**/*.test.{ts,tsx}',
        '!<rootDir>/src/**/__tests__/**/*',
    ],
};