import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import {
    Text,
    Card,
    RadioButton,
    useTheme
} from 'react-native-paper';
import { useKeyringContext } from '../../contexts/KeyringContext';
import { useRequestHandler } from '../../hooks/useRequestHandler';
import { Address } from 'viem';
import { RequestTemplate, useRequestTemplateHeader } from '../../components/RequestTemplate';
import { Stack } from 'expo-router';
import { ErrorScreen } from '../../components/ErrorScreen';

type AccountItemProps = {
    name?: string;
    address: Address;
    isSelected: boolean;
    onSelect: (address: Address) => void;
};

function AccountItem({ name, address, isSelected, onSelect }: AccountItemProps) {
    const theme = useTheme();

    return (
        <Card
            mode="outlined"
            style={{
                marginVertical: 4,
                backgroundColor: isSelected ? theme.colors.primaryContainer : theme.colors.surface
            }}
            onPress={() => onSelect(address)}
        >
            <Card.Content style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12
            }}>
                <RadioButton
                    value={address}
                    status={isSelected ? 'checked' : 'unchecked'}
                    onPress={() => onSelect(address)}
                />
                <View style={{
                    flex: 1,
                    marginLeft: 8,
                    justifyContent: name ? 'flex-start' : 'center'
                }}>
                    {name && (
                        <Text
                            variant="bodyMedium"
                            numberOfLines={1}
                            style={{
                                color: isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurface
                            }}
                        >
                            {name}
                        </Text>
                    )}
                    <Text
                        variant="bodyMedium"
                        numberOfLines={1}
                        ellipsizeMode="middle"
                        style={{
                            color: theme.colors.onSurfaceVariant
                        }}
                    >
                        {address}
                    </Text>
                </View>
            </Card.Content>
        </Card>
    );
}

export default function ImportAccountScreen() {
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

    const { accounts } = useKeyringContext();
    const { client, loading, error, handleApprove, handleReject } = useRequestHandler({
        type: 'importAccount',
        onApprove: async () => {
            if (!selectedAddress) {
                throw new Error('No address selected');
            }
            return { address: selectedAddress };
        },
    });

    if (!client) return <ErrorScreen error="Client not found" />;
    const clientName = client.name ?? client.id;

    const displayedAccounts = accounts.filter(account => !account.isHidden);

    return (
        <>
            <Stack.Screen
                options={{
                    headerRight: () => (
                        useRequestTemplateHeader(loading)
                    ),
                }}
            />

            <RequestTemplate
                title="Import Account"
                description={clientName + " is requesting to import an existing account. Do you approve?"}
                onApprove={() => void handleApprove()}
                onReject={() => void handleReject()}
                canApprove={!!selectedAddress}
                loading={loading}
                error={error}
            >
                <Text variant="titleMedium" style={{ marginBottom: 12 }}>
                    Select Account
                </Text>
                <ScrollView style={{ flex: 1 }}>
                    {displayedAccounts.map((account) => (
                        <AccountItem
                            key={account.address}
                            address={account.address}
                            {...(account.name && { name: account.name })}
                            isSelected={selectedAddress === account.address}
                            onSelect={setSelectedAddress}
                        />
                    ))}
                </ScrollView>
            </RequestTemplate>
        </>
    );
}