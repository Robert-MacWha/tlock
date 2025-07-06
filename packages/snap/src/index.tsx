import type { OnRpcRequestHandler, OnHomePageHandler, OnUserInputHandler, UserInputEvent, ComponentOrElement } from '@metamask/snaps-sdk';
import { Box, Text, Heading, Button, Image } from '@metamask/snaps-sdk/jsx';
import { CLOUD_FUNCTION_URL, createQrCode, createSecuredClient, deriveRoomId, FIREBASE_URL, generatePairingData, PairingData } from '@tlock/shared';
import qrcode from 'qrcode';
import { getState, setState } from './state';

interface SnapState {
    sharedSecret?: number[];
    fcmToken?: string;
}

// Home page UI
export const onHomePage: OnHomePageHandler = async () => {
    console.log('Rendering home page');

    const interfaceId = await snap.request({
        method: 'snap_createInterface',
        params: {
            ui: (<Heading>2FA Wallet</Heading>)
        }
    });

    handleHomeScreen(interfaceId);

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
        return await handleButtonClick(id, event);
    }
}

async function handleButtonClick(interfaceId: string, event: UserInputEvent) {
    const buttonName = event.name;
    console.log('Button clicked:', buttonName);

    try {
        switch (buttonName) {
            case 'home':
                return handleHomeScreen(interfaceId);
            case 'pair':
                return handlePair(interfaceId);
            case 'confirm-pair':
                return handleConfirmPair(interfaceId);
            default:
                console.log('Unknown button clicked:', buttonName);
                return;
        }
    } catch (error) {
        console.error('Error handling button click:', error);
        if (error instanceof Error) {
            await showErrorScreen(interfaceId, error.message);
        } else {
            await showErrorScreen(interfaceId, 'An unexpected error occurred');
        }
    }
}

async function handleHomeScreen(interfaceId: string) {
    console.log('Showing home screen');

    showScreen(interfaceId, (
        <Box>
            <Heading>2FA Wallet Test</Heading>
            <Button name="pair">Pair Device</Button>
        </Box>
    ));
}

async function handlePair(interfaceId: string) {
    console.log('Handling pairing logic');

    try {
        // Generate random 128-bit secret
        const { sharedSecret, roomId } = await generatePairingData();
        const qrData = await createQrCode(sharedSecret);
        const secretQR = await qrcode.toString(qrData);

        // Save shared secret to persistent storage
        setState<SnapState>({
            sharedSecret,
        });

        console.log("Show pairing screen");
        showScreen(interfaceId, (
            <Box>
                <Heading>Pair Your Device</Heading>
                <Text>Scan this QR code with your mobile app:</Text>
                <Image src={secretQR} alt="Pairing QR Code" />
                <Button name="confirm-pair">I've Scanned the Code</Button>
                <Button name="home">Home</Button>
            </Box>
        ));
    } catch (error) {
        if (error instanceof Error) {
            error = error.message;
        }
        console.error('Error generating pairing data:', error);
        await showErrorScreen(interfaceId, 'Failed to generate pairing data. Please try again.');
    }
}

async function showErrorScreen(interfaceId: string, message: string) {
    console.error('Error:', message);

    showScreen(interfaceId, (
        <Box>
            <Heading>Error</Heading>
            <Text>{message}</Text>
            <Button name="home">Home</Button>
        </Box>
    ));
}

async function handleConfirmPair(interfaceId: string) {
    console.log('Confirming pairing');

    const state = await getState<SnapState>();
    if (!state) {
        console.error('No shared secret found in state');
        await showErrorScreen(interfaceId, 'No pairing data found');
        return;
    }

    console.log('Current state:', state);

    const { sharedSecret } = state;
    if (!sharedSecret) {
        console.error('Shared secret is not set in state');
        await showErrorScreen(interfaceId, 'Error pairing: shared secret is missing');
        return;
    }

    console.log('Using shared secret:', sharedSecret);

    const roomId = deriveRoomId(sharedSecret);
    const pairingData: PairingData = {
        roomId,
        sharedSecret
    }

    const client = createSecuredClient(
        FIREBASE_URL, CLOUD_FUNCTION_URL, pairingData,
    );

    console.log('Created secured client with roomId:', roomId);

    const registeredDevice = await client.getDevice();
    if (!registeredDevice) {
        console.error("Device not registered yet");
        await showErrorScreen(interfaceId, 'Device not registered. Please scan the QR code with your mobile app.');
        return;
    }

    console.log('Device registered:', registeredDevice);

    setState<SnapState>({
        sharedSecret: pairingData.sharedSecret,
        fcmToken: registeredDevice.fcmToken,
    });

    console.log('Pairing completed successfully');
    showScreen(interfaceId, (
        <Box>
            <Heading>Pairing Successful!</Heading>
            <Text>Your device has been successfully paired.</Text>
            <Button name="home">Home</Button>
        </Box>
    ));
}

async function showScreen(interfaceId: string, ui: ComponentOrElement) {
    console.log('Updating interface with new screen');

    return await snap.request({
        method: 'snap_updateInterface',
        params: {
            id: interfaceId,
            ui
        }
    });

}