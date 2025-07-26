import React from 'react';
import { View, Text, Button } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { useSecureClientContext } from '../../contexts/SecureClientContext';

export default function CreateAccountScreen() {
    const { requestId } = useLocalSearchParams() as { requestId: string };
    const { secureClient } = useSecureClientContext();

    const handleApprove = async () => {
        console.log('Request approved');
    };

    const handleReject = async () => {
        console.log('Request rejected');
        router.back();
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
            <Text style={{ fontSize: 24, marginBottom: 20 }}>
                Sign Transaction
            </Text>
            <Text style={{ marginBottom: 30 }}>
                MetaMask is requesting to sign a transaction. Do you approve?
            </Text>
            <Button title="Approve" onPress={handleApprove} />
            <Button title="Reject" onPress={handleReject} />
        </View>
    );
}