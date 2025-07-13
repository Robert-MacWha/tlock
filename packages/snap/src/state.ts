import { KeyringAccount, KeyringRequest } from "@metamask/keyring-api";
import { Json } from "@metamask/snaps-sdk";
import { SharedSecret } from "@tlock/shared";

export interface SnapState {
    sharedSecret?: SharedSecret;
    fcmToken?: string;
    keyringState?: KeyringState;
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

export async function getState(d: SnapState | null = null): Promise<SnapState | null> {
    const stored = await snap.request({
        method: "snap_manageState",
        params: { operation: "get" },
    })

    if (stored === null) {
        return d;
    }

    const parsed = JSON.parse(stored.state as string) as Json;
    if (parsed === null) {
        return d;
    }

    return parsed as SnapState;
}

async function setState(value: SnapState): Promise<void> {
    const serialized = JSON.stringify(value);

    await snap.request({
        method: "snap_manageState",
        params: { operation: "update", newState: { state: serialized } },
    });
}