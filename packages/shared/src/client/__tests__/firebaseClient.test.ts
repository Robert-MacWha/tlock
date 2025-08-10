import { DeviceRegistration } from "..";
import { deriveRoomId, generateSharedSecret } from "../../crypto";
import { FirebaseClient } from "../firebaseClient";
import { MockHttpClient } from "./mockHttpClient";

describe('FirebaseClient', () => {
    let mockHttp: MockHttpClient;
    let client: FirebaseClient;
    const testSecret = generateSharedSecret();
    const testRoomId = deriveRoomId(testSecret);

    beforeEach(() => {
        mockHttp = new MockHttpClient();
        client = new FirebaseClient(testSecret, 'test-fcm-token', mockHttp);
    });

    afterEach(() => {
        mockHttp.clear();
    });

    describe('submitDevice', () => {
        it('should encrypt and store device registration', async () => {
            await client.submitDevice('fcm-123', 'iPhone 15');

            const storedData = mockHttp.getStoredData(`registrations/${testRoomId}`) as { encryptedData: string; registeredAt: number };
            expect(storedData).toMatchObject({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                encryptedData: expect.any(String),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                registeredAt: expect.any(Number)
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
                deviceName: 'iphone 15'
            }
            await client.submitDevice(testDeviceRegistration.fcmToken, testDeviceRegistration.deviceName);

            const retrieved = await client.getDevice();
            expect(retrieved).toEqual(testDeviceRegistration);
        });

        it('should return null when decryption fails', async () => {
            mockHttp.setStoredData('registrations/ROOM_1234', {
                encryptedData: 'invalid-encrypted-data',
                registeredAt: Date.now()
            });

            const device = await client.getDevice();
            expect(device).toBeNull();
        });
    });

    describe('request lifecycle', () => {
        it('should fail if FCM token is not set', async () => {
            const clientWithoutToken = new FirebaseClient(testSecret);
            await expect(clientWithoutToken.submitRequest('importAccount', { status: 'pending' }))
                .rejects.toThrow('Missing FCM token.');
        })

        it('should complete full request/response cycle', async () => {
            // Submit request
            const requestId = await client.submitRequest('importAccount', { status: 'pending' });
            expect(requestId).toBeTruthy();

            // Update request with response
            await client.updateRequest(requestId, 'importAccount', {
                status: 'approved',
                address: '0x1234567890123456789012345678901234567890'
            });

            // Retrieve updated request
            const response = await client.getRequest(requestId, 'importAccount');
            expect(response).toEqual({
                status: 'approved',
                address: '0x1234567890123456789012345678901234567890'
            });

            // Delete request
            await client.deleteRequest(requestId);

            // Verify deletion
            await expect(client.getRequest(requestId, 'importAccount')).rejects.toThrow('Request not found');
        });
    });

    describe('pollUntil', () => {
        it('should timeout when condition is never met', async () => {
            const requestId = await client.submitRequest('importAccount', { status: 'pending' });

            await expect(
                client.pollUntil(
                    requestId,
                    'importAccount',
                    10,
                    0.1,
                    () => false // Never true
                )
            ).rejects.toThrow('Polling timed out');
        });

        it('should return when condition is met', async () => {
            const requestId = await client.submitRequest('importAccount', { status: 'pending' });

            // Set up response after a delay
            setTimeout(() => {
                void client.updateRequest(requestId, 'importAccount', {
                    status: 'approved',
                    address: '0x1234567890123456789012345678901234567890'
                });
            }, 50);

            const result = await client.pollUntil(
                requestId,
                'importAccount',
                10,
                0.1,
                (response) => response.status !== 'pending'
            );

            expect(result.status).toBe('approved');
        });
    });
});
