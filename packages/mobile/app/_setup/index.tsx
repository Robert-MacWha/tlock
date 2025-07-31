import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useKeyringContext } from '../../contexts/KeyringContext';
import { useSetupStatus } from '../../hooks/useSetupStatus';
import { SeedPhraseDisplay } from '../../components/SeedPhraseDisplay';
import { useAlert } from '../../components/AlertProvider';
import { Button, Text } from 'react-native-paper';

type SetupStep = 'intro' | 'seedPhrase' | 'complete';

export default function SetupScreen() {
    const [currentStep, setCurrentStep] = useState<SetupStep>('intro');
    const [seedPhraseBackedUp, setSeedPhraseBackedUp] = useState(false);
    const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
    const { generateSeedPhrase } = useKeyringContext();
    const { setIsSetupComplete } = useSetupStatus();
    const { alert } = useAlert();

    const completeSetup = async () => {
        await setIsSetupComplete(true);
        router.replace('/');
    };

    const handleNextFromIntro = async () => {
        const seedPhrase = await generateSeedPhrase(true);
        setSeedPhrase(seedPhrase);
        setCurrentStep('seedPhrase');
    };

    const handleNextFromSeedPhrase = () => {
        if (!seedPhraseBackedUp) {
            alert('Backup Required', 'Please confirm you have backed up your seed phrase before continuing.');
            return;
        }
        setCurrentStep('complete');
    };

    const renderIntroStep = () => (
        <View style={styles.stepContainer}>
            <Text variant='titleLarge'>Welcome to Foxguard</Text>
            <Text variant="titleMedium">
                Foxguard is a secure key management app that works seamlessly with
                MetaMask. To get started, you'll need to setup a seed phrase.
            </Text>
            <Button onPress={() => { void handleNextFromIntro() }}>Continue</Button>
        </View>
    );

    const renderSeedPhraseStep = () => (
        <View style={styles.stepContainer}>
            <Text variant='titleLarge'>Your Seed Phrase</Text>
            <Text variant="titleMedium">
                Write down these 12 words in order and store them safely.
                If you lose access to your seed phrase, you will lose access
                to all of your accounts and funds.
            </Text>

            {seedPhrase && <SeedPhraseDisplay seedPhrase={seedPhrase} />}

            <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setSeedPhraseBackedUp(!seedPhraseBackedUp)}
            >
                <View style={styles.checkbox}>
                    {seedPhraseBackedUp && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>I've backed up this seed phrase</Text>
            </TouchableOpacity>

            <Button onPress={handleNextFromSeedPhrase} disabled={!seedPhraseBackedUp}>Continue</Button>
        </View>
    );

    const renderCompleteStep = () => (
        <View style={styles.stepContainer}>
            <Text variant='titleLarge'>Setup Complete!</Text>
            <Text variant="titleMedium">
                You can now pair with MetaMask and start securing your transactions.
            </Text>
            <Button onPress={() => { void completeSetup() }}>Continue</Button>
        </View>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {currentStep === 'intro' && renderIntroStep()}
            {currentStep === 'seedPhrase' && renderSeedPhraseStep()}
            {currentStep === 'complete' && renderCompleteStep()}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    contentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 32,
    },
    stepContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
        paddingHorizontal: 20,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#007AFF',
        borderRadius: 4,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    checkmark: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    checkboxLabel: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
});
