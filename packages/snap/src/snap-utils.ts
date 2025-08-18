import type { KeyringEvent, KeyringEventPayload } from '@metamask/keyring-api';
import type { SnapsProvider } from '@metamask/snaps-sdk';

/**
 * Emit a keyring event from a snap.
 * https://github.com/MetaMask/accounts/blob/f91e4f0a1573e03ca3f62635389e8edeae31d17f/packages/keyring-snap-sdk/src/snap-utils.ts#L11
 * ? I can't import this function for some unknown reason on the latest version.  
 * ? I can if I downgrade to ^8, but that's silly so I'm just including it manually.  
 * ? Oh the joys
 *
 * @param snap - The global snap object.
 * @param event - The event name.
 * @param data - The event data.
 */
export async function emitSnapKeyringEvent<Event extends KeyringEvent>(
    snap: SnapsProvider,
    event: Event,
    data: KeyringEventPayload<Event>,
): Promise<void> {
    await snap.request({
        method: 'snap_manageAccounts',
        params: {
            method: event,
            params: { ...data },
        },
    });
}