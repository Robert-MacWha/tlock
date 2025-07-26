import { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { RequestType, RequestTypeMap } from '@tlock/shared';
import { useSecureClientContext } from '../contexts/SecureClientContext';

interface RequestHandlerConfig<T extends RequestType> {
    type: T;
    onApprove: (request: RequestTypeMap[T]) => Promise<Partial<RequestTypeMap[T]>>;
}

export function useRequestHandler<T extends RequestType>(config: RequestHandlerConfig<T>) {
    const { requestId } = useLocalSearchParams() as { requestId: string };
    const { secureClient } = useSecureClientContext();

    const [request, setRequest] = useState<RequestTypeMap[T] | undefined>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRequest = async () => {
            if (!secureClient) return;

            try {
                setLoading(true);
                const req = await secureClient.getRequest(requestId, config.type);
                setRequest(req);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch request:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch request');
            } finally {
                setLoading(false);
            }
        };

        fetchRequest();
    }, [requestId, config.type, secureClient]);

    const handleApprove = async () => {
        if (!request || !secureClient) {
            throw new Error('No request data available');
        }

        setLoading(true);
        const updates = await config.onApprove(request);
        await secureClient.updateRequest(requestId, config.type, {
            ...request,
            ...updates,
            status: 'approved',
        });
        router.back();
    };

    const handleReject = async () => {
        if (!secureClient || !request) return;

        setLoading(true);
        await secureClient.updateRequest(requestId, config.type, {
            ...request,
            status: 'rejected',
        });
        router.back();
    };

    return {
        request,
        loading,
        error,
        handleApprove,
        handleReject,
    };
}