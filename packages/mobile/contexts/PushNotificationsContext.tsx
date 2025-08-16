import React, { createContext, useContext, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import {
    usePushNotifications,
    UsePushNotificationsReturn,
} from '../hooks/usePushNotifications';

// Configure global notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

const PushNotificationsContext = createContext<
    UsePushNotificationsReturn | undefined
>(undefined);

interface PushNotificationsProviderProps {
    children: ReactNode;
}

export function PushNotificationsProvider({
    children,
}: PushNotificationsProviderProps) {
    const pushNotifications = usePushNotifications();

    return (
        <PushNotificationsContext.Provider value={pushNotifications}>
            {children}
        </PushNotificationsContext.Provider>
    );
}

export function usePushNotificationsContext(): UsePushNotificationsReturn {
    const context = useContext(PushNotificationsContext);
    if (context === undefined) {
        throw new Error(
            'usePushNotificationsContext must be used within a PushNotificationsProvider',
        );
    }
    return context;
}
