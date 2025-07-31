import React from "react";
import { Surface, Text, useTheme } from "react-native-paper";

interface ErrorScreenProps {
    error: string;
}

export function ErrorScreen({ error }: ErrorScreenProps) {
    const theme = useTheme();
    return (
        <Surface style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <Text variant="headlineSmall" style={{ color: theme.colors.error, marginBottom: 8 }}>
                Error
            </Text>
            <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
                {error}
            </Text>
        </Surface>
    )
}