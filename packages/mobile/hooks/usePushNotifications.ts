import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useSecureStorage } from './useSecureStorage';

const PUSH_TOKEN_KEY = 'tlock_push_token';

export interface UsePushNotificationsReturn {
    expoPushToken: string | null;
    isLoading: boolean;
    error: string | null;
    addNotificationReceivedListener: (
        listener: (notification: Notifications.Notification) => void,
    ) => Notifications.EventSubscription;
    addNotificationResponseReceivedListener: (
        listener: (response: Notifications.NotificationResponse) => void,
    ) => Notifications.EventSubscription;
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (!Device.isDevice) {
        throw new Error('Must use physical device for Push Notifications');
    }

    const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== Notifications.PermissionStatus.GRANTED) {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
        throw new Error(
            'Permission not granted to get push token for Push Notifications!',
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const projectId =
        (Constants?.expoConfig?.extra?.eas?.projectId as string) ??
        Constants?.easConfig?.projectId;
    if (!projectId) {
        throw new Error('Project ID not found');
    }

    const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
            projectId,
        })
    ).data;
    console.log('Push token generated:', pushTokenString);
    return pushTokenString;
}

export function usePushNotifications(): UsePushNotificationsReturn {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const secureStorage = useSecureStorage();

    useEffect(() => {
        const initializePushNotifications = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const storedToken = await secureStorage.getItem(
                    PUSH_TOKEN_KEY,
                    false,
                );
                if (storedToken) {
                    setExpoPushToken(storedToken);
                    setIsLoading(false);
                    return;
                }

                const token = await registerForPushNotificationsAsync();
                if (token) {
                    await secureStorage.setItem(PUSH_TOKEN_KEY, token, false);
                    setExpoPushToken(token);
                }
            } catch (error) {
                console.error(
                    'Failed to initialize push notifications:',
                    error,
                );
                setError(
                    error instanceof Error
                        ? error.message
                        : 'Unknown error occurred',
                );
            } finally {
                setIsLoading(false);
            }
        };

        void initializePushNotifications();
    }, [secureStorage]);

    const addNotificationReceivedListener = (
        listener: (notification: Notifications.Notification) => void,
    ): Notifications.EventSubscription => {
        return Notifications.addNotificationReceivedListener(listener);
    };

    const addNotificationResponseReceivedListener = (
        listener: (response: Notifications.NotificationResponse) => void,
    ): Notifications.EventSubscription => {
        return Notifications.addNotificationResponseReceivedListener(listener);
    };

    return {
        expoPushToken,
        isLoading,
        error,
        addNotificationReceivedListener,
        addNotificationResponseReceivedListener,
    };
}
