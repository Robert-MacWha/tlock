import React, { createContext, useContext, ReactNode } from 'react';
import { SharedSecret } from '@tlock/shared';
import { ClientInstance, useClients } from '../hooks/useClients';

interface ClientsContextType {
    clients: ClientInstance[];
    firebaseUrl: string;
    addClient: (sharedSecret: SharedSecret, name?: string) => Promise<ClientInstance>;
    removeClient: (clientId: string) => Promise<void>;
    setClientName: (clientId: string, name: string) => Promise<void>;
    setFirebaseUrl: (url: string) => Promise<void>;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export function ClientsProvider({ children }: { children: ReactNode }) {
    const {
        clients,
        firebaseUrl,
        addClient,
        removeClient,
        setClientName,
        setFirebaseUrl,
    } = useClients();

    return (
        <ClientsContext.Provider
            value={{
                clients,
                firebaseUrl,
                addClient,
                removeClient,
                setClientName,
                setFirebaseUrl,
            }}
        >
            {children}
        </ClientsContext.Provider>
    );
}

export function useClientsContext() {
    const context = useContext(ClientsContext);
    if (!context) {
        throw new Error(
            'useClientsContext must be used within a ClientsContext',
        );
    }
    return context;
}
