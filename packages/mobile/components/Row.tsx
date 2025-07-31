import React from 'react';
import { View } from 'react-native';
import { Text } from "react-native-paper";

interface KeyValueRowProps {
    label: string;
    value: string;
    labelVariant?: 'titleMedium' | 'titleSmall' | 'bodyLarge';
    valueVariant?: 'bodyMedium' | 'bodySmall' | 'labelLarge';
    spacing?: number;
}

export const KeyValueRow = ({
    label,
    value,
    labelVariant = 'titleMedium',
    valueVariant = 'bodyMedium',
    spacing = 16
}: KeyValueRowProps) => (
    <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    }}>
        <Text variant={labelVariant}>{label}</Text>
        <Text
            variant={valueVariant}
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
                marginLeft: spacing,
                flexShrink: 1,
                textAlign: 'right'
            }}
        >
            {value}
        </Text>
    </View>
);