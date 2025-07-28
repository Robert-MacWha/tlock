import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, View, Modal, TouchableOpacity } from "react-native";
import { useSetupStatus } from "../hooks/useSetupStatus";
import { useAccountsContext } from "../contexts/AccountsContext";
import { router } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { SeedPhraseDisplay } from '../components/SeedPhraseDisplay';
import { useAuthenticator } from '../hooks/useAuthenticator';

export default function SettingsScreen() {
    const { setIsSetupComplete } = useSetupStatus();
    const { getSeedPhrase } = useAccountsContext();
    const { authenticate } = useAuthenticator();
    const [showSeedPhrasePopup, setShowSeedPhrasePopup] = useState(false);
    const [seedPhrase, setSeedPhrase] = useState<string>('');

    const resetApp = async () => {
        try {
            await authenticate();
            await SecureStore.deleteItemAsync('tlock_setup_complete');
            await setIsSetupComplete(false);
            router.replace('/_setup');
        } catch (_error) {
            Alert.alert('Error', 'Failed to reset setup. Please try again.');
        }
    };

    const showSeedPhrase = async () => {
        try {
            const phrase = await getSeedPhrase();
            setSeedPhrase(phrase);
            setShowSeedPhrasePopup(true);
        } catch (_error) {
            Alert.alert('Error', 'Failed to retrieve seed phrase. Please try again.');
        }
    };

    const resetSetup = async () => {
        Alert.alert(
            'Reset App',
            'This will clear your setup status and require you to go through initial setup again. All data within the app will be rest. Are you sure?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => { void resetApp(); },
                },
            ]
        );
    };

    const recoverSeedPhrase = async () => {
        Alert.alert(
            'Security Warning',
            'Your seed phrase will be displayed on screen. Make sure no one else can see your device.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Show Seed Phrase',
                    style: 'default',
                    onPress: () => { void showSeedPhrase() },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Settings</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recovery</Text>
                <Button title="Show Seed Phrase" onPress={() => { void recoverSeedPhrase() }} color="#007AFF" />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Developer</Text>
                <Button title="Reset Setup" onPress={() => { void resetSetup(); }} color="#ff6b6b" />
            </View>

            <Modal
                visible={showSeedPhrasePopup}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSeedPhrasePopup(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.popupContainer}>
                        <Text style={styles.popupTitle}>Your Seed Phrase</Text>
                        <Text style={styles.popupDescription}>
                            Write down these 12 words in order and store them safely.
                        </Text>

                        {seedPhrase && <SeedPhraseDisplay seedPhrase={seedPhrase} style={styles.seedPhraseInPopup} />}

                        <TouchableOpacity
                            style={styles.popupButton}
                            onPress={() => setShowSeedPhrasePopup(false)}
                        >
                            <Text style={styles.popupButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        color: '#333',
    },
    overlay: {
        position: 'absolute',
        bottom: 50,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 20,
        borderRadius: 10,
    },
    scanText: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
    },
    requestItem: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        marginBottom: 10,
        borderRadius: 5,
        width: '100%',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
        marginTop: 40,
    },
    modalDescription: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 20,
        textAlign: 'center',
        color: '#666',
        paddingHorizontal: 10,
    },
    closeButton: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        marginTop: 20,
        marginBottom: 40,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    popupContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    popupTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: '#333',
    },
    popupDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 15,
        textAlign: 'center',
        color: '#666',
    },
    seedPhraseInPopup: {
        marginVertical: 10,
        width: '100%',
    },
    popupButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 15,
    },
    popupButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});