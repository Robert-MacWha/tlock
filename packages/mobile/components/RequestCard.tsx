import React from 'react';
import { Card, Text, Button } from 'react-native-paper';
import { View } from 'react-native';
import { useClientsContext } from '../contexts/ClientContext';
import { useRequestManagerContext } from '../contexts/RequestManagerContext';
import { ClientRequest } from '../hooks/useRequestManager';

interface RequestCardProps {
    request: ClientRequest
}

export function RequestCard({ request }: RequestCardProps) {
    const [hidden, setHidden] = React.useState(false);
    const { clients } = useClientsContext();
    const { handleRequest, rejectRequest } = useRequestManagerContext();

    const client = clients.find(client => client.id === request.clientId);
    if (!client) {
        return (
            <Card mode="elevated">
                <Card.Content>
                    <Text variant="titleMedium">Invalid Request</Text>
                </Card.Content>
            </Card>
        );
    }

    if (hidden) {
        return null;
    }

    const clientName = client.name || client.id;
    const lastUpdated = new Date(request.request.lastUpdated).toLocaleString();

    function reject() {
        void rejectRequest(request);
        setHidden(true);
    }

    function handle() {
        void handleRequest(request);
    }

    return (
        <Card mode="elevated">
            <Card.Content>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="titleMedium">{clientName}</Text>
                    <Text variant="bodyMedium" style={{ color: 'gray' }}>{lastUpdated}</Text>
                </View>
                <Text variant="bodyMedium" style={{ color: 'gray', marginTop: 4 }}>
                    {request.request.type}
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
                    <Button mode='outlined' onPress={reject}>
                        Reject
                    </Button>
                    <Button mode="contained" onPress={handle}>
                        Handle
                    </Button>
                </View>
            </Card.Content>
        </Card>
    );
}
