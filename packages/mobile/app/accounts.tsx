import React from "react";
import { Alert, Button, StyleSheet, Text, View } from "react-native";
import { useAccountsContext } from "../contexts/AccountsContext";

export default function AccountsScreen() {
    const { accounts, addAccount } = useAccountsContext();

    async function handleAddAccount() {
        try {
            const newAccount = await addAccount();
            Alert.alert('Success', `New account created: ${newAccount}`);
        } catch (error) {
            console.error('Failed to create account:', error);
            Alert.alert('Error', 'Failed to create new account. Please try again.');
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Accounts</Text>
            {accounts.length === 0 ? (
                <Text>No accounts available. Please create an account from Metamask.</Text>
            ) : (
                <View>
                    {accounts.map(account => (
                        <View key={account.id} style={styles.requestItem}>
                            <Text>Account ID: {account.id}</Text>
                            <Text>Address: {account.address}</Text>
                        </View>
                    ))}
                </View>
            )}

            <Button title="Add New Account" onPress={handleAddAccount} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    overlay: {
        position: 'absolute',
        bottom: 50,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 20,
        borderRadius: 10,
    },
    scanText: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
    },
    requestItem: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        marginBottom: 10,
        borderRadius: 5,
        width: '100%',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
});