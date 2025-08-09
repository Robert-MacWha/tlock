import React, { useState } from 'react';
import { useSetupStatus } from "../../hooks/useSetupStatus";
import { useKeyringContext } from "../../contexts/KeyringContext";
import { router } from "expo-router";
import { SeedPhraseDisplay } from '../../components/SeedPhraseDisplay';
import { Badge, Button, List, Modal, Portal, Surface, SegmentedButtons } from 'react-native-paper';
import { useAlert } from '../../components/AlertProvider';
import { useClientsContext } from '../../contexts/ClientContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useRequestManagerContext } from '../../contexts/RequestManagerContext';

export default function SettingsScreen() {
    const { setIsSetupComplete } = useSetupStatus();
    const { getSeedPhrase } = useKeyringContext();
    const [showSeedPhrasePopup, setShowSeedPhrasePopup] = useState(false);
    const [seedPhrase, setSeedPhrase] = useState<string>('');
    const { alert } = useAlert();
    const { clientRequests } = useRequestManagerContext();
    const { clients } = useClientsContext();
    const { themeMode, setThemeMode } = useTheme();

    const hasRequests = clientRequests.length > 0;
    const hasClients = clients.length > 0;

    const resetApp = () => {
        try {
            setIsSetupComplete(false);
            router.replace('/_setup');
        } catch (_error) {
            alert('Error', 'Failed to reset setup. Please try again.');
        }
    };

    const showSeedPhrase = () => {
        try {
            const phrase = getSeedPhrase();
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
                { text: 'Cancel', },
                { text: 'Show', mode: 'contained', onPress: showSeedPhrase, },
            ]
        );
    };

    const alertReset = async () => {
        alert(
            'Reset App',
            'This will clear your setup status and require you to go through initial setup again. All data within the app will be rest. Are you sure?',
            [
                { text: 'Cancel', },
                { text: 'Reset', mode: 'contained', onPress: resetApp, },
            ]
        );
    };

    const handleThemeChange = async (value: string) => {
        try {
            await setThemeMode(value as 'light' | 'dark' | 'system');
        } catch (_error) {
            alert('Error', 'Failed to save theme preference.');
        }
    };

    return (
        <>
            <Surface style={{ flex: 1, padding: 16, gap: 16 }}>
                <List.Section>
                    <List.Subheader>Appearance</List.Subheader>

                    <List.Item
                        title="Theme"
                        description="Choose your preferred theme"
                        left={props => <List.Icon {...props} icon="palette-outline" />}
                    />

                    <SegmentedButtons
                        value={themeMode}
                        onValueChange={(value) => void handleThemeChange(value)}
                        buttons={[
                            {
                                value: 'light',
                                label: 'Light',
                                icon: 'white-balance-sunny',
                            },
                            {
                                value: 'dark',
                                label: 'Dark',
                                icon: 'moon-waning-crescent',
                            },
                            {
                                value: 'system',
                                label: 'Auto',
                                icon: 'brightness-auto',
                            },
                        ]}
                    />

                    <List.Subheader>General</List.Subheader>

                    <List.Item
                        title="Connected Devices"
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
                        onPress={() => router.push('/_docs')}
                    />

                    <List.Subheader>Security</List.Subheader>

                    <List.Item
                        title="Show Seed Phrase"
                        description="View your recovery phrase"
                        left={props => <List.Icon {...props} icon="key-outline" />}
                        onPress={() => void alertShowSeedPhrase()}
                    />

                    <List.Subheader>Advanced</List.Subheader>

                    <List.Item
                        title="Reset Setup"
                        description="Clear all app data and start over"
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