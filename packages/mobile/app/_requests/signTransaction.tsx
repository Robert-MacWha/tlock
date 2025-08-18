import React from 'react';
import { View } from 'react-native';
import { useKeyringContext } from '../../contexts/KeyringContext';
import { useRequestHandler } from '../../hooks/useRequestHandler';
import { formatEther, parseTransaction, extractChain } from 'viem';
import * as chains from 'viem/chains';
import { Text, Divider, Card, ActivityIndicator } from 'react-native-paper';
import { KeyValueRow } from '../../components/Row';
import { RequestTemplate } from '../../components/RequestTemplate';
import { ErrorScreen } from '../../components/ErrorScreen';
import { formatAddressForDisplay } from '../../lib/address';
import { Stack } from 'expo-router';
import { TxSimulation } from '../../components/TxSimulation';

export default function SignTransaction() {
    const { signTransaction } = useKeyringContext();
    const { accounts } = useKeyringContext();
    const { client, request, loading, error, handleApprove, handleReject } =
        useRequestHandler({
            type: 'signTransaction',
            onApprove: async (request) => {
                const signed = await signTransaction(
                    request.from,
                    request.transaction,
                );
                return { signed };
            },
        });

    if (!request) return <ErrorScreen error="Request not found" />;
    if (!client) return <ErrorScreen error="Client not found" />;

    const account = accounts.find(
        (acc) => acc.address.toLowerCase() === request.from.toLowerCase(),
    );
    if (!account) return <ErrorScreen error="Account not found" />;

    const clientName = client.name ?? client.id;
    const transaction = parseTransaction(request.transaction);
    const valueWei = transaction.value ? formatEther(transaction.value) : '0';
    const chain = transaction.chainId
        ? extractChain({
            chains: Object.values(chains),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
            id: transaction.chainId as any,
        }).name
        : 'Unknown Chain';

    return (
        <>
            <Stack.Screen
                options={{
                    headerRight: () => (
                        <View style={{ flexDirection: 'row' }}>
                            <ActivityIndicator
                                size={16}
                                animating={loading}
                                hidesWhenStopped={true}
                            />
                        </View>
                    ),
                }}
            />
            <RequestTemplate
                title="Sign Transaction"
                description={`${clientName} is requesting you to sign a transaction. Do you approve?`}
                onApprove={() => void handleApprove()}
                onReject={() => void handleReject()}
                loading={loading}
                error={error}
            >
                <Card mode="contained" style={{ marginBottom: 16 }}>
                    <Card.Title title="Transaction Details" />
                    <Card.Content>
                        <View style={{ gap: 4 }}>
                            {request.origin && (
                                <KeyValueRow
                                    label="Origin"
                                    value={request.origin}
                                />
                            )}
                            <KeyValueRow label="Chain" value={chain} />
                            <KeyValueRow
                                label="From"
                                value={
                                    account.name ??
                                    formatAddressForDisplay(account.address)
                                }
                            />
                            <KeyValueRow
                                label="To"
                                value={
                                    transaction.to ?
                                        formatAddressForDisplay(transaction.to) :
                                        'Create Contract'
                                }
                            />
                            <KeyValueRow
                                label="Value"
                                value={`${valueWei} ETH`}
                            />
                        </View>

                        {transaction.data && (
                            <>
                                <Divider style={{ marginVertical: 12 }} />

                                <Text
                                    variant="labelMedium"
                                    style={{ marginBottom: 8 }}
                                >
                                    Transaction Data:
                                </Text>
                                <Text
                                    variant="bodyLarge"
                                    selectable
                                    style={{
                                        fontFamily: 'monospace',
                                    }}
                                >
                                    {transaction.data ?? '0x'}
                                </Text>
                            </>
                        )}
                    </Card.Content>
                </Card>

                <TxSimulation
                    network={chain}
                    transaction={transaction}
                    from={request.from}
                />
            </RequestTemplate>
        </>
    );
}
