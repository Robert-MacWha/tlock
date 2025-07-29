import React from 'react';
import { View, Text, Button } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

export default function RequestNotFound() {
    const _params = useLocalSearchParams();

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
            <Text style={{ fontSize: 24, marginBottom: 20 }}>
                Unknown Request Type
            </Text>
            <Text style={{ marginBottom: 30 }}>
                This request type is not supported by the app.
            </Text>
            <Button title="Go Back" onPress={() => router.back()} />
        </View>
    );
}