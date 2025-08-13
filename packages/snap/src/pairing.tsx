import { createClient, PairRequest } from '@tlock/shared';
import { showErrorScreen, showScreen } from './screen';
import { Box, Button, Heading, Image, Text } from '@metamask/snaps-sdk/jsx';
import { SCREENS, ERROR_CODES } from './constants';
import { handleError } from './errors';
import { PairingService } from './pairingService';

export async function showPairingScreen(interfaceId: string) {
    try {
        const pairingService = new PairingService();
        const { qrSrc, requestId, sharedSecret } =
            await pairingService.startPairing();

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
            const client = createClient(sharedSecret);
            const response = await pairingService.waitForPairing(
                requestId,
                client,
                sharedSecret,
            );
            await showConfirmPairingScreen(interfaceId, response);
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
