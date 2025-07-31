import React, { createContext, useContext, ReactNode, useState, useRef, useEffect } from 'react';
import { Request } from '@tlock/shared';
import { useClientsContext } from './ClientContext';
import { requestHandler } from '../services/RequestHandlerService';

export interface ClientRequest {
    request: Request;
    clientId: string;
}

interface RequestHandlerContextType {
    clientRequests: ClientRequest[];
    fetchRequests: () => Promise<void>;
}

const RequestRecieverContext = createContext<RequestHandlerContextType | undefined>(undefined);

interface RequestHandlerProviderProps {
    children: ReactNode;
    pollingInterval?: number;
}

/**
 * RequestReceiverProvider manages pending requests and provides methods to fetch
 * then. It automatically switches between dev and production modes depending
 * on the expo environment (push notifications don't work in expo go).
 */
export function RequestReceiverProvider({
    children,
    pollingInterval,
}: RequestHandlerProviderProps) {
    const [clientRequests, setClientRequests] = useState<ClientRequest[]>([]);
    const { clients } = useClientsContext();
    const previousRequestIds = useRef(new Set<string>());
    const clientsRef = useRef(clients);

    useEffect(() => {
        clientsRef.current = clients;

        fetchRequests().catch(error => {
            console.error('Failed to fetch requests:', error);
        });
    }, [clients]);

    useEffect(() => {
        if (pollingInterval === undefined || pollingInterval === 0) return;

        const interval = setInterval(() => {
            fetchRequests().catch(error => {
                console.error('Failed to fetch requests:', error);
            });
        }, pollingInterval);

        return () => clearInterval(interval);
    }, [pollingInterval, clients]);

    const fetchRequests = async (): Promise<void> => {
        let newClientRequests: ClientRequest[] = [];
        for (const clientInstance of clientsRef.current) {
            try {
                const client = clients.find(c => c.id === clientInstance.id);
                if (!client) continue;

                const resp = await client.client.getRequests();
                const requests = resp.filter(req => req.request.status === 'pending');

                // Callback for new requests
                const newRequests = requests
                    .filter(req => !previousRequestIds.current.has(req.id));
                for (const req of newRequests) {
                    try {
                        await requestHandler.handleRequest({
                            request: req,
                            clientId: clientInstance.id,
                        });
                    } catch (error) {
                        console.error('Error handling request:', error);
                    }
                };

                newRequests.forEach(req => previousRequestIds.current.add(req.id));

                newClientRequests = newClientRequests.concat(
                    requests.map(req => ({
                        request: req,
                        clientId: clientInstance.id,
                    }))
                );
            } catch (error) {
                console.error(`Failed to fetch requests for client ${clientInstance.id}:`, error);
                continue;
            }
        }

        setClientRequests(newClientRequests);
    }

    return (
        <RequestRecieverContext.Provider value={{
            clientRequests,
            fetchRequests,
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