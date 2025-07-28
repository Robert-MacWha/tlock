import React from 'react';
import { View, Text, Button } from 'react-native';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { useRequestHandler } from '../../hooks/useRequestHandler';

export default function SignPersonalScreen() {
    const { signTransaction } = useAccountsContext();
    const { request, loading, error, handleApprove, handleReject } = useRequestHandler({
        type: 'signTransaction',
        onApprove: async (request) => {
            const signature = await signTransaction(request.from, request.transaction);
            return { signature };
        },
    });

    if (loading) return <Text>Loading...</Text>;
    if (error) return <Text>Error: {error}</Text>;
    if (!request) return <Text>No request available</Text>;

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
            <Text style={{ fontSize: 24, marginBottom: 20 }}>Personal Sign</Text>
            <Text style={{ marginBottom: 30 }}>
                MetaMask is requesting to sign a text challenge. Do you approve?
            </Text>
            <Text>
                Message: {JSON.stringify(request.transaction, null, 2)}
            </Text>
            <Button title="Approve" onPress={() => { void handleApprove() }} />
            <Button title="Reject" onPress={() => { void handleReject() }} />
        </View>
    );
}