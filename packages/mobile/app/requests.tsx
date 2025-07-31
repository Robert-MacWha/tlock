import React from "react";
import { ScrollView, View } from "react-native";
import { Text, Button } from "react-native-paper";
import { useRequestReceiverContext } from "../contexts/RequestRecieverContext";
import { RequestCard } from "../components/RequestCard";

export default function AccountsScreen() {
    const { clientRequests, fetchRequests } = useRequestReceiverContext();

    return (
        <>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
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
            </ScrollView>
            {clientRequests.length === 0 && (
                <View style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: 32,
                }}>
                    <Button mode="contained" onPress={() => void fetchRequests()}>
                        Fetch Requests
                    </Button>
                </View>
            )}
        </>
    )
}
