import { Box, Heading, Text } from "@metamask/snaps-sdk/jsx";
import { showErrorScreen, showScreen } from "./screen";
import { createSecuredClient, CreateAccountRequest } from "@tlock/shared";
import { getState } from "./state";
import { emitSnapKeyringEvent, KeyringAccount, KeyringEvent } from "@metamask/keyring-api";
import {
    EthAccountType,
    EthMethod,
} from '@metamask/keyring-api';
import { v4 as uuid } from 'uuid';

export async function handleCreateAccount(interfaceId: string) {
    await showScreen(interfaceId, (
        <Box>
            <Heading>Creating new account... check phone for next steps</Heading>
        </Box>
    ));

    const state = await getState();
    if (!state || !state.sharedSecret || !state.fcmToken) {
        await showErrorScreen(interfaceId, "No paired device found");
        return;
    }

    const client = createSecuredClient(state.sharedSecret, state.fcmToken);
    const requestId = await client.submitRequest('createAccount', { status: 'pending' });

    // Wait for the account to be created
    let response: CreateAccountRequest;
    try {
        response = await client.pollUntil(
            requestId,
            'createAccount',
            500, // ms
            60,  // s
            (r: CreateAccountRequest) => r.status !== 'pending'
        );
        await client.deleteRequest(requestId);

        if (response.status !== 'approved') {
            await showErrorScreen(interfaceId, "Account creation request was not approved");
            return;
        }

        if (!response.address) {
            throw new Error("Account creation failed, no address returned");
        }
    } catch (error) {
        console.error("Error creating account:", error);
        await showErrorScreen(interfaceId, "Failed to create account. Please try again.");
        return;
    }

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
            <Heading>Account created successfully!</Heading>
            <Text>Address: {address}</Text>
        </Box>
    ));

    return;
}
