import React from 'react';
import { View, Text, Button } from 'react-native';
import { useSeedPhraseContext } from '../../contexts/SeedPhraseContext';
import { useRequestHandler } from '../../hooks/useRequestHandler';
import { useBiometricAuth } from '../../contexts/BiometricAuthContext';

export default function CreateAccountScreen() {
    const { addAccount } = useSeedPhraseContext();
    const { loading, error, handleApprove, handleReject } = useRequestHandler({
        type: 'importAccount',
        onApprove: async () => {
            const address = await addAccount();
            return { address };
        },
    });

    if (loading) return <Text>Loading...</Text>;
    if (error) return <Text>Error: {error}</Text>;

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
            <Text style={{ fontSize: 24, marginBottom: 20 }}>Create New Account</Text>
            <Text style={{ marginBottom: 30 }}>
                MetaMask is requesting to create a new account. Do you approve?
            </Text>
            <Button title="Approve" onPress={handleApprove} />
            <Button title="Reject" onPress={handleReject} />
        </View>
    );
}