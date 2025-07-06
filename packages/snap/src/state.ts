import { Json } from "@metamask/snaps-sdk";

export async function setState<T>(value: T): Promise<void> {
    const serialized = JSON.stringify(value);

    await snap.request({
        method: "snap_manageState",
        params: { operation: "update", newState: { state: serialized } },
    });
}

export async function getState<T>(d: T | null = null): Promise<T | null> {
    const stored = await snap.request({
        method: "snap_manageState",
        params: { operation: "get" },
    });

    if (stored === null) {
        return d;
    }

    const parsed = JSON.parse(stored.state as string) as Json;
    if (parsed === null) {
        return d;
    }

    return parsed as T;
}