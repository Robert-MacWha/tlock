import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

export function useSecureStorage() {
    const [securityLevel, setSecurityLevel] = useState<LocalAuthentication.SecurityLevel | null>(null);

    useEffect(() => {
        const checkSecurityLevel = async () => {
            try {
                const level = await LocalAuthentication.getEnrolledLevelAsync();
                setSecurityLevel(level);
            } catch (error) {
                console.error('Failed to get security level:', error);
                setSecurityLevel(LocalAuthentication.SecurityLevel.NONE);
            }
        };

        void checkSecurityLevel();
    }, []);

    const authenticate = async (prompt?: string): Promise<void> => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
            throw new Error(
                'No authentication method available. Please set up device lock screen or biometrics in your device settings.'
            );
        }

        const authResult = await LocalAuthentication.authenticateAsync({
            promptMessage: prompt || 'Authenticate to access secure data',
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

    const getItem = async (key: string, authenticated: boolean = true, prompt?: string): Promise<string | null> => {
        if (authenticated) {
            await authenticate(prompt);
        }
        return SecureStore.getItem(key);
    };

    const setItem = async (key: string, value: string, authenticated: boolean = true, prompt?: string): Promise<void> => {
        if (authenticated) {
            await authenticate(prompt);
        }
        await SecureStore.setItemAsync(key, value);
    };

    return {
        getItem,
        setItem,
        securityLevel,
    };
}