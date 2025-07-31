import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { Text, Surface, IconButton, ActivityIndicator } from "react-native-paper";
import { useRequestReceiverContext } from "../contexts/RequestRecieverContext";
import { RequestCard } from "../components/RequestCard";
import { Stack } from "expo-router";
import { ErrorScreen } from "../components/ErrorScreen";

export default function AccountsScreen() {
    const { clientRequests, fetchRequests } = useRequestReceiverContext();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleRefresh() {
        if (loading) return;
        setLoading(true);

        await fetchRequests().catch((error) => {
            console.error('Failed to fetch requests:', error);
            setError('Failed to fetch requests. Please try again later.');
        });

        // Otherwise the loading indicator flashes annoyingly.
        await new Promise(resolve => setTimeout(resolve, 1000));

        setLoading(false);
    }

    if (error) return <ErrorScreen error={error} />;

    return (
        <>
            <Stack.Screen
                options={{
                    headerRight: () => (
                        <View style={{ flexDirection: 'row' }}>
                            <IconButton
                                icon="refresh"
                                onPress={() => void handleRefresh()}
                            />
                        </View>
                    ),
                }}
            />

            <Surface style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ gap: 16, padding: 24 }}>
                    {clientRequests.length === 0 ? (
                        <Text>No open requests</Text>
                    ) : (
                        clientRequests.map(request => (
                            <RequestCard
                                key={request.request.id}
                                request={request}
                            />
                        ))

                    )}

                    {loading && <ActivityIndicator animating={true} style={{ marginTop: 32 }} />}
                </ScrollView>
            </Surface>
        </>
    )
}
