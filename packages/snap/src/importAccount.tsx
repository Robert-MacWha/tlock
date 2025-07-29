import { Box, Heading, Text } from "@metamask/snaps-sdk/jsx";
import { showErrorScreen, showScreen, showTextScreen } from "./screen";
import { createClient } from "@tlock/shared";
import { getState } from "./state";
import { TlockKeyring } from "./keyring";

export async function handleImportAccount(interfaceId: string) {
    await showTextScreen(interfaceId, "Importing account...");

    const state = await getState();
    if (!state || !state.sharedSecret || !state.fcmToken) {
        await showErrorScreen(interfaceId, "No paired device found");
        return;
    }

    await showTextScreen(interfaceId, "Importing account...", "Please check your device for approval");

    const client = createClient(state.sharedSecret, state.fcmToken);
    const keyring = new TlockKeyring(client, state?.keyringState);
    const account = await keyring.createAccount({});

    await showTextScreen(interfaceId, "Account imported successfully", `Address: ${account.address}`);

    return;
}
