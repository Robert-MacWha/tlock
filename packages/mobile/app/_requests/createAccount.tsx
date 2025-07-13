import React from 'react';
import { View, Text, Button } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSeedPhraseContext } from '../../contexts/SeedPhraseContext';
import { useSecureClientContext } from '../../contexts/SecureClientContext';

export default function CreateAccountScreen() {
    const { requestId } = useLocalSearchParams() as { requestId: string };
    const { addAccount } = useSeedPhraseContext();
    const { secureClient } = useSecureClientContext();

    const handleApprove = async () => {
        console.log('Request approved');
        try {
            const address = await addAccount();
            await secureClient?.updateRequest(requestId, 'createAccount', {
                status: 'approved',
                address,
            });

            console.log('Created account:', address);
            router.back();
            return;
        } catch (error) {
            console.error('Failed to create account:', error);
        }
    };

    const handleReject = async () => {
        console.log('Request rejected');

        try {
            await secureClient?.updateRequest(requestId, 'createAccount', {
                status: 'rejected',
            })
        } catch (error) {
            console.error('Failed to reject request:', error);
        }

        router.back();
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
            <Text style={{ fontSize: 24, marginBottom: 20 }}>
                Create New Account
            </Text>
            <Text style={{ marginBottom: 30 }}>
                MetaMask is requesting to create a new account. Do you approve?
            </Text>
            <Button title="Approve" onPress={handleApprove} />
            <Button title="Reject" onPress={handleReject} />
        </View>
    );
}