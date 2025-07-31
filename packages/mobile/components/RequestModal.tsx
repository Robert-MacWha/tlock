import React, { useState, useEffect } from 'react';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { ClientRequest } from '../contexts/RequestRecieverContext';
import { useClientsContext } from '../contexts/ClientContext';

interface RequestModal {
    request: ClientRequest | null;
}

export function RequestModal({ request }: RequestModal) {
    const [visible, setVisible] = useState(false);
    const { clients } = useClientsContext();

    useEffect(() => {
        setVisible(!!request);
    }, [request]);

    const hide = () => setVisible(false);

    const approve = async (req: Request) => {
        console.log('Request approved:', req);
        // Handle approval logic here
        hide();
    };

    const reject = async (req: Request) => {
        console.log('Request rejected:', req);
        // Handle rejection logic here
        hide();
    };

    const client = clients.find(client => client.id === request?.clientId);
    const clientName = client ? client.name || client.id : 'Unknown Client';

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={hide}>
                <Dialog.Title>{clientName}</Dialog.Title>
                <Dialog.Content>
                    <Text variant="bodyMedium">{request?.request.type}</Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={hide}>Reject</Button>
                    <Button onPress={hide}>Handle</Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
}