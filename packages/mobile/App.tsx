import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Alert, Platform } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
// import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { CLOUD_FUNCTION_URL, createSecuredClient, FIREBASE_URL, PairingData, parseQrCode, SecureClient } from '@tlock/shared';


export default function App() {
    const [state, setState] = useState<'home' | 'scanning' | 'paired' | 'requests'>('home');
    const [pairingData, setPairingData] = useState<PairingData | null>(null);
    const [secureClient, setSecureClient] = useState<SecureClient | null>(null);
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();

    useEffect(() => {
        requestPermissions();
        loadSavedPairing();
    }, []);

    const requestPermissions = async () => {
        await requestCameraPermission();
        // await Notifications.requestPermissionsAsync();
    }

    const loadSavedPairing = async () => {
        try {
            const saved = await SecureStore.getItemAsync('tlock_pairing');
            if (saved) {
                console.log('Loaded saved pairing data:');
                const data = JSON.parse(saved) as PairingData;
                setPairingData(data);

                const client = createSecuredClient(FIREBASE_URL, CLOUD_FUNCTION_URL, data);
                setSecureClient(client);

                setState('paired');
                await registerDevice(client);
                return;
            }
            console.log('No saved pairing data found');
        } catch (error) {
            console.error('Failed to load pairing:', error);
        }
    }

    const registerDevice = async (client: SecureClient) => {
        // const fcmToken = (await Notifications.getExpoPushTokenAsync()).data;
        const fcmToken = "new-fcm-token";
        await client.submitDevice(fcmToken, 'React Native App');
        console.log('Device registered successfully');
    };

    const [isScanningBarCode, setIsScanningBarCode] = useState(false);
    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (isScanningBarCode) return;
        setIsScanningBarCode(true);

        try {
            const newPairing = await parseQrCode(data);

            await SecureStore.setItemAsync('tlock_pairing', JSON.stringify(newPairing));
            setPairingData(newPairing);

            const client = createSecuredClient(FIREBASE_URL, CLOUD_FUNCTION_URL, newPairing);
            setSecureClient(client);
            await registerDevice(client);

            setState('paired');
            Alert.alert('Success', 'Device paired successfully!');
        } catch (error) {
            console.error('Pairing failed:', error);
            Alert.alert('Error', 'Failed to pair device. Please try again.');
        } finally {
            setIsScanningBarCode(false);
        }
    };

    if (state === 'scanning') {
        return (
            <View style={styles.container}>
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    onBarcodeScanned={handleBarCodeScanned}
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
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Skylock 2FA</Text>
            <Text>Secure your MetaMask transactions</Text>

            <Button title="Pair with MetaMask" onPress={() => setState('scanning')} />

            {pairingData && (
                <Text>Paired with Room ID: {pairingData.roomId}</Text>
            )}

            <StatusBar style="auto" />
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