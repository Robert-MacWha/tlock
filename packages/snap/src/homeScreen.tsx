import { Box, Heading, Text, Button } from '@metamask/snaps-sdk/jsx';
import { getState, SnapState } from './state';
import { showScreen } from './screen';
import { SCREENS } from './constants';

export async function handleHomeScreen(interfaceId: string) {
    try {
        const state = await getState();
        if (state && state.fcmToken) {
            await showPairedScreen(state, interfaceId);
            return;
        }
    } catch (error) {
        // If state retrieval fails, assume device is not paired
        console.error('Error retrieving state:', error);
    }

    await showScreen(
        interfaceId,
        <Box>
            <Heading>Lodgelock</Heading>
            <Text>
                Your wallet is not paired. Pair it with the app to start using
                Lodgelock accounts.
            </Text>
            <Button name={SCREENS.PAIR}>Pair Wallet</Button>
            <Button name={SCREENS.SETTINGS}>Settings</Button>
        </Box>,
    );
}

async function showPairedScreen(state: SnapState, interfaceId: string) {
    await showScreen(
        interfaceId,
        <Box>
            <Heading>Lodgelock</Heading>
            <Button name={SCREENS.IMPORT_ACCOUNT}>Import Account</Button>
            <Button name={SCREENS.PAIR}>Re-pair wallet</Button>
            <Button name={SCREENS.SETTINGS}>Settings</Button>
        </Box>,
    );
}
