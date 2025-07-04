import type { OnRpcRequestHandler, OnHomePageHandler, OnUserInputHandler, UserInputEvent, ComponentOrElement } from '@metamask/snaps-sdk';
import { Box, Text, Heading, Button, Image } from '@metamask/snaps-sdk/jsx';
import qrcode from 'qrcode';

async function generatePairingData(): Promise<{ sharedSecret: number[], roomId: string }> {
    const sharedSecret = new Uint8Array(32);
    crypto.getRandomValues(sharedSecret);

    // Derive deterministic room ID from secret
    const roomIdBytes = await crypto.subtle.digest('SHA-256', sharedSecret);
    const roomId = Array.from(new Uint8Array(roomIdBytes.slice(0, 16)),
        byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();

    return {
        sharedSecret: Array.from(sharedSecret),
        roomId
    };
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

    showHomeScreen(interfaceId);

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

    switch (buttonName) {
        case 'home':
            return showHomeScreen(interfaceId);
        case 'pair':
            return showPairingScreen(interfaceId);
        default:
            console.log('Unknown button clicked:', buttonName);
            return;
    }
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

async function showHomeScreen(interfaceId: string) {
    console.log('Showing home screen');

    showScreen(interfaceId, (
        <Box>
            <Heading>2FA Wallet</Heading>
            <Button name="pair">Pair Device</Button>
        </Box>
    ));
}

async function showPairingScreen(interfaceId: string) {
    console.log('Handling pairing logic');

    try {
        // Generate random 128-bit secret
        const { sharedSecret, roomId } = await generatePairingData();
        const qrData = `skylock://pair/${btoa(JSON.stringify({
            roomId,
            sharedSecret: Array.from(sharedSecret)
        }))}`;
        const secretQR = await qrcode.toString(qrData);

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