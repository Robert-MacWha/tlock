// Polling configuration
export const POLL_INTERVAL = 500; // milliseconds
export const POLL_TIMEOUT = 120; // seconds

// Screen names
export const SCREENS = {
    HOME: 'home',
    PAIR: 'pair',
    CONFIRM_PAIR: 'confirm-pair',
    IMPORT_ACCOUNT: 'import-account',
} as const;

// Account name suggestion
export const ACCOUNT_NAME_SUGGESTION = 'Tlock Account';

// Error codes for consistent error handling
export const ERROR_CODES = {
    NOT_PAIRED: 'NOT_PAIRED',
    MISSING_STATE: 'MISSING_STATE',
    MISSING_SECRET: 'MISSING_SECRET',
    DEVICE_NOT_REGISTERED: 'DEVICE_NOT_REGISTERED',
    IMPORT_FAILED: 'IMPORT_FAILED',
    ACCOUNT_CREATION_FAILED: 'ACCOUNT_CREATION_FAILED',
    PAIRING_FAILED: 'PAIRING_FAILED',
    ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
    REQUEST_NOT_FOUND: 'REQUEST_NOT_FOUND',
    SIGNING_FAILED: 'SIGNING_FAILED',
    SIGNATURE_VERIFICATION_FAILED: 'SIGNATURE_VERIFICATION_FAILED',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
export type Screen = typeof SCREENS[keyof typeof SCREENS];