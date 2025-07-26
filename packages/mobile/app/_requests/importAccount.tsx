import React from 'react';
import { View, Text, Button } from 'react-native';
import { useSeedPhraseContext } from '../../contexts/SeedPhraseContext';
import { useRequestHandler } from '../../hooks/useRequestHandler';
import { Address } from 'viem';

export default function ImportAccountScreen() {
    let [selectedAddress, setSelectedAddress] = React.useState<Address | null>(null);

    const { accounts } = useSeedPhraseContext();
    const { loading, error, handleApprove, handleReject } = useRequestHandler({
        type: 'importAccount',
        onApprove: async () => {
            if (!selectedAddress) {
                throw new Error('No address selected');
            }
            return { address: selectedAddress };
        },
    });

    if (loading) return <Text>Loading...</Text>;
    if (error) return <Text>Error: {error}</Text>;

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
            <Text style={{ fontSize: 24, marginBottom: 20 }}>Import Account</Text>
            <Text style={{ marginBottom: 30 }}>
                MetaMask is requesting to import an existing account. Do you approve?
            </Text>
            {accounts.map((account) => (
                <Button
                    key={account.address}
                    title={`Select ${account.address}`}
                    onPress={() => setSelectedAddress(account.address)}
                />
            ))}

            <View style={{ flexDirection: 'row', marginTop: 20 }}>
                <Button
                    title="Approve"
                    onPress={handleApprove}
                    disabled={!selectedAddress}
                />
                <Button
                    title="Reject"
                    onPress={handleReject}
                    color="red"
                />
            </View>
        </View>
    );
}