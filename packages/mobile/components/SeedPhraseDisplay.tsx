import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { Text, Surface } from 'react-native-paper';

interface SeedPhraseDisplayProps {
    seedPhrase: string;
    style?: StyleProp<ViewStyle>;
}

export function SeedPhraseDisplay({ seedPhrase, style }: SeedPhraseDisplayProps) {
    const words = seedPhrase.split(' ');

    return (
        <Surface
            style={[
                {
                    padding: 16,
                    borderRadius: 16,
                    elevation: 1
                },
                style
            ]}
        >
            <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8
            }}>
                {words.map((word, index) => (
                    <Surface
                        key={index}
                        style={{
                            flexGrow: 1,
                            flexBasis: '30%', // Roughly 3 columns, but flexible
                            minWidth: 120,     // Minimum width to prevent too narrow
                            maxWidth: '48%',  // Maximum width for very wide screens
                            minHeight: 40,
                            borderRadius: 12,
                            elevation: 0,
                            borderWidth: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 12,
                            paddingVertical: 8
                        }}
                    >
                        <Text
                            variant="labelSmall"
                            style={{
                                minWidth: 16,
                                marginRight: 8
                            }}
                        >
                            {index + 1}
                        </Text>
                        <Text
                            variant="bodyMedium"
                            style={{
                                fontWeight: '500',
                                flex: 1
                            }}
                        >
                            {word}
                        </Text>
                    </Surface>
                ))}
            </View>

            <Text
                variant="bodySmall"
                style={{
                    marginTop: 16,
                    textAlign: 'center',
                    fontStyle: 'italic'
                }}
            >
                Keep this phrase secure and private
            </Text>
        </Surface>
    );
}