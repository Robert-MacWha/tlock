import { deriveRoomId, generateSharedSecret } from '../../crypto';
import { FirebaseClient } from '../firebaseClient';
import { HttpClient } from '../client';

describe('FirebaseClient', () => {
    let mockHttp: jest.Mocked<HttpClient>;
    let client: FirebaseClient;
    const testSecret = generateSharedSecret();
    const mockStorage = new Map<string, unknown>();

    beforeEach(() => {
        jest.clearAllMocks();
        mockStorage.clear();

        mockHttp = {
            get: jest
                .fn()
                .mockImplementation(async (url: string, path: string) => {
                    return mockStorage.get(path) || null;
                }),
            put: jest
                .fn()
                .mockImplementation(
                    async (url: string, path: string, data: unknown) => {
                        mockStorage.set(path, data);
                    },
                ),
            delete: jest
                .fn()
                .mockImplementation(async (url: string, path: string) => {
                    const existed = mockStorage.has(path);
                    mockStorage.delete(path);
                    if (!existed) {
                        throw new Error('Request not found');
                    }
                }),
            post: jest.fn().mockResolvedValue({ success: true }),
        };

        client = new FirebaseClient(testSecret, 'test-fcm-token', mockHttp);
    });

    describe('request lifecycle', () => {
        it('should fail if FCM token is not set', async () => {
            const clientWithoutToken = new FirebaseClient(testSecret);
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
