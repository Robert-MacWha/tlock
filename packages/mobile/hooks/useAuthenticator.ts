import * as LocalAuthentication from 'expo-local-authentication';

export function useAuthenticator() {
    const authenticate = async (): Promise<void> => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        if (!compatible) {
            throw new Error('Biometric authentication not available');
        }

        const enrolled = await LocalAuthentication.isEnrolledAsync();

        if (!enrolled) {
            throw new Error('Biometric authentication not enrolled');
        }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to continue',
            cancelLabel: 'Cancel',
            disableDeviceFallback: false,
        });

        if (!result.success) {
            throw new Error('Authentication failed');
        }
    };

    return {
        authenticate,
    };
}