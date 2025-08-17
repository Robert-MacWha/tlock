import React, { useState } from 'react';
import {
    Card,
    Text,
    IconButton,
    Menu,
    Portal,
    Modal,
    TextInput,
    Button,
} from 'react-native-paper';
import { View } from 'react-native';
import { useKeyringContext } from '../contexts/KeyringContext';
import { Address } from 'viem';
import { Account } from '../hooks/useKeyring';
import { useCopyable } from '../hooks/useCopyable';

interface AccountCardProps {
    address: Address;
}

export function AccountCard({ address }: AccountCardProps) {
    const { accounts, renameAccount, hideAccount } = useKeyringContext();
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [renameVisible, setRenameVisible] = useState(false);
    const [nameInput, setNameInput] = useState<string>('');
    const { copy, SnackbarComponent } = useCopyable();

    const account = accounts.find((acc) => acc.address === address);

    if (!account) {
        return (
            <Card mode="elevated">
                <Card.Content>
                    <Text variant="titleMedium">Account not found</Text>
                </Card.Content>
            </Card>
        );
    }

    function handleRename(account: Account) {
        setSettingsVisible(false);
        setNameInput(account.name ?? '');
        setRenameVisible(true);
    }

    async function handleRenameConfirm() {
        await renameAccount(address, nameInput);
        setRenameVisible(false);
    }

    const cardStyle = account.isHidden
        ? {
              opacity: 0.6,
          }
        : undefined;

    const textStyle = account.isHidden
        ? {
              color: '#666',
          }
        : undefined;

    return (
        <>
            <SnackbarComponent />
            <Card mode="elevated" style={cardStyle}>
                <Card.Content>
                    <Text variant="titleMedium" style={textStyle}>
                        {account.name ? account.name : 'Address: ' + account.id}
                    </Text>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 16,
                        }}
                    >
                        <Text
                            variant="bodyMedium"
                            style={{ color: 'gray', flexShrink: 1 }}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {address}
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
                            <Menu.Item
                                leadingIcon="pencil-outline"
                                onPress={() => handleRename(account)}
                                title="Rename"
                            />
                            {account.isHidden ? (
                                <Menu.Item
                                    leadingIcon="eye-outline"
                                    onPress={() =>
                                        void hideAccount(account.address, false)
                                    }
                                    title="Unhide"
                                />
                            ) : (
                                <Menu.Item
                                    leadingIcon="eye-off-outline"
                                    onPress={() =>
                                        void hideAccount(account.address, true)
                                    }
                                    title="Hide"
                                />
                            )}
                            <Menu.Item
                                leadingIcon="content-copy"
                                onPress={() => void copy(address)}
                                title="Copy Address"
                            />
                        </Menu>
                    </View>
                </Card.Content>

                <Portal>
                    <Modal
                        visible={renameVisible}
                        onDismiss={() => setRenameVisible(false)}
                        contentContainerStyle={{
                            padding: 16,
                            backgroundColor: 'white',
                            margin: 32,
                        }}
                    >
                        <Text variant="titleMedium">Rename Client</Text>
                        <TextInput
                            onChangeText={setNameInput}
                            value={nameInput}
                            style={{ marginBottom: 16 }}
                        />
                        <Button
                            mode="contained"
                            onPress={() => void handleRenameConfirm()}
                            style={{ marginBottom: 8 }}
                        >
                            Save
                        </Button>
                    </Modal>
                </Portal>
            </Card>
        </>
    );
}
