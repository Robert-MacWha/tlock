import { ComponentOrElement } from "@metamask/snaps-sdk";
import { Box, Button, Heading, Text } from "@metamask/snaps-sdk/jsx";

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