import '../lib/polyfills';

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import {
    DefaultTheme as NavLightTheme,
    ThemeProvider,
} from '@react-navigation/native'
import { KeyringProvider } from '../contexts/KeyringContext';
import { ClientsProvider } from '../contexts/ClientContext';
import { RequestReceiverProvider } from '../contexts/RequestRecieverContext';
import { useSetupStatus } from '../hooks/useSetupStatus';
import LoadingScreen from './_loading';
import SetupFlow from './_setup';
import { adaptNavigationTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { customTheme } from '../lib/theme';
import { AlertProvider } from '../components/AlertProvider';

export default function RootLayout() {
    const lightTheme = {
        ...MD3LightTheme,
        colors: customTheme.colors,
    }

    const { LightTheme } = adaptNavigationTheme({
        reactNavigationLight: NavLightTheme,
        materialLight: lightTheme,
        // reactNavigationDark: NavDarkTheme,
        // materialDark: darkTheme
    })

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
            <PaperProvider theme={lightTheme}>
                <KeyringProvider>
                    <AlertProvider>
                        <SetupFlow />
                    </AlertProvider>
                </KeyringProvider>
            </PaperProvider>
        );
    }

    return (
        <ThemeProvider value={{ ...LightTheme, fonts: NavLightTheme.fonts }}>
            <PaperProvider theme={lightTheme}>
                <KeyringProvider>
                    <ClientsProvider>
                        <RequestReceiverProvider pollingInterval={2000}>
                            <AlertProvider>
                                <Stack>
                                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                                    <Stack.Screen name="_requests" options={{ headerShown: false }} />
                                    <Stack.Screen name="clients" options={{
                                        title: 'Connected Wallets',
                                    }} />
                                    <Stack.Screen name="requests" options={{
                                        title: 'Requests',
                                    }} />
                                </Stack>
                            </AlertProvider>
                        </RequestReceiverProvider>
                    </ClientsProvider>
                </KeyringProvider>
            </PaperProvider >
        </ThemeProvider>
    );
}

