import React, { useState } from "react";
import { setStringAsync } from "expo-clipboard";
import { Portal, Snackbar, Text } from "react-native-paper";

interface UseCopyableReturn {
    copy: (text: string, onCopy?: () => void) => Promise<void>;
    SnackbarComponent: () => React.ReactElement;
}

export function useCopyable(): UseCopyableReturn {
    const [snackbarVisible, setSnackbarVisible] = useState(false);

    const copy = async (text: string, onCopy?: () => void) => {
        await setStringAsync(text);
        setSnackbarVisible(true);
        onCopy?.();
    };

    const SnackbarComponent = () => (
        <Portal>
            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={800}
                wrapperStyle={{ pointerEvents: 'box-none' }}
            >
                Copied to clipboard
            </Snackbar>
        </Portal>
    );

    return { copy, SnackbarComponent };
}