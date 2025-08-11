import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useKeyringContext } from '../../contexts/KeyringContext';
import { useSetupStatus } from '../../hooks/useSetupStatus';
import { SeedPhraseDisplay } from '../../components/SeedPhraseDisplay';
import { useAlert } from '../../components/AlertProvider';
import { Button, Text, Surface, Card, Checkbox } from 'react-native-paper';

type SetupStep = 'intro' | 'seedPhrase' | 'complete';

export default function SetupScreen() {
    const [currentStep, setCurrentStep] = useState<SetupStep>('intro');
    const [seedPhraseBackedUp, setSeedPhraseBackedUp] = useState(false);
    const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
    const { generateSeedPhrase } = useKeyringContext();
    const { setIsSetupComplete } = useSetupStatus();
    const { alert } = useAlert();

    const handleNextFromIntro = async () => {
        const seedPhrase = generateSeedPhrase(true);
        setSeedPhrase(seedPhrase);
        setCurrentStep('seedPhrase');
    };

    const handleNextFromSeedPhrase = () => {
        if (!seedPhraseBackedUp) {
            alert(
                'Backup Required',
                'Please confirm you have backed up your seed phrase before continuing.',
            );
            return;
        }
        setCurrentStep('complete');
    };

    const completeSetup = () => {
        setIsSetupComplete(true);
        router.replace('/accounts');
        setTimeout(() => {
            router.push('/clients');
        }, 100);
    };

    const renderIntroStep = () => (
        <Surface
            style={{
                flex: 1,
                padding: 24,
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <Text
                variant="headlineMedium"
                style={{ marginBottom: 24, textAlign: 'center' }}
            >
                Welcome to Foxguard
            </Text>
            <Text
                variant="bodyLarge"
                style={{ marginBottom: 32, textAlign: 'center' }}
            >
                Foxguard is a secure key management app that works seamlessly
                with MetaMask. To get started, you'll need to setup a seed
                phrase.
            </Text>
            <Button
                mode="contained"
                onPress={() => {
                    void handleNextFromIntro();
                }}
            >
                Continue
            </Button>
        </Surface>
    );

    const renderSeedPhraseStep = () => (
        <Surface style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
            <Text
                variant="headlineMedium"
                style={{ marginBottom: 16, textAlign: 'center' }}
            >
                Your Seed Phrase
            </Text>
            <Text
                variant="bodyLarge"
                style={{ marginBottom: 24, textAlign: 'center' }}
            >
                Write down these 12 words in order and store them safely. If you
                lose access to your seed phrase, you will lose access to all of
                your accounts and funds.
            </Text>

            {seedPhrase && (
                <View style={{ marginBottom: 24 }}>
                    <SeedPhraseDisplay seedPhrase={seedPhrase} />
                </View>
            )}

            <Card mode="contained" style={{ marginBottom: 24 }}>
                <Card.Content
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                    <Checkbox
                        status={seedPhraseBackedUp ? 'checked' : 'unchecked'}
                        onPress={() =>
                            setSeedPhraseBackedUp(!seedPhraseBackedUp)
                        }
                    />
                    <Text
                        variant="bodyMedium"
                        style={{ flex: 1, marginLeft: 8 }}
                    >
                        I've backed up this seed phrase
                    </Text>
                </Card.Content>
            </Card>

            <Button
                mode="contained"
                onPress={handleNextFromSeedPhrase}
                disabled={!seedPhraseBackedUp}
            >
                Continue
            </Button>
        </Surface>
    );

    const renderCompleteStep = () => (
        <Surface
            style={{
                flex: 1,
                padding: 24,
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <Text
                variant="headlineMedium"
                style={{ marginBottom: 24, textAlign: 'center' }}
            >
                Setup Complete!
            </Text>
            <Text
                variant="bodyLarge"
                style={{ marginBottom: 32, textAlign: 'center' }}
            >
                You can now pair with MetaMask and start securing your
                transactions.
            </Text>
            <Button
                mode="contained"
                onPress={() => {
                    void completeSetup();
                }}
            >
                Continue
            </Button>
        </Surface>
    );

    return (
        <Surface style={{ flex: 1 }}>
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: 'center',
                }}
            >
                {currentStep === 'intro' && renderIntroStep()}
                {currentStep === 'seedPhrase' && renderSeedPhraseStep()}
                {currentStep === 'complete' && renderCompleteStep()}
            </ScrollView>
        </Surface>
    );
}
