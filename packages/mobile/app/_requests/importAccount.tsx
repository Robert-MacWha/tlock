import React, { useState } from 'react';
import { View, Text, Button, TouchableOpacity } from 'react-native';
import { useKeyringContext } from '../../contexts/KeyringContext';
import { useRequestHandler } from '../../hooks/useRequestHandler';
import { Address } from 'viem';

type AccountItemProps = {
    address: Address;
    isSelected: boolean;
    onSelect: (address: Address) => void;
};

function AccountItem({ address, isSelected, onSelect }: AccountItemProps) {
    return (
        <TouchableOpacity
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 10,
                marginVertical: 5,
                backgroundColor: isSelected ? '#e6f3ff' : '#f5f5f5',
                borderRadius: 5,
            }}
            onPress={() => onSelect(address)}
        >
            <View
                style={{
                    width: 20,
                    height: 20,
                    borderWidth: 2,
                    borderColor: isSelected ? '#007AFF' : '#ccc',
                    backgroundColor: isSelected ? '#007AFF' : 'transparent',
                    marginRight: 10,
                    borderRadius: 3,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {isSelected && (
                    <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>
                )}
            </View>
            <Text style={{ flex: 1 }}>{address}</Text>
        </TouchableOpacity>
    );
}

export default function ImportAccountScreen() {
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

    const { accounts } = useKeyringContext();
    const { loading, error, handleApprove, handleReject } = useRequestHandler({
        type: 'importAccount',
        onApprove: async () => {
            if (!selectedAddress) {
                throw new Error('No address selected');
            }
            return { address: selectedAddress };
        },
    });

    if (loading) {
        return <Text>Loading...</Text>;
    }
    if (error) {
        return <Text>Error: {error}</Text>;
    }

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
            <Text style={{ fontSize: 24, marginBottom: 20 }}>
                Import Account
            </Text>
            <Text style={{ marginBottom: 30 }}>
                MetaMask is requesting to import an existing account. Do you approve?
            </Text>

            <View style={{ marginBottom: 20 }}>
                {accounts.map((account) => (
                    <AccountItem
                        key={account.address}
                        address={account.address}
                        isSelected={selectedAddress === account.address}
                        onSelect={setSelectedAddress}
                    />
                ))}
            </View>

            <Button
                title="Create New Account"
                onPress={() => {
                    // Handle create new account logic
                    console.log('Create new account pressed');
                }}
                color="#28a745"
            />

            <View style={{ flexDirection: 'row', marginTop: 20 }}>
                <Button
                    title="Approve"
                    onPress={() => { void handleApprove() }}
                    disabled={!selectedAddress}
                />
                <Button title="Reject" onPress={() => { void handleReject }} color="red" />
            </View>
        </View>
    );
}