import { validatePairedState, validateSharedSecret } from '../utils';
import { SnapState } from '../state';
import { TlockSnapError } from '../errors';
import { ERROR_CODES } from '../constants';
import type { SharedSecret } from '@tlock/shared';

describe('utils', () => {
    const mockSharedSecret = [1, 2, 3, 4, 5] as SharedSecret;

    describe('validateSharedSecret', () => {
        it('should pass for valid state', () => {
            expect(() => validateSharedSecret({ sharedSecret: mockSharedSecret })).not.toThrow();
        });

        it('should throw for null state', () => {
            expect(() => validateSharedSecret(null)).toThrow(TlockSnapError);
        });

        it('should throw for missing shared secret', () => {
            expect(() => validateSharedSecret({})).toThrow(TlockSnapError);
        });
    });

    describe('validatePairedState', () => {
        it('should pass for fully paired state', () => {
            const state = { sharedSecret: mockSharedSecret, fcmToken: 'token' };
            expect(() => validatePairedState(state)).not.toThrow();
        });

        it('should throw for missing FCM token', () => {
            const state = { sharedSecret: mockSharedSecret };
            expect(() => validatePairedState(state)).toThrow(TlockSnapError);
        });

        it('should throw for empty FCM token', () => {
            const state = { sharedSecret: mockSharedSecret, fcmToken: '' };
            expect(() => validatePairedState(state)).toThrow(TlockSnapError);
        });
    });
});