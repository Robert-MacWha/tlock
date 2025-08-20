import { showTextScreen } from './screen';
import { createClient } from '@lodgelock/shared';
import { getState } from './state';
import { LodgelockKeyring } from './keyring';
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

    const client = createClient(
        state.sharedSecret,
        state.fcmToken,
        state.firebaseUrl,
    );
    const keyring = new LodgelockKeyring(client, state?.keyringState);
    const account = await keyring.createAccount({});
    await showTextScreen(
        interfaceId,
        'Account imported successfully',
        `Address: ${account.address}`,
    );
}
