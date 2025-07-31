import React, { useState } from 'react';
import { useSetupStatus } from "../../hooks/useSetupStatus";
import { useKeyringContext } from "../../contexts/KeyringContext";
import { router } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { SeedPhraseDisplay } from '../../components/SeedPhraseDisplay';
import { useAuthenticator } from '../../hooks/useAuthenticator';
import { Badge, Button, List, Modal, Portal, Surface } from 'react-native-paper';
import { useAlert } from '../../components/AlertProvider';
import { useRequestReceiverContext } from '../../contexts/RequestRecieverContext';
import { useClientsContext } from '../../contexts/ClientContext';

export default function SettingsScreen() {
    const { setIsSetupComplete } = useSetupStatus();
    const { getSeedPhrase } = useKeyringContext();
    const { authenticate } = useAuthenticator();
    const [showSeedPhrasePopup, setShowSeedPhrasePopup] = useState(false);
    const [seedPhrase, setSeedPhrase] = useState<string>('');
    const { alert } = useAlert();
    const { clientRequests } = useRequestReceiverContext();
    const { clients } = useClientsContext();

    const hasRequests = clientRequests.length > 0;
    const hasClients = clients.length > 0;

    const resetApp = async () => {
        try {
            await authenticate();
            await SecureStore.deleteItemAsync('tlock_setup_complete');
            await setIsSetupComplete(false);
            router.replace('/_setup');
        } catch (_error) {
            alert('Error', 'Failed to reset setup. Please try again.');
        }
    };

    const showSeedPhrase = async () => {
        try {
            const phrase = await getSeedPhrase();
            setSeedPhrase(phrase);
            setShowSeedPhrasePopup(true);
        } catch (_error) {
            alert('Error', 'Failed to retrieve seed phrase. Please try again.');
        }
    };

    const alertShowSeedPhrase = async () => {
        alert(
            'Security Warning',
            'Your seed phrase will be displayed on screen. Make sure no one else can see your device.',
            [
                {
                    text: 'Cancel',
                },
                {
                    text: 'Show',
                    mode: 'outlined',
                    onPress: () => { void showSeedPhrase() },
                },
            ]
        );
    };

    const alertReset = async () => {
        alert(
            'Reset App',
            'This will clear your setup status and require you to go through initial setup again. All data within the app will be rest. Are you sure?',
            [
                {
                    text: 'Cancel',
                },
                {
                    text: 'Reset',
                    mode: 'outlined',
                    onPress: () => { void resetApp(); },
                },
            ]
        );
    };

    return (
        <>
            <Surface style={{ flex: 1, padding: 16, gap: 16 }}>
                <List.Section>
                    <List.Item
                        title="Connected Wallets"
                        left={props => <List.Icon {...props} icon="devices" />}
                        right={() =>
                            !hasClients ? (
                                <Badge
                                    size={8}
                                    style={{
                                        alignSelf: 'center',
                                        backgroundColor: 'red'
                                    }}
                                />
                            ) : null
                        }
                        onPress={() => router.push('/clients')}
                    />
                    <List.Item
                        title="Request"
                        left={props => <List.Icon {...props} icon="clipboard-check-outline" />}
                        right={() =>
                            hasRequests ? (
                                <Badge
                                    size={8}
                                    style={{
                                        alignSelf: 'center',
                                        backgroundColor: 'red'
                                    }}
                                />
                            ) : null
                        }
                        onPress={() => router.push('/requests')}
                    />
                    <List.Item
                        title="Docs"
                        left={props => <List.Icon {...props} icon="file-document-multiple-outline" />}
                        onPress={() => router.push('/_docs/root')}
                    />
                    <List.Subheader>Advanced</List.Subheader>
                    <List.Item
                        title="Show Seed Phrase"
                        left={props => <List.Icon {...props} icon="key-outline" />}
                        onPress={() => void alertShowSeedPhrase()}
                    />
                    <List.Item
                        title="Reset Setup"
                        left={props => <List.Icon {...props} icon="refresh" />}
                        onPress={() => void alertReset()}
                    />
                </List.Section>
            </Surface>

            <Portal>
                <Modal
                    visible={showSeedPhrasePopup}
                    style={{ padding: 32 }}
                    onDismiss={() => setShowSeedPhrasePopup(false)}
                >
                    <SeedPhraseDisplay
                        seedPhrase={seedPhrase}
                    />
                    <Button
                        mode="contained"
                        style={{ marginTop: 16 }}
                        onPress={() => setShowSeedPhrasePopup(false)}
                    >
                        Close
                    </Button>
                </Modal>
            </Portal>
        </>
    );
}
