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

    const clientName = client.name || client.id;
    const lastUpdated = new Date(request.request.lastUpdated).toLocaleString();

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
                    <Button mode="outlined" onPress={() => { console.log('Reject logic here'); }}>
                        Reject
                    </Button>
                    <Button mode="outlined" onPress={() => { void requestHandler.handleRequest(request) }}>
                        Handle
                    </Button>
                </View>
            </Card.Content>
        </Card>
    );
}
