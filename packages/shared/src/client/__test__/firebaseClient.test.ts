import { generateSharedSecret } from '../../crypto';
import { FirebaseClient } from '../firebaseClient';
import { FirebaseHttpClient } from '../client';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('FirebaseClient', () => {
    let client: FirebaseClient;
    const testSecret = generateSharedSecret();
    const mockStorage = new Map<string, unknown>();

    beforeEach(() => {
        jest.clearAllMocks();
        mockStorage.clear();

        // Mock fetch to simulate Firebase REST API behavior
        mockFetch.mockImplementation(
            async (url: string, options?: RequestInit) => {
                const urlObj = new URL(url);
                const path = urlObj.pathname.replace('.json', '');

                if (options?.method === 'PUT') {
                    const data: unknown = JSON.parse(options.body as string);
                    mockStorage.set(path, data);
                    return new Response(JSON.stringify(data), { status: 200 });
                } else if (options?.method === 'DELETE') {
                    const existed = mockStorage.has(path);
                    mockStorage.delete(path);
                    if (!existed) {
                        return new Response('Not Found', { status: 404 });
                    }
                    return new Response('null', { status: 200 });
                } else if (options?.method === undefined) {
                    // GET
                    const data = mockStorage.get(path);
                    if (data === undefined) {
                        return new Response('null', { status: 404 });
                    }
                    return new Response(JSON.stringify(data), { status: 200 });
                } else {
                    return new Response('Method Not Allowed', { status: 405 });
                }
            },
        );

        client = new FirebaseClient(
            testSecret,
            'test-fcm-token',
            new FirebaseHttpClient(),
        );
    });

    describe('request lifecycle', () => {
        it('should fail if FCM token is not set', async () => {
            const clientWithoutToken = new FirebaseClient(
                testSecret,
                undefined,
                new FirebaseHttpClient(),
            );
            await expect(
                clientWithoutToken.submitRequest('importAccount', {
                    status: 'pending',
                }),
            ).rejects.toThrow('Missing FCM token.');
        });

        it('should complete full request/response cycle', async () => {
            // Submit request
            const requestId = await client.submitRequest('importAccount', {
                status: 'pending',
            });
            expect(requestId).toBeTruthy();

            // Update request with response
            await client.updateRequest(requestId, 'importAccount', {
                status: 'approved',
                address: '0x1234567890123456789012345678901234567890',
            });

            // Retrieve updated request
            const response = await client.getRequest(
                requestId,
                'importAccount',
            );
            expect(response).toEqual({
                status: 'approved',
                address: '0x1234567890123456789012345678901234567890',
            });

            // Delete request
            await client.deleteRequest(requestId);

            // Verify deletion
            await expect(
                client.getRequest(requestId, 'importAccount'),
            ).rejects.toThrow('Request not found');
        });
    });

    describe('pollUntil', () => {
        it('should timeout when condition is never met', async () => {
            const requestId = await client.submitRequest('importAccount', {
                status: 'pending',
            });

            await expect(
                client.pollUntil(
                    requestId,
                    'importAccount',
                    10,
                    0.1,
                    () => false, // Never true
                ),
            ).rejects.toThrow('Polling timed out');
        });

        it('should return when condition is met', async () => {
            const requestId = await client.submitRequest('importAccount', {
                status: 'pending',
            });

            // Set up response after a delay
            setTimeout(() => {
                void client.updateRequest(requestId, 'importAccount', {
                    status: 'approved',
                    address: '0x1234567890123456789012345678901234567890',
                });
            }, 50);

            const result = await client.pollUntil(
                requestId,
                'importAccount',
                10,
                0.1,
                (response) => response.status !== 'pending',
            );

            expect(result.status).toBe('approved');
        });
    });
});
