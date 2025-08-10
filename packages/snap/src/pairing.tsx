import {
    createQrCode,
    generateSharedSecret,
    createClient,
} from '@tlock/shared';
import { getState, updateState } from './state';
import qrcode from 'qrcode';
import { showErrorScreen, showScreen } from './screen';
import { Box, Button, Heading, Image, Text } from '@metamask/snaps-sdk/jsx';
import { SCREENS, ERROR_CODES } from './constants';
import { handleError } from './errors';
import { validateSharedSecret } from './utils';

export async function showPairingScreen(interfaceId: string) {
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
                <Button name={SCREENS.CONFIRM_PAIR}>I've Scanned the Code</Button>
            </Box>,
        );

        try {
            await client.pollUntilDeviceRegistered(200, 120);
            await showConfirmPairingScreen(interfaceId);
        } catch (error) {
            // Just let it fail silently since the user can select the confirm pairing button
            console.error('Error polling for device registration:', error);
        }

    } catch (error) {
        handleError(error, ERROR_CODES.PAIRING_FAILED, 'Error generating pairing data');
    }
}

export async function showConfirmPairingScreen(interfaceId: string) {
    const state = await getState();
    validateSharedSecret(state);

    const client = createClient(state.sharedSecret);

    const registeredDevice = await client.getDevice();
    if (!registeredDevice) {
        await showErrorScreen(interfaceId, 'Device not registered. Please re-try pairing');
        return;
    }

    await updateState({
        sharedSecret: state.sharedSecret,
        fcmToken: registeredDevice.fcmToken,
    });

    await showScreen(
        interfaceId,
        <Box>
            <Heading>Pairing Successful!</Heading>
            <Text>Your device has been successfully paired.</Text>
            <Button name={SCREENS.IMPORT_ACCOUNT}>Import First Account</Button>
        </Box>,
    );
}
