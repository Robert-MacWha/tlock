import './polyfills';

import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import { SeedPhraseProvider } from '../contexts/SeedPhraseContext';
import { SecureClientProvider } from '../contexts/SecureClientContext';
import { RequestReceiverProvider } from '../contexts/RequestReciever';
import { useSetupStatus } from '../hooks/useSetupStatus';
import LoadingScreen from './_loading';
import SetupFlow from './_setup';

export default function RootLayout() {
    const { isSetupComplete } = useSetupStatus();
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();

    useEffect(() => {
        requestCameraPermission();
    }, []);

    // Show loading while checking setup status
    if (isSetupComplete === null) {
        return <LoadingScreen />;
    }

    // Show setup flow if not complete
    if (isSetupComplete === false) {
        return (
            <SeedPhraseProvider>
                <SetupFlow />
            </SeedPhraseProvider>
        );
    }

    // Show main app if setup is complete
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
                            name="settings"
                            options={{
                                title: 'Settings',
                            }}
                        />
                        <Tabs.Screen
                            name="_requests"
                            options={{
                                href: null
                            }}
                        />
                        <Tabs.Screen
                            name="_setup"
                            options={{
                                href: null
                            }}
                        />
                        <Tabs.Screen
                            name="_loading"
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
