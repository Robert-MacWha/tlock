import {
    createQrCode,
    generateSharedSecret,
    createClient,
} from '@tlock/shared';
import { getState, updateState } from './state';
import qrcode from 'qrcode';
import { showErrorScreen, showScreen } from './screen';
import { Box, Button, Heading, Image, Text } from '@metamask/snaps-sdk/jsx';
import { handleShowScreen } from 'src';

export async function handlePair(interfaceId: string) {
    try {
        // Generate & save 128-bit secret
        const sharedSecret = generateSharedSecret();
        const client = createClient(sharedSecret);
        const qrData = await createQrCode(sharedSecret);
        const secretQR = await qrcode.toString(qrData);

        await updateState({
            sharedSecret,
        });

        await showScreen(
            interfaceId,
            <Box>
                <Heading>Pair Your Wallet</Heading>
                <Text>Open the Foxguard mobile app and scan this QR code to pair:</Text>
                <Image src={secretQR} alt="Pairing QR Code" />
                <Button name="confirm-pair">I've Scanned the Code</Button>
            </Box>,
        );

        await client.pollUntilDeviceRegistered(200, 60);
        await handleShowScreen(interfaceId, 'confirm-pair');

    } catch (error) {
        let msg = error;
        if (error instanceof Error) {
            msg = error.message;
        }
        console.error('Error generating pairing data:', msg);
        await showErrorScreen(interfaceId, 'Failed to generate pairing data. Please try again');
    }
}

export async function handleConfirmPair(interfaceId: string) {
    const state = await getState();
    if (!state) {
        await showErrorScreen(interfaceId, 'Error: Missing state data');
        return;
    }

    const { sharedSecret } = state;
    if (!sharedSecret) {
        await showErrorScreen(interfaceId, 'Error: Missing shared secret',);
        return;
    }

    const client = createClient(sharedSecret);

    const registeredDevice = await client.getDevice();
    if (!registeredDevice) {
        await showErrorScreen(interfaceId, 'Device not registered. Please re-try pairing');
        return;
    }

    await updateState({
        sharedSecret: sharedSecret,
        fcmToken: registeredDevice.fcmToken,
    });

    await showScreen(
        interfaceId,
        <Box>
            <Heading>Pairing Successful!</Heading>
            <Text>Your device has been successfully paired.</Text>
            <Button name="import-account">Import First Account</Button>
        </Box>,
    );
}
