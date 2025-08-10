import { type OnRpcRequestHandler, type OnHomePageHandler, type OnUserInputHandler, type OnKeyringRequestHandler, type Json, UserInputEventType } from '@metamask/snaps-sdk';
import { Box, Text, Heading, Button } from '@metamask/snaps-sdk/jsx';
import { createClient } from '@tlock/shared';
import { getState, SnapState } from './state';
import { showErrorScreen, showScreen } from './screen';
import { handleConfirmPair, handlePair } from './pairing';
import { TlockKeyring } from './keyring';
import { handleImportAccount } from './importAccount';
import { handleKeyringRequest } from '@metamask/keyring-api';

// Home page UI
export const onHomePage: OnHomePageHandler = async () => {
    console.log('Rendering home page');

    const interfaceId = await snap.request({
        method: 'snap_createInterface',
        params: {
            ui: (<Heading>2FA Wallet</Heading>)
        }
    });

    await handleHomeScreen(interfaceId);

    return {
        id: interfaceId
    };
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
        await handleShowScreen(id, buttonName);
        return;
    }
}

export const onKeyringRequest: OnKeyringRequestHandler = async ({ origin, request }): Promise<Json> => {
    console.log('Keyring request from origin:', origin, 'Request:', request);

    const state = await getState();
    if (!state || !state.sharedSecret || !state.fcmToken) {
        console.error('No shared secret or FCM token found in state');
        throw new Error('Device is not paired. Please pair your device first.');
    }

    const client = createClient(state.sharedSecret, state.fcmToken);
    const keyring = new TlockKeyring(client, state.keyringState, origin);
    console.log('Handling keyring request:', request);
    return (await handleKeyringRequest(keyring, request)) ?? null;
}

export async function handleShowScreen(interfaceId: string, screen: string | undefined) {
    try {
        switch (screen) {
            case 'home':
                await handleHomeScreen(interfaceId);
                return;
            case 'pair':
                await handlePair(interfaceId);
                return;
            case 'confirm-pair':
                await handleConfirmPair(interfaceId);
                return;
            case 'import-account':
                await handleImportAccount(interfaceId);
                return;
            default:
                console.log('Unknown button clicked:', screen);
                return;
        }
    } catch (error) {
        console.error(`Error showing screen screen=${screen} err=${error as string}`);
        if (error instanceof Error) {
            await showErrorScreen(interfaceId, error.message);
        } else {
            await showErrorScreen(interfaceId, 'An unexpected error occurred');
        }
    }
}

async function handleHomeScreen(interfaceId: string) {
    try {
        const state = await getState();
        if (state && state.fcmToken) {
            await showPairedScreen(state, interfaceId);
            return;
        }
    } catch (error) {
        // If state retrieval fails, assume device is not paired
        console.error('Error retrieving state:', error);
    }

    await showScreen(interfaceId, (
        <Box>
            <Heading>Foxguard</Heading>
            <Text>Your wallet is not paired. Pair it with the app to start using Foxguard accounts.</Text>
            <Button name="pair">Pair Wallet</Button>
        </Box>
    ));
}

async function showPairedScreen(state: SnapState, interfaceId: string) {
    await showScreen(interfaceId, (
        <Box>
            <Heading>Foxguard</Heading>
            <Button name="import-account">Import Account</Button>
            <Button name="pair">Re-pair wallet</Button>
        </Box>
    ));
}
