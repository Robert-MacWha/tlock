import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { useKeyringContext } from "../../contexts/KeyringContext";
import { Text, IconButton, Dialog, Portal, Button, Surface } from "react-native-paper";
import { AccountCard } from "../../components/AccountCard";
import { Stack } from "expo-router";
import { useAlert } from "../../components/AlertProvider";

export default function AccountsScreen() {
    const { accounts, addAccount } = useKeyringContext();
    const [showHidden, setShowHidden] = useState(false);
    const [helpVisible, setHelpVisible] = useState(false);
    const { alert } = useAlert();

    const displayedAccounts = showHidden
        ? accounts
        : accounts.filter(account => !account.isHidden);

    async function handleAddAccount() {
        try {
            await addAccount();
        } catch (error) {
            console.error('Failed to create account:', error);
            alert('Error', 'Failed to create new account. Please try again.');
        }
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerRight: () => (
                        <View style={{ flexDirection: 'row' }}>
                            <IconButton
                                icon="help-circle-outline"
                                onPress={() => setHelpVisible(true)}
                            />
                            <IconButton
                                icon={showHidden ? "eye" : "eye-off"}
                                onPress={() => setShowHidden(!showHidden)}
                            />
                            <IconButton
                                icon="plus"
                                onPress={() => void handleAddAccount()}
                            />
                        </View>
                    ),
                }}
            />

            <Surface style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
                    {displayedAccounts.length === 0 ? (
                        <Text>No accounts available.</Text>
                    ) : (
                        displayedAccounts.map(account => (
                            <AccountCard
                                key={account.address}
                                address={account.address}
                            />
                        ))
                    )}
                </ScrollView>
            </Surface>

            <Portal>
                <Dialog visible={helpVisible} onDismiss={() => setHelpVisible(false)}>
                    <Dialog.Title>Your Wallets</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
                            These are your blockchain accounts with private keys stored securely on this device.
                        </Text>
                        <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
                            - Tap + to create a new wallet account
                        </Text>
                        <Text variant="bodyMedium">
                            - Connected devices can request signatures from these accounts
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setHelpVisible(false)}>Got it</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </>
    )
}