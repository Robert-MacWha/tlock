import { FirebaseClient } from '../client/firebaseClient';
import { generateSharedSecret } from '../crypto';
import { HttpClient } from '../client/client';

// Simple mock HTTP client
class MockHttpClient implements HttpClient {
    public mockData: unknown = null;

    async get<T>(): Promise<T> {
        return this.mockData as T;
    }

    async put(): Promise<void> { }
    async delete(): Promise<void> { }
}

describe('FirebaseClient validation', () => {
    let client: FirebaseClient;
    let mockHttp: MockHttpClient;
    const sharedSecret = generateSharedSecret();

    beforeEach(() => {
        mockHttp = new MockHttpClient();
        client = new FirebaseClient(sharedSecret, undefined, mockHttp);
        jest.spyOn(console, 'warn').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getRequest validation', () => {
        it('should validate and return valid stored request', async () => {
            mockHttp.mockData = {
                type: 'pair',
                data: JSON.stringify({ status: 'pending', fcmToken: 'token', deviceName: 'device' }),
                lastUpdated: 1640995200000,
            };

            const result = await client.getRequest('test-id', 'pair');
            expect(result).toEqual({ status: 'pending', fcmToken: 'token', deviceName: 'device' });
        });

        it('should throw error for invalid stored request structure', async () => {
            mockHttp.mockData = { type: 'pair' }; // Missing required fields

            await expect(client.getRequest('test-id', 'pair')).rejects.toThrow(
                'Invalid stored request data from Firebase'
            );
        });

        it('should throw error for type mismatch', async () => {
            mockHttp.mockData = {
                type: 'importAccount',
                data: JSON.stringify({ status: 'pending' }),
                lastUpdated: 1640995200000,
            };

            await expect(client.getRequest('test-id', 'pair')).rejects.toThrow(
                'Request type mismatch: expected pair, got importAccount'
            );
        });

        it('should throw error for invalid decrypted data', async () => {
            mockHttp.mockData = {
                type: 'pair',
                data: JSON.stringify({ status: 'invalid-status' }), // Invalid data
                lastUpdated: 1640995200000,
            };

            await expect(client.getRequest('test-id', 'pair')).rejects.toThrow(
                "Decrypted message validation failed: status: Invalid option: expected one of \"pending\"|\"approved\"|\"rejected\"|\"error\", fcmToken: Invalid input: expected string, received undefined, deviceName: Invalid input: expected string, received undefined"
            );
        });
    });

    describe('getRequests validation', () => {
        it('should return empty array when no data', async () => {
            mockHttp.mockData = null;
            const result = await client.getRequests();
            expect(result).toEqual([]);
        });

        it('should skip invalid requests and continue processing', async () => {
            mockHttp.mockData = {
                'valid': {
                    type: 'pair',
                    data: JSON.stringify({ status: 'pending', fcmToken: 'token', deviceName: 'device' }),
                    lastUpdated: 1640995200000,
                },
                'invalid': { type: 'invalid-type' }, // Missing required fields
            };

            const result = await client.getRequests();
            expect(result).toHaveLength(1);
            expect(result[0]?.id).toBe('valid');
        });
    });
});