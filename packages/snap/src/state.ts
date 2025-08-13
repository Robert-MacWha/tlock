import { KeyringAccount, KeyringRequest } from '@metamask/keyring-api';
import { SharedSecret, DEFAULT_FIREBASE_URL } from '@tlock/shared';

export interface SnapState {
    sharedSecret?: SharedSecret;
    fcmToken?: string;
    deviceName?: string;
    keyringState?: KeyringState;
    firebaseUrl?: string;
}

export type KeyringState = {
    wallets: Record<string, Wallet>;
    pendingRequests: Record<string, KeyringRequest>;
};

export type Wallet = {
    account: KeyringAccount;
};

export async function updateState(partial: Partial<SnapState>): Promise<void> {
    const currentState = await getState();
    const newState = { ...currentState, ...partial };

    await setState(newState);
}

export async function getState(
    d: SnapState | null = null,
): Promise<SnapState | null> {
    const stored = await snap.request({
        method: 'snap_manageState',
        params: { operation: 'get' },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsedState = stored ? JSON.parse(stored.state as string) : null;
    const state = { ...d, ...parsedState } as SnapState;

    if (!state.firebaseUrl) {
        state.firebaseUrl = DEFAULT_FIREBASE_URL;
    }

    return state;
}

async function setState(value: SnapState): Promise<void> {
    const serialized = JSON.stringify(value);

    await snap.request({
        method: 'snap_manageState',
        params: { operation: 'update', newState: { state: serialized } },
    });
}
