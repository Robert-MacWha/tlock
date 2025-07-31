import React from 'react';
import { View } from 'react-native';
import { useKeyringContext } from '../../contexts/KeyringContext';
import { useRequestHandler } from '../../hooks/useRequestHandler';
import { formatEther, parseTransaction, extractChain } from 'viem';
import * as chains from 'viem/chains';
import { Button, Text, Card, ActivityIndicator } from 'react-native-paper';
import { KeyValueRow } from '../../components/Row';

export default function SignTransaction() {
    const { signTransaction } = useKeyringContext();
    const { accounts } = useKeyringContext();
    const { client, request, loading, error, handleApprove, handleReject } = useRequestHandler({
        type: 'signTransaction',
        onApprove: async (request) => {
            const signed = await signTransaction(request.from, request.transaction);
            return { signed };
        },
    });

    if (!request) return <Text>No request available</Text>;
    if (!client) return <Text>Client not found</Text>;

    const account = accounts.find(acc => acc.address.toLowerCase() === request.from.toLowerCase());
    if (!account) return <Text>Account not found</Text>;

    const clientName = client.name ?? client.id;
    const transaction = parseTransaction(request.transaction);
    const valueWei = transaction.value ? formatEther(transaction.value) : '0';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const chain = transaction.chainId ? extractChain({ chains: Object.values(chains), id: transaction.chainId as any }).name : "Unknown Chain";

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 32, marginBottom: 64 }}>

            <Text variant="headlineSmall" style={{ textAlign: 'center', marginBottom: 16 }}>
                Sign Transaction?
            </Text>
            <Text variant="titleMedium" style={{ textAlign: 'center', marginBottom: 32 }}>
                <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>{clientName}</Text>
                <Text> is requesting you to sign a transaction</Text>
            </Text>

            <Card mode="contained" style={{ marginBottom: 16 }}>
                <Card.Content>
                    <KeyValueRow label="Origin:" value={request.origin ?? 'Unknown'} />
                    <KeyValueRow label="Chain:" value={chain} />
                    <KeyValueRow label="From:" value={account.name ?? account.address} />
                    <KeyValueRow label="To:" value={transaction.to ?? 'Create'} />
                    <KeyValueRow label="Value:" value={valueWei + 'ETH'} />

                    <Text variant='titleMedium'>Data:</Text>
                    <Text
                        variant='bodyMedium'
                    >
                        {transaction.data ?? '0x'}
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