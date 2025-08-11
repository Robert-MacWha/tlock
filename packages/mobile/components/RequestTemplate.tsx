import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Text, Button, Surface, Snackbar, useTheme } from 'react-native-paper';

type RequestTemplateProps = {
    title: string;
    description: string;
    children: React.ReactNode;
    onApprove: () => void | Promise<void>;
    onReject: () => void | Promise<void>;
    canApprove?: boolean;
    loading?: boolean;
    error?: string | null;
    approveText?: string;
    rejectText?: string;
};

export function RequestTemplate({
    title,
    description,
    children,
    onApprove,
    onReject,
    canApprove = true,
    loading = false,
    error = null,
    approveText = 'Approve',
    rejectText = 'Reject',
}: RequestTemplateProps) {
    const [showError, setShowError] = useState(false);
    const theme = useTheme();

    useEffect(() => {
        if (error) {
            setShowError(true);
        }
    }, [error]);

    return (
        <>
            <Surface style={{ flex: 1, padding: 24 }}>
                <Text variant="headlineMedium" style={{ marginBottom: 8 }}>
                    {title}
                </Text>

                <Text
                    variant="bodyLarge"
                    style={{
                        marginBottom: 24,
                        color: theme.colors.onSurfaceVariant,
                    }}
                >
                    {description}
                </Text>

                <View style={{ flex: 1, marginBottom: 24 }}>{children}</View>

                <View
                    style={{
                        flexDirection: 'row',
                        gap: 12,
                        justifyContent: 'space-between',
                    }}
                >
                    <Button
                        onPress={() => {
                            void onReject();
                        }}
                        style={{ flex: 1 }}
                        textColor={theme.colors.error}
                        disabled={loading}
                    >
                        {rejectText}
                    </Button>
                    <Button
                        mode="contained"
                        onPress={() => {
                            void onApprove();
                        }}
                        disabled={!canApprove || loading}
                        style={{ flex: 1 }}
                    >
                        {approveText}
                    </Button>
                </View>
            </Surface>

            <Snackbar
                visible={showError && !!error}
                onDismiss={() => setShowError(false)}
                duration={4000}
                style={{ marginBottom: 16 }}
                action={{
                    label: 'Dismiss',
                    onPress: () => setShowError(false),
                }}
            >
                {error || ''}
            </Snackbar>
        </>
    );
}
