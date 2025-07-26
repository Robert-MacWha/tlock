import { Box, Heading, Text } from "@metamask/snaps-sdk/jsx";
import { showErrorScreen, showScreen, showTextScreen } from "./screen";
import { createClient, ImportAccountRequest } from "@tlock/shared";
import { getState } from "./state";
import { emitSnapKeyringEvent, KeyringAccount, KeyringEvent } from "@metamask/keyring-api";
import {
    EthAccountType,
    EthMethod,
} from '@metamask/keyring-api';
import { v4 as uuid } from 'uuid';

export async function handleImportAccount(interfaceId: string) {
    await showTextScreen(interfaceId, "Importing account...");

    const state = await getState();
    if (!state || !state.sharedSecret || !state.fcmToken) {
        await showErrorScreen(interfaceId, "No paired device found");
        return;
    }

    await showTextScreen(interfaceId, "Importing account...", "Please check your device for approval");

    const client = createClient(state.sharedSecret, state.fcmToken);
    const requestId = await client.submitRequest('importAccount', { status: 'pending' });

    // Wait for the account to be selected
    let response: ImportAccountRequest;
    try {
        response = await client.pollUntil(
            requestId,
            'importAccount',
            500, // ms
            60,  // s
            (r: ImportAccountRequest) => r.status !== 'pending'
        );
        await client.deleteRequest(requestId);

        if (response.status !== 'approved') {
            await showErrorScreen(interfaceId, "Request not approved", "Please try again");
            return;
        }

        if (!response.address) {
            throw new Error("Account import failed, no address returned");
        }
    } catch (error) {
        console.error("Error importing account:", error);
        await showErrorScreen(interfaceId, "Failed to import account", "Please try again");
        return;
    }

    // TODO: Use the keyring class instead of manually emitting events
    const id = uuid();
    const address = response.address;
    const account: KeyringAccount = {
        id,
        address,
        options: {},
        methods: [
            EthMethod.PersonalSign,
            EthMethod.Sign,
            EthMethod.SignTransaction,
            EthMethod.SignTypedDataV1,
            EthMethod.SignTypedDataV3,
            EthMethod.SignTypedDataV4,
        ],
        type: EthAccountType.Eoa,
    };
    await emitSnapKeyringEvent(snap, KeyringEvent.AccountCreated, {
        account,
        accountNameSuggestion: 'Tlock Account',
    });

    // Show success screen
    await showScreen(interfaceId, (
        <Box>
            <Heading>Account imported successfully!</Heading>
            <Text>Address: {address}</Text>
        </Box>
    ));

    return;
}
