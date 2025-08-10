import { ComponentOrElement } from "@metamask/snaps-sdk";
import { Box, Button, Heading, Text } from "@metamask/snaps-sdk/jsx";
import { SCREENS } from './constants';
import { handleHomeScreen } from './homeScreen';

export async function initializeInterface() {
    const interfaceId = await snap.request({
        method: 'snap_createInterface',
        params: {
            ui: (<Heading>2FA Wallet</Heading>)
        }
    });

    await handleHomeScreen(interfaceId);
    return { id: interfaceId };
}

export async function showTextScreen(interfaceId: string, title?: string, text?: string) {
    return await snap.request({
        method: 'snap_updateInterface',
        params: {
            id: interfaceId,
            ui: (
                <Box>
                    {title ? <Heading>{title}</Heading> : null}
                    {text ? <Text>{text}</Text> : null}
                </Box>
            )
        }
    });
}

export async function showErrorScreen(interfaceId: string, message: string, text?: string) {
    console.error('Error:', message);

    await showScreen(interfaceId, (
        <Box>
            <Heading>Error: {message}</Heading>
            {text ? <Text>{text}</Text> : null}
            <Button name={SCREENS.HOME}>Home</Button>
        </Box>
    ));
}

export async function showScreen(interfaceId: string, ui: ComponentOrElement) {
    console.log('Updating interface with new screen');

    await snap.request({
        method: 'snap_updateInterface',
        params: {
            id: interfaceId,
            ui
        }
    });
}