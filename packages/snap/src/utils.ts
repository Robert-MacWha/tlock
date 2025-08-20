import { SnapState } from './state';

export function validatePairedState(
    state: SnapState | null,
): asserts state is SnapState & {
    sharedSecret: NonNullable<SnapState['sharedSecret']>;
    fcmToken: NonNullable<SnapState['fcmToken']>;
} {
    validateSharedSecret(state);

    if (!state.fcmToken) {
        throw new Error('Missing FCM token');
    }
}

export function validateSharedSecret(
    state: SnapState | null,
): asserts state is SnapState & {
    sharedSecret: NonNullable<SnapState['sharedSecret']>;
} {
    if (!state) {
        throw new Error('State is null');
    }

    if (!state.sharedSecret) {
        throw new Error('Missing shared secret');
    }
}
