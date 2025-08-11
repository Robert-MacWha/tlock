import React from 'react';
import { useKeyringContext } from '../../contexts/KeyringContext';
import { useRequestHandler } from '../../hooks/useRequestHandler';
import { Card, Text } from 'react-native-paper';
import { KeyValueRow } from '../../components/Row';
import { RequestTemplate } from '../../components/RequestTemplate';
import { ErrorScreen } from '../../components/ErrorScreen';

export default function SignTypedDataScreen() {
    const { signTypedData } = useKeyringContext();
    const { accounts } = useKeyringContext();
    const { client, request, loading, error, handleApprove, handleReject } =
        useRequestHandler({
            type: 'signTypedData',
            onApprove: async (request) => {
                const signature = await signTypedData(
                    request.from,
                    request.data,
                );
                return { signature };
            },
        });

    if (!request) return <ErrorScreen error="Request not found" />;
    if (!client) return <ErrorScreen error="Client not found" />;

    const account = accounts.find(
        (acc) => acc.address.toLowerCase() === request.from.toLowerCase(),
    );
    if (!account) return <ErrorScreen error="Account not found" />;

    const clientName = client.name ?? client.id;

    return (
        <RequestTemplate
            title="Sign Typed Data"
            description={`${clientName} is requesting you to sign structured data. This is generally safe.`}
            onApprove={() => void handleApprove()}
            onReject={() => void handleReject()}
            loading={loading}
            error={error}
        >
            <Card>
                <Card.Content>
                    <KeyValueRow label="From" value={clientName} />
                    <KeyValueRow
                        label="Account"
                        value={account.name ?? account.address}
                    />
                    <KeyValueRow
                        label="Origin"
                        value={request.origin ?? 'Unknown'}
                    />

                    <Text
                        variant="labelMedium"
                        style={{
                            marginTop: 16,
                            marginBottom: 8,
                        }}
                    >
                        Data to sign:
                    </Text>
                    <Card mode="contained">
                        <Card.Content>
                            <Text
                                variant="bodySmall"
                                selectable
                                style={{
                                    fontFamily: 'monospace',
                                }}
                            >
                                {JSON.stringify(request.data, null, 2)}
                            </Text>
                        </Card.Content>
                    </Card>
                </Card.Content>
            </Card>
        </RequestTemplate>
    );
}
