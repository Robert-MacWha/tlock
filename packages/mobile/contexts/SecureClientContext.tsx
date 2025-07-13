import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { createSecuredClient, SecureClient, SharedSecret } from "@tlock/shared";

interface SecureClientContextType {
    secureClient: SecureClient | null;
    savePairing: (sharedSecret: SharedSecret) => Promise<void>;
    unpair: () => Promise<void>;
}

const SecureClientContext = createContext<SecureClientContextType | undefined>(undefined);

/**
 * secureClientProvider provides access to a secureClient instance and methods to
 * update pairing information.
 */
export function SecureClientProvider({ children }: { children: ReactNode }) {
    const [secureClient, setSecureClient] = useState<SecureClient | null>(null);

    useEffect(() => {
        const initializeApp = async () => {
            await loadPairing();
        }
        initializeApp();
    }, []);

    const loadPairing = async () => {
        const secret = await SecureStore.getItemAsync('tlock_pairing');
        if (secret) {
            const data = JSON.parse(secret) as SharedSecret;
            const client = createSecuredClient(data);
            setSecureClient(client);
        }
    }

    const savePairing = async (sharedSecret: SharedSecret) => {
        await SecureStore.setItemAsync('tlock_pairing', JSON.stringify(sharedSecret));
        const client = createSecuredClient(sharedSecret);
        setSecureClient(client);
    }

    const unpair = async () => {
        await SecureStore.deleteItemAsync('tlock_pairing');
        setSecureClient(null);
    }

    return (
        <SecureClientContext.Provider value={{
            secureClient,
            savePairing,
            unpair,
        }} >
            {children}
        </SecureClientContext.Provider>
    );
}

export function useSecureClientContext() {
    const context = useContext(SecureClientContext);
    if (!context) {
        throw new Error('useSecureClientContext must be used within a SecureClientProvider');
    }
    return context;
}