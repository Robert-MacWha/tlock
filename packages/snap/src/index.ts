import {
    type OnRpcRequestHandler,
    type OnHomePageHandler,
    type OnUserInputHandler,
    type OnKeyringRequestHandler,
    type Json,
    UserInputEventType,
} from '@metamask/snaps-sdk';
import { createClient } from '@lodgelock/shared';
import { getState } from './state';
import { LodgelockKeyring } from './keyring';
import { handleKeyringRequest } from '@metamask/keyring-snap-sdk';
import { validatePairedState } from './utils';
import { initializeInterface, showErrorScreen } from './screen';
import { SCREENS } from './constants';
import { handleHomeScreen as showHomeScreen } from './homeScreen';
import { showPairingScreen } from './pairing';
import { handleImportAccount as showImportAccountScreen } from './importAccount';
import { handleSettingsScreen, handleFirebaseUrlSave } from './settings';

// Home page UI
export const onHomePage: OnHomePageHandler = async () => {
    console.log('Rendering home page');
    return await initializeInterface();
};

// Handle UI interactions and RPC calls
export const onRpcRequest: OnRpcRequestHandler = async ({ request }) => {
    console.log('RPC Request:', request);
    return { success: false };
};

export const onUserInput: OnUserInputHandler = async ({ id, event }) => {
    console.log('User input event:', id, event);

    if (event.type === UserInputEventType.ButtonClickEvent) {
        const buttonName = event.name;
        await selectScreen(id, buttonName);
        return;
    }

    if (event.type === UserInputEventType.FormSubmitEvent) {
        if (event.name === 'firebaseSettings') {
            const firebaseUrl = event.value['firebaseUrl'] as string;
            await handleFirebaseUrlSave(id, firebaseUrl);
            return;
        }
    }
};

export const onKeyringRequest: OnKeyringRequestHandler = async ({
    origin,
    request,
}): Promise<Json> => {
    console.log('Keyring request from origin:', origin, 'Request:', request);

    const state = await getState();
    validatePairedState(state);

    const client = createClient(
        state.sharedSecret,
        state.fcmToken,
        state.firebaseUrl,
    );
    const keyring = new LodgelockKeyring(client, state.keyringState, origin);
    console.log('Handling keyring request:', request);
    const resp = await handleKeyringRequest(keyring, request);
    if (resp) {
        return resp;
    }
    return null;
};

export async function selectScreen(
    interfaceId: string,
    screen: string | undefined,
) {
    try {
        switch (screen) {
            case SCREENS.HOME:
                await showHomeScreen(interfaceId);
                return;
            case SCREENS.PAIR:
                await showPairingScreen(interfaceId);
                return;
            case SCREENS.IMPORT_ACCOUNT:
                await showImportAccountScreen(interfaceId);
                return;
            case SCREENS.SETTINGS:
                await handleSettingsScreen(interfaceId);
                return;
            default:
                console.log('Unknown button clicked:', screen);
                return;
        }
    } catch (error) {
        console.error(
            `Error showing screen screen=${screen} err=${error as string}`,
        );
        if (error instanceof Error) {
            await showErrorScreen(interfaceId, error.message);
        } else {
            await showErrorScreen(interfaceId, 'An unexpected error occurred');
        }
    }
}
