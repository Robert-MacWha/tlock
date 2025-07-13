import React, { createContext, useContext, ReactNode, useEffect, useState, useRef } from 'react';
import { SecureClient, RequestType, PendingRequest } from '@tlock/shared';
import { useDevMode } from '../hooks/useDevMode';
import { useSecureClientContext } from './SecureClientContext';

interface RequestHandlerContextType {
    pendingRequests: PendingRequest[];
    getPendingRequests: () => Promise<void>;
}

const RequestRecieverContext = createContext<RequestHandlerContextType | undefined>(undefined);

interface RequestHandlerProviderProps {
    children: ReactNode;
    onRequestReceived?: (request: PendingRequest) => void;
}

/**
 * RequestReceiverProvider manages pending requests and provides methods to fetch
 * then.  It automatically switches between dev and production modes depending
 * on the expo environment (push notifications don't work in expo go).
 */
export function RequestReceiverProvider({
    children,
    onRequestReceived,
}: RequestHandlerProviderProps) {
    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
    const { isDev } = useDevMode();
    const { secureClient, savePairing } = useSecureClientContext();
    const previousRequestIds = useRef(new Set<string>());

    // Start/stop polling based on secureClient availability
    useEffect(() => {
        if (!isDev) {
            setupPushNotifications();
        }
    }, [secureClient, isDev]);

    const setupPushNotifications = async () => {
        if (!secureClient) return;
        throw new Error('Push notifications setup is not implemented yet');
    };

    const getPendingRequests = async (): Promise<void> => {
        setPendingRequests([]);
        if (!secureClient) return;

        try {
            const requests = await secureClient.getRequests();

            const newRequests = requests
                .filter(req => !previousRequestIds.current.has(req.id));

            newRequests.forEach(req => {
                onRequestReceived?.(req);
            });

            const currentRequestIds = new Set(requests.map(r => r.id));
            previousRequestIds.current = currentRequestIds;

            setPendingRequests(requests);
        } catch (error) {
            console.error('Failed to fetch requests:', error);
            return;
        }
    }

    return (
        <RequestRecieverContext.Provider value={{
            pendingRequests,
            getPendingRequests,
        }}>
            {children}
        </RequestRecieverContext.Provider>
    );
}

export function useRequestReceiverContext() {
    const context = useContext(RequestRecieverContext);
    if (!context) {
        throw new Error('useRequestHandler must be used within a RequestRecieverProvider');
    }
    return context;
}