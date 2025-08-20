import { validatePairedState, validateSharedSecret } from '../utils';
import type { SharedSecret } from '@lodgelock/shared';

describe('utils', () => {
    const mockSharedSecret = [1, 2, 3, 4, 5] as SharedSecret;

    describe('validateSharedSecret', () => {
        it('should pass for valid state', () => {
            expect(() =>
                validateSharedSecret({ sharedSecret: mockSharedSecret }),
            ).not.toThrow();
        });

        it('should throw for null state', () => {
            expect(() => validateSharedSecret(null)).toThrow('State is null');
        });

        it('should throw for missing shared secret', () => {
            expect(() => validateSharedSecret({})).toThrow(
                'Missing shared secret',
            );
        });
    });

    describe('validatePairedState', () => {
        it('should pass for fully paired state', () => {
            const state = { sharedSecret: mockSharedSecret, fcmToken: 'token' };
            expect(() => validatePairedState(state)).not.toThrow();
        });

        it('should throw for missing FCM token', () => {
            const state = { sharedSecret: mockSharedSecret };
            expect(() => validatePairedState(state)).toThrow(
                'Missing FCM token',
            );
        });

        it('should throw for empty FCM token', () => {
            const state = { sharedSecret: mockSharedSecret, fcmToken: '' };
            expect(() => validatePairedState(state)).toThrow(
                'Missing FCM token',
            );
        });
    });
});
