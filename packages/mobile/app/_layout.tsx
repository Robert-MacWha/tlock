import './polyfills';

import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import { SeedPhraseProvider } from '../contexts/SeedPhraseContext';
import { SecureClientProvider } from '../contexts/SecureClientContext';
import { RequestReceiverProvider } from '../contexts/RequestReciever';

export default function RootLayout() {
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();

    useEffect(() => {
        requestPermissions();
    }, []);

    const requestPermissions = async () => {
        requestCameraPermission();
        // await Notifications.requestPermissionsAsync();
    }

    return (
        <SeedPhraseProvider>
            <SecureClientProvider>
                <RequestReceiverProvider>
                    <Tabs>
                        <Tabs.Screen
                            name="index"
                            options={{
                                title: 'Home',
                            }}
                        />
                        <Tabs.Screen
                            name="accounts"
                            options={{
                                title: 'Accounts',
                            }}
                        />
                        <Tabs.Screen
                            name="requests"
                            options={{
                                title: 'Requests',
                            }}
                        />
                        <Tabs.Screen
                            name="_requests"
                            options={{
                                href: null
                            }}
                        />
                    </Tabs>
                </RequestReceiverProvider>
            </SecureClientProvider>
        </SeedPhraseProvider>
    );
}
