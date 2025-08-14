import {
    Box,
    Heading,
    Text,
    Button,
    Input,
    Form,
} from '@metamask/snaps-sdk/jsx';
import { getState, updateState } from './state';
import { showScreen } from './screen';
import { SCREENS } from './constants';
import { DEFAULT_FIREBASE_URL } from '@tlock/shared';

export async function handleSettingsScreen(interfaceId: string) {
    const state = await getState();
    const currentFirebaseUrl = state?.firebaseUrl || DEFAULT_FIREBASE_URL;

    await showScreen(
        interfaceId,
        <Box>
            <Heading>Settings</Heading>
            <Text>Configure your Foxguard settings</Text>

            <Form name="firebaseSettings">
                <Text>Firebase Server URL:</Text>
                <Input
                    name="firebaseUrl"
                    type="text"
                    value={currentFirebaseUrl}
                    placeholder="https://your-firebase-url.firebaseio.com/"
                />
                <Button name="save-firebase-url" type="submit">
                    Save Firebase URL
                </Button>
            </Form>

            <Button name={SCREENS.HOME}>Back to Home</Button>
        </Box>,
    );
}

export async function handleFirebaseUrlSave(
    interfaceId: string,
    firebaseUrl: string,
) {
    try {
        // Basic URL validation
        if (!firebaseUrl.trim()) {
            await showScreen(
                interfaceId,
                <Box>
                    <Heading>Error</Heading>
                    <Text>Firebase URL cannot be empty.</Text>
                    <Button name={SCREENS.SETTINGS}>Back to Settings</Button>
                </Box>,
            );
            return;
        }

        try {
            new URL(firebaseUrl);
        } catch {
            await showScreen(
                interfaceId,
                <Box>
                    <Heading>Error</Heading>
                    <Text>Please enter a valid URL.</Text>
                    <Button name={SCREENS.SETTINGS}>Back to Settings</Button>
                </Box>,
            );
            return;
        }

        // Save the Firebase URL to state
        await updateState({ firebaseUrl });

        await showScreen(
            interfaceId,
            <Box>
                <Heading>Success</Heading>
                <Text>Firebase server URL updated successfully!</Text>
                <Button name={SCREENS.SETTINGS}>Back to Settings</Button>
                <Button name={SCREENS.HOME}>Back to Home</Button>
            </Box>,
        );
    } catch (_error) {
        await showScreen(
            interfaceId,
            <Box>
                <Heading>Error</Heading>
                <Text>Failed to update Firebase URL. Please try again.</Text>
                <Button name={SCREENS.SETTINGS}>Back to Settings</Button>
            </Box>,
        );
    }
}
