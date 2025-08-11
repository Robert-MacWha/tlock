import '../lib/polyfills';

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import { KeyringProvider } from '../contexts/KeyringContext';
import { ClientsProvider } from '../contexts/ClientContext';
import { useSetupStatus } from '../hooks/useSetupStatus';
import LoadingScreen from './_loading';
import SetupFlow from './_setup';
import { AlertProvider } from '../components/AlertProvider';
import { ThemeProvider } from '../contexts/ThemeContext';
import { RequestManagerProvider } from '../contexts/RequestManagerContext';

export default function RootLayout() {
    const { isSetupComplete } = useSetupStatus();
    const [, requestCameraPermission] = useCameraPermissions();

    useEffect(() => {
        void requestCameraPermission();
    }, []);

    if (isSetupComplete === null) {
        return <LoadingScreen />;
    }

    if (isSetupComplete === false) {
        return (
            <ThemeProvider>
                <KeyringProvider>
                    <AlertProvider>
                        <SetupFlow />
                    </AlertProvider>
                </KeyringProvider>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider>
            <KeyringProvider>
                <ClientsProvider>
                    <RequestManagerProvider pollingInterval={2000}>
                        <AlertProvider>
                            <Stack>
                                <Stack.Screen
                                    name="(tabs)"
                                    options={{ headerShown: false }}
                                />
                                <Stack.Screen
                                    name="_requests"
                                    options={{ headerShown: false }}
                                />
                                <Stack.Screen
                                    name="_setup"
                                    options={{ headerShown: false }}
                                />
                                <Stack.Screen
                                    name="_docs"
                                    options={{ headerShown: false }}
                                />
                                <Stack.Screen
                                    name="clients"
                                    options={{
                                        title: 'Connected Devices',
                                    }}
                                />
                                <Stack.Screen
                                    name="requests"
                                    options={{
                                        title: 'Requests',
                                    }}
                                />
                            </Stack>
                        </AlertProvider>
                    </RequestManagerProvider>
                </ClientsProvider>
            </KeyringProvider>
        </ThemeProvider>
    );
}
