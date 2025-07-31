import React, { useState } from 'react';
import { Card, Text, IconButton, Portal, Modal, Divider, Button, Menu, TextInput } from 'react-native-paper';
import { Alert, View } from 'react-native';
import { useClientsContext } from '../contexts/ClientContext';
import { ClientInstance } from '../hooks/useClients';
import { useAlert } from './AlertProvider';

interface ClientCardProps {
    id: string;
}

export function ClientCard({ id }: ClientCardProps) {
    const { clients, setClientName, removeClient } = useClientsContext();
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [renameVisible, setRenameVisible] = useState(false);
    const [nameInput, setNameInput] = useState<string>('');
    const { alert } = useAlert();

    const client = clients.find(client => client.id === id);

    if (!client) {
        return (
            <Card mode="elevated">
                <Card.Content>
                    <Text variant="titleMedium">Client not found</Text>
                </Card.Content>
            </Card>
        );
    }

    function handleRemove(client: ClientInstance) {
        setSettingsVisible(false);
        alert(
            'Remove Client',
            `Are you sure you want to remove ${client.name ? client.name : id}? Once removed, you will need to re-add this client to sign transactions for it.`,
            [
                {
                    text: 'Cancel',
                },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => void removeClient(id),
                },
            ],
        )
    }

    function handleRename() {
        setSettingsVisible(false);
        setNameInput(client?.name ?? '');
        setRenameVisible(true);
    }

    async function handleRenameConfirm() {
        await setClientName(id, nameInput);
        setRenameVisible(false);
    }

    return (
        <Card mode="elevated">
            <Card.Content>
                <Text variant="titleMedium">{client.name ? client.name : id}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Text
                        variant="bodyMedium"
                        style={{ color: 'gray', flexShrink: 1 }}
                    >
                        Room ID: {client.client.roomId.substring(0, 8)}...
                    </Text>
                    <Menu
                        visible={settingsVisible}
                        onDismiss={() => setSettingsVisible(false)}
                        anchor={
                            <IconButton
                                icon="cog-outline"
                                onPress={() => setSettingsVisible(true)}
                                size={18}
                                style={{ margin: 0, marginLeft: 4 }}
                            />
                        }
                    >
                        <Menu.Item leadingIcon="pencil-outline" onPress={handleRename} title="Rename" />
                        <Divider />
                        <Menu.Item leadingIcon="delete-outline" onPress={() => handleRemove(client)} title="Delete" />
                    </Menu>
                </View>
            </Card.Content>

            <Portal>
                <Modal
                    visible={renameVisible}
                    onDismiss={() => setRenameVisible(false)}
                    contentContainerStyle={{ padding: 16, backgroundColor: 'white', margin: 32 }}
                >
                    <Text variant="titleMedium">Rename Client</Text>
                    <TextInput
                        onChangeText={setNameInput}
                        value={nameInput}
                        style={{ marginBottom: 16 }}
                    />
                    <Button mode="contained" onPress={() => void handleRenameConfirm()} style={{ marginBottom: 8 }}>
                        Save
                    </Button>
                </Modal>
            </Portal>
        </Card>
    );
}
