import { createClient } from '@lodgelock/shared';
import { showErrorScreen, showScreen } from './screen';
import { Box, Button, Heading, Image, Text } from '@metamask/snaps-sdk/jsx';
import { SCREENS } from './constants';
import { PairingService } from './pairingService';
import { getState } from './state';

export async function showPairingScreen(interfaceId: string) {
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

    const state = await getState();
    const client = createClient(sharedSecret, undefined, state?.firebaseUrl);

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
                Your device {response.deviceName} has been successfully paired.
            </Text>
            <Button name={SCREENS.IMPORT_ACCOUNT}>Import First Account</Button>
        </Box>,
    );
}
