import React from 'react';
import { View, Text, Button } from 'react-native';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { useRequestHandler } from '../../hooks/useRequestHandler';
import { fromHex } from 'viem';

export default function SignMessageScreen() {
    const { sign } = useAccountsContext();
    const { request, loading, error, handleApprove, handleReject } = useRequestHandler({
        type: 'signMessage',
        onApprove: async (request) => {
            const signature = await sign(request.from, request.message);
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
                MetaMask is requesting to sign a message. Do you approve?
            </Text>
            <Text>
                Warning: This signing protocol is outdated and signing this message
                may give the requester access to your account.  Ensure you trust
                the requester before proceeding.
            </Text>
            <Text>
                Message: {fromHex(request.message || '0x', 'string')}
            </Text>
            <Button title="Approve" onPress={() => { void handleApprove() }} />
            <Button title="Reject" onPress={() => { void handleReject() }} />
        </View>
    );
}