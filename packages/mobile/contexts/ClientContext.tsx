import React, { createContext, useContext, ReactNode } from 'react';
import { useClients, UseClientsReturn } from '../hooks/useClients';

const ClientsContext = createContext<UseClientsReturn | undefined>(undefined);

export function ClientsProvider({ children }: { children: ReactNode }) {
    const clients = useClients();

    return (
        <ClientsContext.Provider value={clients}>
            {children}
        </ClientsContext.Provider>
    );
}

export function useClientsContext(): UseClientsReturn {
    const context = useContext(ClientsContext);
    if (!context) {
        throw new Error(
            'useClientsContext must be used within a ClientsContext',
        );
    }
    return context;
}
