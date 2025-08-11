import { showTextScreen } from './screen';
import { createClient } from '@tlock/shared';
import { getState } from './state';
import { TlockKeyring } from './keyring';
import { ERROR_CODES } from './constants';
import { handleError } from './errors';
import { validatePairedState } from './utils';

export async function handleImportAccount(interfaceId: string) {
    await showTextScreen(interfaceId, 'Importing account...');

    const state = await getState();
    validatePairedState(state);

    await showTextScreen(
        interfaceId,
        'Importing account...',
        'Please check your device for approval',
    );

    try {
        const client = createClient(state.sharedSecret, state.fcmToken);
        const keyring = new TlockKeyring(client, state?.keyringState);
        const account = await keyring.createAccount({});
        await showTextScreen(
            interfaceId,
            'Account imported successfully',
            `Address: ${account.address}`,
        );
    } catch (error) {
        handleError(
            error,
            ERROR_CODES.IMPORT_FAILED,
            'Failed to import account',
        );
    }
}
