import React from 'react';
import { View, Text, Button } from 'react-native';
import { useKeyringContext } from '../../contexts/KeyringContext';
import { useRequestHandler } from '../../hooks/useRequestHandler';

export default function SignPersonalScreen() {
    const { signTransaction } = useKeyringContext();
    const { request, loading, error, handleApprove, handleReject } = useRequestHandler({
        type: 'signTransaction',
        onApprove: async (request) => {
            const signed = await signTransaction(request.from, request.transaction);
            return { signed };
        },
    });

    if (loading) return <Text>Loading...</Text>;
    if (error) return <Text>Error: {error}</Text>;
    if (!request) return <Text>No request available</Text>;

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
            <Text style={{ fontSize: 24, marginBottom: 20 }}>Sign Transaction</Text>
            <Text style={{ marginBottom: 30 }}>
                MetaMask is requesting to sign a transaction. Do you approve?
            </Text>
            <Text>
                Message: {request.transaction}
            </Text>
            <Button title="Approve" onPress={() => { void handleApprove() }} />
            <Button title="Reject" onPress={() => { void handleReject() }} />
        </View>
    );
}