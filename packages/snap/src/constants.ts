// Polling configuration
export const POLL_INTERVAL = 500; // milliseconds
export const POLL_TIMEOUT = 120; // seconds

// Screen names
export const SCREENS = {
    HOME: 'home',
    PAIR: 'pair',
    IMPORT_ACCOUNT: 'import-account',
    SETTINGS: 'settings',
} as const;

// Account name suggestion
export const ACCOUNT_NAME_SUGGESTION = 'Lodgelock Account';

export type Screen = (typeof SCREENS)[keyof typeof SCREENS];
