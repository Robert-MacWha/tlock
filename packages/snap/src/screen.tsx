import { ComponentOrElement } from "@metamask/snaps-sdk";
import { Box, Button, Heading, Text } from "@metamask/snaps-sdk/jsx";

export async function showErrorScreen(interfaceId: string, message: string) {
    console.error('Error:', message);

    await showScreen(interfaceId, (
        <Box>
            <Heading>Error</Heading>
            <Text>{message}</Text>
            <Button name="home">Home</Button>
        </Box>
    ));
}

export async function showScreen(interfaceId: string, ui: ComponentOrElement) {
    console.log('Updating interface with new screen');

    return await snap.request({
        method: 'snap_updateInterface',
        params: {
            id: interfaceId,
            ui
        }
    });

}