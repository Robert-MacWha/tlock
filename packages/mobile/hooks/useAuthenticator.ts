import * as LocalAuthentication from 'expo-local-authentication';

export function useAuthenticator() {
    const authenticate = async (): Promise<void> => {
        console.log('Starting authentication process...');

        const compatible = await LocalAuthentication.hasHardwareAsync();
        if (!compatible) {
            console.warn('Authentication not supported on this device');
            throw new Error('Authentication not available');
        }

        const enrolled = await LocalAuthentication.isEnrolledAsync();

        if (!enrolled) {
            console.warn('Authentication not enrolled');
            // throw new Error('Authentication not enrolled');
        }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to continue',
            cancelLabel: 'Cancel',
            disableDeviceFallback: false,
        });

        if (!result.success) {
            console.warn('Authentication failed', result.error);
            throw new Error('Authentication failed');
        }

        console.log('Authentication successful');
    };

    return {
        authenticate,
    };
}