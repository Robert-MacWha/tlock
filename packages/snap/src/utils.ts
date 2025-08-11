import { SnapState } from './state';
import { throwError } from './errors';
import { ERROR_CODES } from './constants';

export function validatePairedState(
    state: SnapState | null,
): asserts state is SnapState & {
    sharedSecret: NonNullable<SnapState['sharedSecret']>;
    fcmToken: NonNullable<SnapState['fcmToken']>;
} {
    validateSharedSecret(state);

    if (!state.fcmToken) {
        throwError(ERROR_CODES.NOT_PAIRED, 'Not paired');
    }
}

export function validateSharedSecret(
    state: SnapState | null,
): asserts state is SnapState & {
    sharedSecret: NonNullable<SnapState['sharedSecret']>;
} {
    if (!state) {
        throwError(ERROR_CODES.MISSING_STATE, 'Missing snap state');
    }

    if (!state.sharedSecret) {
        throwError(ERROR_CODES.MISSING_SECRET, 'Missing shared secret');
    }
}
