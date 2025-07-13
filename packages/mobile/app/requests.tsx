import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { useSeedPhraseContext } from "../contexts/SeedPhraseContext";
import { useSecureClientContext } from "../contexts/SecureClientContext";
import { useRequestReceiverContext } from "../contexts/RequestReciever";
import { requestHandler } from "../services/RequestHandlerService";

export default function RequestsScreen() {
    const { pendingRequests, getPendingRequests } = useRequestReceiverContext();
    const { secureClient } = useSecureClientContext();
    const { accounts, addAccount, sign } = useSeedPhraseContext();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Requests View</Text>

            {!secureClient && (
                <Text>Unpaired</Text>
            )}

            {secureClient && (
                <View>
                    <Text>Paired with Room ID: {secureClient.roomId.substring(0, 4)}</Text>
                    <Button title="Get Requests" onPress={() => getPendingRequests()} />
                </View>
            )}

            {pendingRequests.length > 0 && (
                <View>
                    <Text style={styles.title}>Requests</Text>
                    {pendingRequests.map((request) => (
                        <View key={request.id} style={styles.requestItem}>
                            <Text>Type: {request.type}</Text>
                            <Text>ID: {request.id}</Text>
                            <View style={styles.buttonRow}>
                                <Button title="Handle" onPress={() => requestHandler.handleRequest(request)} />
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
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