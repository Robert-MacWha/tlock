import React, { createContext, useContext, ReactNode } from 'react';
import { useKeyring, UseKeyringReturn } from '../hooks/useKeyring';

const KeyringContext = createContext<UseKeyringReturn | undefined>(undefined);

export function KeyringProvider({ children }: { children: ReactNode }) {
    const keyring = useKeyring();

    return (
        <KeyringContext.Provider value={keyring}>
            {children}
        </KeyringContext.Provider>
    );
}

export function useKeyringContext(): UseKeyringReturn {
    const context = useContext(KeyringContext);
    if (!context) {
        throw new Error(
            'useKeyringContext must be used within a KeyringProvider',
        );
    }
    return context;
}
