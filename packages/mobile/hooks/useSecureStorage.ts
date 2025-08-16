import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

export function useSecureStorage() {
    const [securityLevel, setSecurityLevel] =
        useState<LocalAuthentication.SecurityLevel | null>(null);

    useEffect(() => {
        const checkSecurityLevel = async () => {
            try {
                const level = await LocalAuthentication.getEnrolledLevelAsync();
                setSecurityLevel(level);
            } catch (error) {
                console.warn('Failed to get security level:', error);
                setSecurityLevel(LocalAuthentication.SecurityLevel.NONE);
            }
        };

        void checkSecurityLevel();
    }, []);

    const authenticate = async (): Promise<void> => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (
            !hasHardware &&
            securityLevel === LocalAuthentication.SecurityLevel.NONE
        ) {
            throw new Error(
                'No authentication method available. Please set up a device lock screen (PIN, pattern, or password) in your device settings.',
            );
        }

        if (
            !isEnrolled &&
            securityLevel === LocalAuthentication.SecurityLevel.NONE
        ) {
            throw new Error(
                'No authentication method set up. Please enable device lock screen or biometrics in your device settings.',
            );
        }

        const authResult = await LocalAuthentication.authenticateAsync({
            fallbackLabel: 'Use device passcode',
            disableDeviceFallback: false,
        });

        if (!authResult.success) {
            if (authResult.error === 'user_cancel') {
                throw new Error('Authentication cancelled by user');
            }
            throw new Error(`Authentication failed: ${authResult.error}`);
        }
    };

    const getItem = async (
        key: string,
        authenticated: boolean,
    ): Promise<string | null> => {
        if (authenticated) {
            await authenticate();
        }
        return SecureStore.getItem(key);
    };

    const setItem = async (
        key: string,
        value: string,
        authenticated: boolean,
    ): Promise<void> => {
        if (authenticated) {
            await authenticate();
        }
        await SecureStore.setItemAsync(key, value);
    };

    return {
        getItem,
        setItem,
        securityLevel,
    };
}
