import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useKeyringContext } from '../../contexts/KeyringContext';
import { useSetupStatus } from '../../hooks/useSetupStatus';
import { SeedPhraseDisplay } from '../../components/SeedPhraseDisplay';

type SetupStep = 'intro' | 'seedPhrase' | 'complete';

export default function SetupScreen() {
    const [currentStep, setCurrentStep] = useState<SetupStep>('intro');
    const [seedPhraseBackedUp, setSeedPhraseBackedUp] = useState(false);
    const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
    const { generateSeedPhrase } = useKeyringContext();
    const { setIsSetupComplete } = useSetupStatus();

    const completeSetup = async () => {
        await setIsSetupComplete(true);
        router.replace('/');
    };

    const handleNextFromIntro = async () => {
        console.log('Generating seed phrase...');
        const seedPhrase = await generateSeedPhrase(true);
        setSeedPhrase(seedPhrase);
        setCurrentStep('seedPhrase');
        console.log('Current step:', currentStep);
    };

    const handleNextFromSeedPhrase = () => {
        if (!seedPhraseBackedUp) {
            Alert.alert('Backup Required', 'Please confirm you have backed up your seed phrase before continuing.');
            return;
        }
        setCurrentStep('complete');
    };

    const renderIntroStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.title}>Welcome to Foxguard</Text>
            <Text style={styles.description}>
                Foxguard is a secure key management app that works seamlessly with
                MetaMask. To get started, you'll need to setup a seed phrase.
            </Text>
            <Button title="Continue" onPress={() => { void handleNextFromIntro() }} />
        </View>
    );

    const renderSeedPhraseStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.title}>Your Seed Phrase</Text>
            <Text style={styles.description}>
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

            <Button
                title="Continue"
                onPress={handleNextFromSeedPhrase}
                disabled={!seedPhraseBackedUp}
            />
        </View>
    );

    const renderCompleteStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.title}>Setup Complete!</Text>
            <Text style={styles.description}>
                You can now pair with MetaMask and start securing your transactions.
            </Text>
            <Button title="Continue" onPress={() => { void completeSetup() }} />
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
        padding: 20,
    },
    stepContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 20,
        textAlign: 'center',
        color: '#666',
        paddingHorizontal: 10,
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
