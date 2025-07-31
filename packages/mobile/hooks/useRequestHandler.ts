import { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { RequestType, RequestTypeMap } from '@tlock/shared';
import { useClientsContext } from '../contexts/ClientContext';

interface RequestHandlerConfig<T extends RequestType> {
    type: T;
    onApprove: (request: RequestTypeMap[T]) => Promise<Partial<RequestTypeMap[T]>>;
}

export function useRequestHandler<T extends RequestType>(config: RequestHandlerConfig<T>) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const { clientId, requestId } = useLocalSearchParams() as { clientId: string, requestId: string };
    const { clients } = useClientsContext();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [request, setRequest] = useState<RequestTypeMap[T] | null>(null);

    const client = clients.find(c => c.id === clientId);

    useEffect(() => {
        const fetchRequest = async () => {
            setLoading(true);
            setError(null);
            try {
                if (!client) {
                    throw new Error('Client not found');
                }

                const req = await client.client.getRequest(requestId, config.type);
                setRequest(req);
            } catch (err) {
                console.error('Failed to fetch request:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch request');
            } finally {
                setLoading(false);
            }
        };

        void fetchRequest();
    }, [clientId, requestId]);


    const handleApprove = async () => {
        if (!client || !request) {
            setError('Request not found');
            return;
        }

        setLoading(true);
        try {
            const updates = await config.onApprove(request);
            await client.client.updateRequest(requestId, config.type, {
                ...request,
                ...updates,
                status: 'approved',
            });
            router.replace({
                pathname: '/_requests/success',
                params: { type: config.type }
            });
        } catch (err) {
            console.error('Failed to approve request:', err);
            setError(err instanceof Error ? err.message : 'Failed to approve request');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!client || !request) {
            return;
        }

        setLoading(true);
        try {
            await client.client.updateRequest(requestId, config.type, {
                ...request,
                status: 'rejected',
            });
            router.back();
        } catch (err) {
            console.error('Failed to reject request:', err);
            setError(err instanceof Error ? err.message : 'Failed to reject request');
        } finally {
            setLoading(false);
        }
    };

    return {
        client,
        request,
        loading,
        error,
        handleApprove,
        handleReject,
    };
}