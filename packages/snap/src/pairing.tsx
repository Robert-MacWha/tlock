import { createQrCode, createSecuredClient, generateSharedSecret } from "@tlock/shared";
import { getState, updateState } from "./state";
import qrcode from 'qrcode';
import { showErrorScreen, showScreen } from "./screen";
import { Box, Button, Heading, Image, Text } from "@metamask/snaps-sdk/jsx";

export async function handlePair(interfaceId: string) {
    console.log('Handling pairing logic');

    try {
        // Generate random 128-bit secret
        const sharedSecret = await generateSharedSecret();
        const qrData = await createQrCode(sharedSecret);
        const secretQR = await qrcode.toString(qrData);

        // Save shared secret to persistent storage
        updateState({
            sharedSecret,
        });

        console.log("Show pairing screen");
        await showScreen(interfaceId, (
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

export async function handleConfirmPair(interfaceId: string) {
    console.log('Confirming pairing');

    const state = await getState();
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
    const client = createSecuredClient(sharedSecret);

    const registeredDevice = await client.getDevice();
    if (!registeredDevice) {
        console.error("Device not registered yet");
        await showErrorScreen(interfaceId, 'Device not registered. Please scan the QR code with your mobile app.');
        return;
    }

    console.log('Device registered:', registeredDevice);

    updateState({
        sharedSecret: sharedSecret,
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