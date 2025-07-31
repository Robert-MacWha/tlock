import { useLocalSearchParams } from 'expo-router';
import React from 'react'
import { View } from "react-native"
import { Icon, Text, useTheme } from 'react-native-paper'

export default function SuccessScreen() {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const { type } = useLocalSearchParams() as { type: string };
    const theme = useTheme()

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 32 }}>
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
                <Icon source='check-circle' size={128} color={theme.colors.primary} />
            </View>
            <Text
                style={{
                    fontSize: 24,
                    marginBottom: 20,
                    textAlign: 'center',
                    textTransform: 'capitalize'
                }}
            >
                {type} Approved!
            </Text>
            <Text style={{ marginBottom: 128, textAlign: 'center' }}>
                Your request has been successfully processed. Check your wallet for the updated status.
            </Text>
        </View>
    )
}