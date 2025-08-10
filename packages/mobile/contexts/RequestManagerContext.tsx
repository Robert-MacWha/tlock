import React, { createContext, useContext, ReactNode } from 'react';
import { useClientsContext } from './ClientContext';
import { ClientRequest, useRequestManager } from '../hooks/useRequestManager';

interface RequestManagerContextType {
    clientRequests: ClientRequest[];
    fetchRequests: () => Promise<void>;
    handleRequest: (request: ClientRequest) => Promise<void>;
}

const RequestManagerContext = createContext<RequestManagerContextType | undefined>(undefined);

interface RequestManagerProviderProps {
    pollingInterval?: number;
    children: ReactNode;
}

/**
 * RequestManagerProvider manages pending requests and provides methods to fetch
 * them. It automatically switches between dev and production modes depending
 * on the expo environment (push notifications don't work in expo go).
 */
export function RequestManagerProvider({
    children,
    pollingInterval,
}: RequestManagerProviderProps) {
    const { clients } = useClientsContext();
    const { clientRequests, fetchRequests, handleRequest } = useRequestManager({
        pollingInterval,
        clients,
    });

    return (
        <RequestManagerContext.Provider value={{
            clientRequests,
            fetchRequests,
            handleRequest,
        }}>
            {children}
        </RequestManagerContext.Provider>
    );
}

export function useRequestManagerContext() {
    const context = useContext(RequestManagerContext);
    if (!context) {
        throw new Error('useRequestManagerContext must be used within a RequestManagerProvider');
    }
    return context;
}