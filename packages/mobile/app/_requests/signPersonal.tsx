import React from 'react';
import { View } from 'react-native';
import { useKeyringContext } from '../../contexts/KeyringContext';
import { useRequestHandler } from '../../hooks/useRequestHandler';
import { fromHex } from 'viem';
import { Button, Text, Card, ActivityIndicator, Divider } from 'react-native-paper';
import { KeyValueRow } from '../../components/Row';

export default function SignPersonalScreen() {
    const { signPersonal } = useKeyringContext();
    const { accounts } = useKeyringContext();
    const { client, request, loading, error, handleApprove, handleReject } = useRequestHandler({
        type: 'signPersonal',
        onApprove: async (request) => {
            const signature = await signPersonal(request.from, request.message);
            return { signature };
        },
    });

    if (!request) return <Text>No request available</Text>;
    if (!client) return <Text>Client not found</Text>;

    const account = accounts.find(acc => acc.address.toLowerCase() === request.from.toLowerCase());
    if (!account) return <Text>Account not found</Text>;

    const clientName = client.name ?? client.id;

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 32, marginBottom: 64 }}>

            <Text variant="headlineSmall" style={{ textAlign: 'center', marginBottom: 16 }}>
                Approve Signature?
            </Text>
            <Text variant="titleMedium" style={{ textAlign: 'center', marginBottom: 32 }}>
                <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>{clientName}</Text>
                <Text> is requesting your personal signature</Text>
            </Text>

            <Card mode="contained" style={{ marginBottom: 16 }}>
                <Card.Content>
                    <KeyValueRow label="Origin:" value={request.origin ?? 'Unknown'} />
                    <KeyValueRow label="Address:" value={account.name ?? account.address} />

                    <Divider />

                    <Text variant='titleMedium'>Message:</Text>
                    <Text
                        variant='bodyMedium'
                    >
                        {fromHex(request.message || '0x', 'string')}
                    </Text>
                </Card.Content>
            </Card>

            <View style={{ flexDirection: 'row', marginTop: 20, gap: 16 }}>
                <Button
                    mode='outlined'
                    onPress={() => void handleReject()}
                    style={{ flex: 1 }}
                >
                    Reject
                </Button>
                <Button
                    mode='contained'
                    onPress={() => void handleApprove()}
                    style={{ flex: 1 }}
                >
                    Approve
                </Button>
            </View>

            {error && <Text variant='titleMedium' style={{ color: 'red', marginTop: 16 }}>{error}</Text>}
            {loading && <ActivityIndicator animating={true} style={{ marginTop: 32 }} />}
        </View >
    );
}