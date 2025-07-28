import { KeyringAccount, KeyringRequest } from "@metamask/keyring-api";
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
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsedState = stored ? JSON.parse(stored.state as string) : null;
    const state = { ...d, ...parsedState } as SnapState;

    console.log("Get state:", state);
    return state;
}

async function setState(value: SnapState): Promise<void> {
    const serialized = JSON.stringify(value);

    console.log("Set state:", serialized);

    await snap.request({
        method: "snap_manageState",
        params: { operation: "update", newState: { state: serialized } },
    });
}