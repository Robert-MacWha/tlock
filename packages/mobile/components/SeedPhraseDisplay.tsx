import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface SeedPhraseDisplayProps {
    seedPhrase: string;
    style?: StyleProp<ViewStyle>;
}

export function SeedPhraseDisplay({ seedPhrase, style }: SeedPhraseDisplayProps) {
    return (
        <View style={[styles.seedPhraseContainer, style]}>
            {seedPhrase.split(' ').map((word, index) => (
                <View key={index} style={styles.seedWord}>
                    <Text style={styles.seedWordNumber}>{index + 1}</Text>
                    <Text style={styles.seedWordText}>{word}</Text>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    seedPhraseContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginVertical: 20,
        padding: 32,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    seedWord: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginBottom: 8,
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dee2e6',
        width: '32%', // Approximately 1/3 with some spacing
    },
    seedWordNumber: {
        fontSize: 12,
        color: '#6c757d',
        marginRight: 8,
        minWidth: 16,
    },
    seedWordText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        flex: 1,
    },
});
