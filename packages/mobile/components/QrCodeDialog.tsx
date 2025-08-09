import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Modal, Portal, Text, Button, Dialog } from 'react-native-paper';
import { CameraView } from 'expo-camera';

interface QrCodeDialogProps {
    visible: boolean;
    instructions: string;
    onDismiss: () => void;
    onBarcodeScanned: (data: string) => void;
    isProcessing?: boolean;
}

export function QrCodeDialog({
    visible,
    instructions,
    onDismiss,
    onBarcodeScanned,
    isProcessing = false
}: QrCodeDialogProps) {
    const [hasScanned, setHasScanned] = useState(false);

    const handleBarcodeScanned = ({ data }: { data: string }) => {
        if (hasScanned || isProcessing) return;
        setHasScanned(true);
        onBarcodeScanned(data);
    };

    const handleDismiss = () => {
        setHasScanned(false);
        onDismiss();
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                dismissable={true}
                onDismiss={handleDismiss}
                contentContainerStyle={{ flex: 1, justifyContent: 'center' }}
            >
                <View style={styles.cameraContainer}>
                    <CameraView
                        style={StyleSheet.absoluteFillObject}
                        facing="back"
                        onBarcodeScanned={handleBarcodeScanned}
                        barcodeScannerSettings={{
                            barcodeTypes: ['qr'],
                        }}
                    />

                    <View style={styles.overlay}>
                        <View style={styles.scanFrameWrapper}>
                            <View style={styles.scanFrame} />
                        </View>
                    </View>

                    <Dialog visible={true} style={styles.instructionContainer}>
                        <Text variant="titleMedium" style={{ textAlign: 'center' }}>
                            {instructions}
                        </Text>
                        <Text variant="bodyMedium" style={{ textAlign: 'center', opacity: 0.7 }}>
                            Position the QR code within the frame
                        </Text>
                        <Button
                            mode="outlined"
                            onPress={handleDismiss}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                    </Dialog>
                </View>
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    cameraContainer: {
        flex: 1,
        position: 'relative',
        minHeight: 400,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    scanFrameWrapper: {
        flex: 1,
        justifyContent: 'center',
        marginTop: 60,
        marginBottom: 240,
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    instructionContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        padding: 32,
        paddingTop: 0,
        gap: 16,
    },
});