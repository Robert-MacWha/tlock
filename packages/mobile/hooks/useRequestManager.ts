import { useState, useRef, useEffect } from 'react';
import { Request } from '@tlock/shared';
import { ClientInstance } from './useClients';
import { router } from 'expo-router';
// import * as Notifications from 'expo-notifications';

export interface ClientRequest {
    request: Request;
    clientId: string;
}

interface UseRequestManagerOptions {
    pollingInterval?: number | undefined;
    clients: ClientInstance[];
}

/**
 * RequestManager handles fetching client requests and triggering actions based
 * on said events.  It can poll for new requests or receive them via push notifications.
 * TODO: Implement push notification receipt and conditional handling based on app visibility
 */
export function useRequestManager({ pollingInterval, clients }: UseRequestManagerOptions) {
    const [clientRequests, setClientRequests] = useState<ClientRequest[]>([]);
    const previousRequestIds = useRef(new Set<string>());
    const clientsRef = useRef(clients);

    // update requests on client change
    useEffect(() => {
        clientsRef.current = clients;

        fetchRequests().catch(error => {
            console.error('Failed to fetch requests:', error);
        });
    }, [clients]);

    // update requests on polling interval 
    useEffect(() => {
        if (pollingInterval === undefined || pollingInterval === 0) return;

        const interval = setInterval(() => {
            fetchRequests().catch(error => {
                console.error('Failed to fetch requests:', error);
            });
        }, pollingInterval);

        return () => clearInterval(interval);
    }, [pollingInterval]);

    const handleRequest = async (request: ClientRequest): Promise<void> => {
        router.push({
            pathname: `/_requests/${request.request.type}`,
            params: { clientId: request.clientId, requestId: request.request.id }
        });
    };

    const rejectRequest = async (request: ClientRequest): Promise<void> => {
        const client = clientsRef.current.find(c => c.id === request.clientId);
        if (!client) return;

        try {
            await client?.client.updateRequest(request.request.id, request.request.type, {
                status: 'rejected',
            })
            setClientRequests(prev => prev.filter(r => r.request.id !== request.request.id));
        } catch (error) {
            console.error('Failed to reject request:', error);
        }
    }

    const fetchRequests = async (): Promise<void> => {
        const newClientRequests = await getClientRequests();

        // Handle new requests
        const newRequests = newClientRequests
            .filter(req => !previousRequestIds.current.has(req.request.id));

        for (const req of newRequests) {
            try {
                await handleRequest(req);
            } catch (error) {
                console.error('Error handling request:', error);
            }
        }

        newRequests.forEach(req => previousRequestIds.current.add(req.request.id));
        setClientRequests(newClientRequests);
    }

    const getClientRequests = async (): Promise<ClientRequest[]> => {
        let newClientRequests: ClientRequest[] = [];

        if (clientsRef.current.length === 0) {
            return [];
        }

        for (const clientInstance of clientsRef.current) {
            try {
                const client = clients.find(c => c.id === clientInstance.id);
                if (!client) continue;

                const resp = await client.client.getRequests();
                const requests = resp.filter(req => req.request.status === 'pending');

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

        return newClientRequests;
    };

    return {
        clientRequests,
        fetchRequests,
        handleRequest,
        rejectRequest,
    };
}