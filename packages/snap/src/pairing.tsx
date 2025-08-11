import {
    createQrCode,
    generateSharedSecret,
    createClient,
    PairRequest,
} from '@tlock/shared';
import { getState, updateState } from './state';
import qrcode from 'qrcode';
import { showErrorScreen, showScreen } from './screen';
import { Box, Button, Heading, Image, Text } from '@metamask/snaps-sdk/jsx';
import { SCREENS, ERROR_CODES, POLL_INTERVAL } from './constants';
import { handleError } from './errors';
import { validateSharedSecret } from './utils';

export async function showPairingScreen(interfaceId: string) {
    try {
        // Generate & save 128-bit secret
        const sharedSecret = generateSharedSecret();
        const client = createClient(sharedSecret);

        const requestId = await client.submitRequest('pair', {
            status: 'pending',
            fcmToken: '',
            deviceName: '',
        });

        await updateState({
            sharedSecret,
        });

        const qrData = await createQrCode(sharedSecret, requestId);
        const qrSrc = await qrcode.toString(qrData);

        await showScreen(
            interfaceId,
            <Box>
                <Heading>Pair Your Wallet</Heading>
                <Text>
                    Open the Foxguard mobile app and scan this QR code to pair:
                </Text>
                <Image src={qrSrc} alt="Pairing QR Code" />
                <Button name={SCREENS.HOME}>Cancel Pairing</Button>
            </Box>,
        );

        try {
            const resp = await client.pollUntil(
                requestId,
                'pair',
                POLL_INTERVAL,
                300,
                (resp) => {
                    return resp.status !== 'pending';
                },
            );
            await showConfirmPairingScreen(interfaceId, resp);
        } catch (error) {
            console.error('Error polling for device registration:', error);
            await showErrorScreen(
                interfaceId,
                'Pairing timed out. Please try again.',
            );
        }
    } catch (error) {
        handleError(
            error,
            ERROR_CODES.PAIRING_FAILED,
            'Error generating pairing data',
        );
    }
}

export async function showConfirmPairingScreen(
    interfaceId: string,
    resp: PairRequest,
) {
    const state = await getState();
    validateSharedSecret(state);

    await updateState({
        sharedSecret: state.sharedSecret,
        fcmToken: resp.fcmToken,
        deviceName: resp.deviceName,
    });

    await showScreen(
        interfaceId,
        <Box>
            <Heading>Pairing Successful!</Heading>
            <Text>
                Your device {resp.deviceName} has been successfully paired.
            </Text>
            <Button name={SCREENS.IMPORT_ACCOUNT}>Import First Account</Button>
        </Box>,
    );
}
