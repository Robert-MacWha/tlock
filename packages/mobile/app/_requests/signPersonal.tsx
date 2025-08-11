import React from 'react';
import { useKeyringContext } from '../../contexts/KeyringContext';
import { useRequestHandler } from '../../hooks/useRequestHandler';
import { fromHex } from 'viem';
import { Text, Card, Divider, ActivityIndicator } from 'react-native-paper';
import { KeyValueRow } from '../../components/Row';
import { RequestTemplate } from '../../components/RequestTemplate';
import { ErrorScreen } from '../../components/ErrorScreen';
import { View } from 'react-native';
import { Stack } from 'expo-router';

export default function SignPersonalScreen() {
    const { signPersonal } = useKeyringContext();
    const { accounts } = useKeyringContext();
    const { client, request, loading, error, handleApprove, handleReject } =
        useRequestHandler({
            type: 'signPersonal',
            onApprove: async (request) => {
                const signature = await signPersonal(
                    request.from,
                    request.message,
                );
                return { signature };
            },
        });

    if (!request) return <ErrorScreen error="Request not found" />;
    if (!client) return <ErrorScreen error="Client not found" />;
    const clientName = client.name ?? client.id;

    const account = accounts.find(
        (acc) => acc.address.toLowerCase() === request.from.toLowerCase(),
    );
    if (!account) return <ErrorScreen error="Account not found" />;

    console.log('time, loading, error', {
        time: new Date().toISOString(),
        loading,
        error,
    });

    return (
        <>
            <Stack.Screen
                options={{
                    headerRight: () => (
                        <ActivityIndicator
                            size={16}
                            animating={loading}
                            hidesWhenStopped={true}
                        />
                    ),
                }}
            />
            <RequestTemplate
                title="Approve Personal Signature"
                description={
                    clientName +
                    ' asks you to sign a personal message. Do you approve?'
                }
                onApprove={() => void handleApprove()}
                onReject={() => void handleReject()}
                loading={loading}
                error={error}
            >
                <Card mode="contained">
                    <Card.Content>
                        <View style={{ gap: 4 }}>
                            {request.origin && (
                                <KeyValueRow
                                    label="Origin"
                                    value={request.origin}
                                />
                            )}
                            <KeyValueRow label="From" value={clientName} />
                            <KeyValueRow
                                label="Account"
                                value={account.name ?? account.address}
                            />
                        </View>

                        <Divider style={{ marginVertical: 12 }} />

                        <Text variant="labelMedium" style={{ marginBottom: 8 }}>
                            Message to sign:
                        </Text>
                        <Text
                            variant="bodyLarge"
                            selectable
                            style={{
                                fontFamily: 'monospace',
                            }}
                        >
                            {fromHex(request.message || '0x', 'string')}
                        </Text>
                    </Card.Content>
                </Card>
            </RequestTemplate>
        </>
    );
}
