import { showErrorScreen, showTextScreen } from "./screen";
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

    try {
        const client = createClient(state.sharedSecret, state.fcmToken);
        const keyring = new TlockKeyring(client, state?.keyringState);
        const account = await keyring.createAccount({});
        await showTextScreen(interfaceId, "Account imported successfully", `Address: ${account.address}`);
    } catch (error) {
        console.error("Failed to import account:", error);
        await showErrorScreen(interfaceId, "Failed to import account. Please try again.");
        return;
    }

    return;
}
