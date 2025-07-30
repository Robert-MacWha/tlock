import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import { CameraView } from 'expo-camera';
// import * as Notifications from 'expo-notifications';
import { parseQrCode, Client } from '@tlock/shared';
import { useSecureClientContext } from '../contexts/SecureClientContext';

export default function App() {
    const [state, setState] = useState<'home' | 'scanning' | 'paired' | 'requests'>('home');
    const { secureClient, savePairing, unpair } = useSecureClientContext();
    const [isScanningBarCode, setIsScanningBarCode] = useState(false);

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (isScanningBarCode) return;
        setIsScanningBarCode(true);

        try {
            const sharedSecret = await parseQrCode(data);
            const client = await savePairing(sharedSecret);

            // const fcmToken = (await Notifications.getExpoPushTokenAsync()).data;
            const fcmToken = "new-fcm-token";
            await client.submitDevice(fcmToken, 'React Native App');
            setState('paired');

            Alert.alert('Success', 'Device paired successfully!');
        } catch (error) {
            console.error('Pairing failed:', error);
            Alert.alert('Error', 'Failed to pair device. Please try again.');
        } finally {
            setIsScanningBarCode(false);
        }
    };

    const renderQRScanner = () => {
        return (
            <View style={styles.container}>
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    onBarcodeScanned={(data) => { void handleBarCodeScanned(data) }}
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                    }}
                />
                <View style={styles.overlay}>
                    <Text style={styles.scanText}>Scan QR Code from MetaMask Snap</Text>
                    <Button title="Cancel" onPress={() => setState('home')} />
                </View>
            </View>
        );
    };

    if (state === 'scanning') {
        return renderQRScanner();
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Skylock 2FA</Text>

            {secureClient && (
                <Text>Paired with Room ID: {secureClient.roomId.substring(0, 4)}</Text>
            )}

            <Button title="Pair with MetaMask" onPress={() => setState('scanning')} />

            {secureClient && (
                <Button title="Unpair" onPress={() => { void unpair() }} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    overlay: {
        position: 'absolute',
        bottom: 50,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 20,
        borderRadius: 10,
    },
    scanText: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
    },
    requestItem: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        marginBottom: 10,
        borderRadius: 5,
        width: '100%',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
});