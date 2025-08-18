import { createClient } from '@lodgelock/shared';
import { showErrorScreen, showScreen } from './screen';
import { Box, Button, Heading, Image, Text } from '@metamask/snaps-sdk/jsx';
import { SCREENS, ERROR_CODES } from './constants';
import { handleError } from './errors';
import { PairingService } from './pairingService';
import { getState } from './state';

export async function showPairingScreen(interfaceId: string) {
    try {
        const pairing = new PairingService();
        const { qrSrc, requestId, sharedSecret } = await pairing.start();

        await showScreen(
            interfaceId,
            <Box>
                <Heading>Pair Your Wallet</Heading>
                <Text>
                    Open the Lodgelock mobile app and scan this QR code to pair:
                </Text>
                <Image src={qrSrc} alt="Pairing QR Code" />
                <Button name={SCREENS.HOME}>Cancel Pairing</Button>
            </Box>,
        );

        try {
            const state = await getState();
            const client = createClient(
                sharedSecret,
                undefined,
                state?.firebaseUrl,
            );

            const response = await pairing.waitForPairing(
                requestId,
                client,
                sharedSecret,
            );

            await showScreen(
                interfaceId,
                <Box>
                    <Heading>Pairing Successful!</Heading>
                    <Text>
                        Your device {response.deviceName} has been successfully
                        paired.
                    </Text>
                    <Button name={SCREENS.IMPORT_ACCOUNT}>
                        Import First Account
                    </Button>
                </Box>,
            );
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
