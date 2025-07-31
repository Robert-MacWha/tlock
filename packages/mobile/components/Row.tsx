import React from 'react';
import { View } from 'react-native';
import { MD3TypescaleKey, Text } from "react-native-paper";

interface KeyValueRowProps {
    label: string;
    value: string;
    labelVariant?: keyof typeof MD3TypescaleKey;
    valueVariant?: keyof typeof MD3TypescaleKey;
    minSpacing?: number;
}

export const KeyValueRow = ({
    label,
    value,
    labelVariant = 'bodyMedium',
    valueVariant = 'titleMedium',
    minSpacing = 16
}: KeyValueRowProps) => (
    <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: minSpacing
    }}>
        <Text variant={labelVariant} style={{ flexShrink: 0 }}>
            {label}
        </Text>
        <Text
            variant={valueVariant}
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
                flex: 1,
                textAlign: 'right',
                paddingLeft: 32,
            }}
        >
            {value}
        </Text>
    </View>
);