import React from 'react';
import { Card, Text, Button } from 'react-native-paper';
import { View } from 'react-native';
import { ClientRequest } from '../contexts/RequestRecieverContext';
import { useClientsContext } from '../contexts/ClientContext';
import { requestHandler } from '../services/RequestHandlerService';

interface RequestCardProps {
    request: ClientRequest
}

export function RequestCard({ request }: RequestCardProps) {
    const [hidden, setHidden] = React.useState(false);
    const { clients } = useClientsContext();

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

    function handleRequest() {
        void requestHandler.handleRequest(request);
    }

    function handleReject() {
        setHidden(true);
        void client?.client.updateRequest(request.request.id, request.request.type, {
            status: 'rejected',
        })
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
                    <Button mode='outlined' onPress={handleReject}>
                        Reject
                    </Button>
                    <Button mode="contained" onPress={handleReject}>
                        Handle
                    </Button>
                </View>
            </Card.Content>
        </Card>
    );
}
