import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { PendingRequest, RequestType } from '@tlock/shared';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Central service for handling incoming requests from push notifications or in-app events.
 * Manages navigation to appropriate request screens and notification display.
 */
export class RequestHandlerService {
    private static instance: RequestHandlerService;
    private isAppInForeground = true;
    private appStateSubscription?: any;

    static getInstance(): RequestHandlerService {
        if (!RequestHandlerService.instance) {
            RequestHandlerService.instance = new RequestHandlerService();
        }
        return RequestHandlerService.instance;
    }

    initialize() {
        this.isAppInForeground = AppState.currentState === 'active';

        this.appStateSubscription = this.setupAppStateListener();
        this.setupNotificationHandlers();
    }

    cleanup() {
        this.appStateSubscription?.remove();
    }

    /**
     * Handles a request by navigating to the appropriate screen
     */
    async handleRequest(request: PendingRequest) {
        console.log('Handling request:', request);

        if (!this.isAppInForeground) {
            // App is in background, show push notification
            await this.showPushNotification(request);
        } else {
            // App is in foreground or user tapped notification, navigate directly
            await this.navigateToRequestScreen(request);
        }
    }

    private async showPushNotification(request: PendingRequest) {
        const notificationContent = this.getNotificationContent(request);

        await Notifications.scheduleNotificationAsync({
            content: {
                title: notificationContent.title,
                body: notificationContent.body,
                data: {
                    requestId: request.id,
                    requestType: request.type,
                },
                sound: true,
            },
            trigger: null,
        });
    }

    private async navigateToRequestScreen(request: PendingRequest) {
        router.push({
            pathname: `/_requests/${request.type}` as any,
            params: { requestId: request.id }
        });
    }

    private getNotificationContent(request: PendingRequest) {
        const contentMap: Record<RequestType, { title: string; body: string }> = {
            'createAccount': {
                title: 'Account Creation Request',
                body: 'Tap to approve creating a new account'
            },
            'signTransaction': {
                title: 'Transaction Signature Request',
                body: 'Tap to review and sign transaction'
            },
        };

        return contentMap[request.type] || {
            title: 'New Request',
            body: 'Tap to handle request'
        };
    }

    private setupNotificationHandlers() {
        Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            if (data.requestId && data.requestType) {
                this.navigateToRequestScreen({
                    id: data.requestId as string,
                    type: data.requestType as RequestType,
                });
            }
        });
    }

    private setupAppStateListener() {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            console.log('App state changed to:', nextAppState);
            this.isAppInForeground = nextAppState === 'active';
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return subscription;
    }
}

// Export a singleton instance
export const requestHandler = RequestHandlerService.getInstance();