import { updateState, getState } from '../state';
import { DEFAULT_FIREBASE_URL } from '@tlock/shared';
import type { SharedSecret } from '@tlock/shared';

// Mock the snap global
const mockSnapRequest = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
(global as any).snap = {
    request: mockSnapRequest,
};

describe('state', () => {
    const mockSharedSecret = [1, 2, 3, 4, 5] as SharedSecret;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getState', () => {
        it('should return null when no stored state', async () => {
            mockSnapRequest.mockResolvedValue(null);
            const result = await getState();
            expect(result).toEqual({
                firebaseUrl: DEFAULT_FIREBASE_URL,
            });
        });

        it('should add default Firebase URL when missing', async () => {
            mockSnapRequest.mockResolvedValue({
                state: JSON.stringify({ sharedSecret: mockSharedSecret }),
            });

            const result = await getState();
            expect(result).toEqual({
                firebaseUrl: DEFAULT_FIREBASE_URL,
                sharedSecret: mockSharedSecret,
            });
        });
    });

    it('should preserve existing Firebase URL', async () => {
        const customUrl = 'https://custom.firebase.com';
        mockSnapRequest.mockResolvedValue({
            state: JSON.stringify({ firebaseUrl: customUrl }),
        });

        const result = await getState();
        expect(result).toEqual({
            firebaseUrl: customUrl,
        });
    });
});

describe('updateState', () => {
    it('should merge new state with existing', async () => {
        mockSnapRequest
            .mockResolvedValueOnce({ state: JSON.stringify({ fcmToken: 'old' }) })
            .mockResolvedValueOnce(undefined);

        await updateState({ deviceName: 'new' });

        expect(mockSnapRequest).toHaveBeenLastCalledWith({
            method: 'snap_manageState',
            params: {
                operation: 'update',
                newState: {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    state: expect.stringContaining('"fcmToken":"old"') &&
                        expect.stringContaining('"deviceName":"new"')
                }
            }
        });
    });

    it('should work with null existing state', async () => {
        mockSnapRequest
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(undefined);

        await updateState({ fcmToken: 'token' });

        expect(mockSnapRequest).toHaveBeenLastCalledWith({
            method: 'snap_manageState',
            params: {
                operation: 'update',
                newState: {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    state: expect.stringContaining('"fcmToken":"token"')
                }
            }
        });
    });
});