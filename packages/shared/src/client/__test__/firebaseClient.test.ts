import { DeviceRegistration } from '..';
import { deriveRoomId, generateSharedSecret } from '../../crypto';
import { FirebaseClient } from '../firebaseClient';
import { HttpClient } from '../client';

describe('FirebaseClient', () => {
    let mockHttp: jest.Mocked<HttpClient>;
    let client: FirebaseClient;
    const testSecret = generateSharedSecret();
    const testRoomId = deriveRoomId(testSecret);
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

    describe('submitDevice', () => {
        it('should encrypt and store device registration', async () => {
            await client.submitDevice('fcm-123', 'iPhone 15');

            const storedData = mockStorage.get(
                `registrations/${testRoomId}`,
            ) as { encryptedData: string; registeredAt: number };
            expect(storedData).toMatchObject({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                encryptedData: expect.any(String),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                registeredAt: expect.any(Number),
            });
        });

        it('should update internal FCM token', async () => {
            await client.submitDevice('new-fcm-token', 'iPhone 15');
            expect(client.fcmToken).toBe('new-fcm-token');
        });
    });

    describe('getDevice', () => {
        it('should return null when no device is registered', async () => {
            const device = await client.getDevice();
            expect(device).toBeNull();
        });

        it('should decrypt and return device registration', async () => {
            const testDeviceRegistration: DeviceRegistration = {
                fcmToken: 'fcm-1234',
                deviceName: 'iphone 15',
            };
            await client.submitDevice(
                testDeviceRegistration.fcmToken,
                testDeviceRegistration.deviceName,
            );

            const retrieved = await client.getDevice();
            expect(retrieved).toEqual(testDeviceRegistration);
        });

        it('should return null when decryption fails', async () => {
            mockStorage.set('registrations/ROOM_1234', {
                encryptedData: 'invalid-encrypted-data',
                registeredAt: Date.now(),
            });

            const device = await client.getDevice();
            expect(device).toBeNull();
        });
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

    describe('pollUntilDeviceRegistered', () => {
        it('should return device when already registered', async () => {
            // Register device first
            await client.submitDevice('fcm-token', 'iPhone 15');

            const device = await client.pollUntilDeviceRegistered(100, 1);
            expect(device).toEqual({
                fcmToken: 'fcm-token',
                deviceName: 'iPhone 15',
            });
        });

        it('should poll until device is registered', async () => {
            // Register device after a delay
            setTimeout(() => {
                void client.submitDevice('fcm-delayed', 'iPad Pro');
            }, 50);

            const device = await client.pollUntilDeviceRegistered(10, 1);
            expect(device).toEqual({
                fcmToken: 'fcm-delayed',
                deviceName: 'iPad Pro',
            });
        });

        it('should timeout when device is never registered', async () => {
            await expect(
                client.pollUntilDeviceRegistered(10, 0.1),
            ).rejects.toThrow(
                'Polling for device registration timed out after 0.1 seconds',
            );
        });

        it('should handle registration with decryption errors', async () => {
            // Set up invalid device registration data
            setTimeout(() => {
                mockStorage.set(`registrations/${testRoomId}`, {
                    encryptedData: 'invalid-encrypted-data',
                    registeredAt: Date.now(),
                });
            }, 50);

            await expect(
                client.pollUntilDeviceRegistered(10, 0.2),
            ).rejects.toThrow(
                'Polling for device registration timed out after 0.2 seconds',
            );
        });
    });
});
