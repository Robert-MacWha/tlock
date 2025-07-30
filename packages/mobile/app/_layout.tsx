import './polyfills';

import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import { KeyringProvider } from '../contexts/KeyringContext';
import { SecureClientProvider } from '../contexts/SecureClientContext';
import { RequestReceiverProvider } from '../contexts/RequestReciever';
import { useSetupStatus } from '../hooks/useSetupStatus';
import LoadingScreen from './_loading';
import SetupFlow from './_setup';
import { DefaultTheme, PaperProvider } from 'react-native-paper';

const theme = {
    ...DefaultTheme,
}

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
            <KeyringProvider>
                <SetupFlow />
            </KeyringProvider>
        );
    }

    return (
        <PaperProvider theme={theme}>
            <KeyringProvider>
                <SecureClientProvider>
                    <RequestReceiverProvider>
                        {createTabs()}
                    </RequestReceiverProvider>
                </SecureClientProvider>
            </KeyringProvider>
        </PaperProvider>
    );
}

function createTabs() {
    return <Tabs>
        <Tabs.Screen
            name="index"
            options={{
                title: 'Home',
            }} />
        <Tabs.Screen
            name="accounts"
            options={{
                title: 'Accounts',
            }} />
        <Tabs.Screen
            name="requests"
            options={{
                title: 'Requests',
            }} />
        <Tabs.Screen
            name="settings"
            options={{
                title: 'Settings',
            }} />
        <Tabs.Screen
            name="_requests"
            options={{
                href: null
            }} />
        <Tabs.Screen
            name="_setup"
            options={{
                href: null
            }} />
        <Tabs.Screen
            name="_loading"
            options={{
                href: null
            }} />
    </Tabs>;
}

