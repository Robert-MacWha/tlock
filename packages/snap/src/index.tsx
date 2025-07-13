import type { OnRpcRequestHandler, OnHomePageHandler, OnUserInputHandler, UserInputEvent, OnKeyringRequestHandler, Json } from '@metamask/snaps-sdk';
import { Box, Text, Heading, Button } from '@metamask/snaps-sdk/jsx';
import { createSecuredClient, deriveRoomId, SecureClient, SharedSecret } from '@tlock/shared';
import { getState } from './state';
import { showErrorScreen, showScreen } from './screen';
import { handleConfirmPair, handlePair } from './pairing';
import { handleCreateAccount } from './account';
import { TlockKeyring } from './keyring';
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

    if (event.type === 'ButtonClickEvent') {
        await handleButtonClick(id, event);
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

    const client = createSecuredClient(state.sharedSecret, state.fcmToken);
    const keyring = new TlockKeyring(client, state.keyringState);
    return (await handleKeyringRequest(keyring, request)) ?? null;
}

async function handleButtonClick(interfaceId: string, event: UserInputEvent) {
    const buttonName = event.name;
    console.log('Button clicked:', buttonName);

    try {
        switch (buttonName) {
            case 'home':
                await handleHomeScreen(interfaceId);
                return;
            case 'pair':
                await handlePair(interfaceId);
                return;
            case 'confirm-pair':
                await handleConfirmPair(interfaceId);
                return;
            case 'create-account':
                await handleCreateAccount(interfaceId);
                return;
            default:
                console.log('Unknown button clicked:', buttonName);
                return;
        }
    } catch (error) {
        console.error(`Error handling button click button=${buttonName} err=${error}`);
        if (error instanceof Error) {
            await showErrorScreen(interfaceId, error.message);
        } else {
            await showErrorScreen(interfaceId, 'An unexpected error occurred');
        }
    }
}

async function handleHomeScreen(interfaceId: string) {
    console.log('Showing home screen');

    try {
        console.log('Retrieving state for pairing check');
        const state = await getState();
        console.log('Current state:', state);
        if (state && state.fcmToken) {
            const roomId = deriveRoomId(state.sharedSecret || []).substring(0, 4);
            await showScreen(interfaceId, (
                <Box>
                    <Heading>2FA Wallet</Heading>
                    <Text>Paired to device</Text>
                    <Text>Room ID: {roomId}</Text>
                    <Button name="pair">Replace Paired Device</Button>
                    <Button name="create-account">Create Account</Button>
                </Box>
            ));
            return;
        } else {
            console.log('Device is not paired');
        }
    } catch (error) {
        // If state retrieval fails, assume device is not paired
        console.error('Error retrieving state:', error);
    }

    await showScreen(interfaceId, (
        <Box>
            <Heading>2FA Wallet</Heading>
            <Text>Your device is not paired.</Text>
            <Button name="pair">Pair Device</Button>
        </Box>
    ));
}