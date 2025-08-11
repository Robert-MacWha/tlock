import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
    Text,
    IconButton,
    Dialog,
    Portal,
    Button,
    Surface,
} from 'react-native-paper';
import { Stack } from 'expo-router';
// import * as Notifications from 'expo-notifications';
import { parseQrCode } from '@tlock/shared';
import { useClientsContext } from '../contexts/ClientContext';
import { ClientCard } from '../components/ClientCard';
import { QrCodeDialog } from '../components/QrCodeDialog';
import { useAlert } from '../components/AlertProvider';

export default function App() {
    const [pairing, setPairing] = useState<boolean>(false);
    const [helpVisible, setHelpVisible] = useState<boolean>(false);
    const { clients, addClient } = useClientsContext();
    const { alert } = useAlert();

    const onBarcodeScanned = async (data: string) => {
        try {
            const sharedSecret = await parseQrCode(data);
            const client = await addClient(sharedSecret, 'React Native App');

            // const fcmToken = (await Notifications.getExpoPushTokenAsync()).data;
            const fcmToken = 'new-fcm-token';
            await client.client.submitDevice(fcmToken, 'React Native App');
            await addClient(sharedSecret, 'New Client');
            alert('Success', 'Device paired successfully!');
        } catch (error) {
            console.error('Pairing failed:', error);
            alert('Error', 'Failed to pair device. Please try again.');
        } finally {
            setPairing(false);
        }
    };

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
                                icon="plus"
                                onPress={() => setPairing(true)}
                            />
                        </View>
                    ),
                }}
            />

            <Surface style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ gap: 16, padding: 24 }}>
                    {clients.length === 0 ? (
                        <Text variant="bodyMedium">
                            No wallets connected. Tap the + button then follow
                            the on-screen instructions to add a wallet.
                        </Text>
                    ) : (
                        clients.map((client) => {
                            return (
                                <ClientCard key={client.id} id={client.id} />
                            );
                        })
                    )}
                </ScrollView>
            </Surface>

            <Portal>
                <Dialog
                    visible={helpVisible}
                    onDismiss={() => setHelpVisible(false)}
                >
                    <Dialog.Title>Connected Devices</Dialog.Title>
                    <Dialog.Content>
                        <Text
                            variant="titleMedium"
                            style={{ marginBottom: 12 }}
                        >
                            This page shows devices (like MetaMask or other
                            wallets) that can request signatures from your
                            accounts. To connect a new device:
                        </Text>
                        <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
                            - On the device you want to connect, open Metamask
                            Flask, navigate to Settings {'>'} Snaps {'>'}{' '}
                            Foxguard and click "Pair Device".
                        </Text>
                        <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
                            - In this app, tap the + button to pair a new device
                            by scanning its QR code
                        </Text>
                        <Text
                            variant="titleMedium"
                            style={{ marginBottom: 12 }}
                        >
                            Once paired, you can manage connected devices here
                        </Text>
                        <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
                            - Connected devices can request you to sign
                            transactions
                        </Text>
                        <Text variant="bodyMedium">
                            - Your private keys stay secure on this device -
                            only signatures are sent
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setHelpVisible(false)}>
                            Got it
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <QrCodeDialog
                visible={pairing}
                instructions={
                    'Scan the QR code in your wallet to pair it with this app.'
                }
                onDismiss={() => setPairing(false)}
                onBarcodeScanned={(data) => {
                    void onBarcodeScanned(data);
                }}
            />
        </>
    );
}
