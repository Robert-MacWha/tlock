import { MessagingBackend, StoredRequest } from "./client";

const FirebasePaths = {
    registration: (roomId: string) =>
        `registrations/${roomId}`,

    request: (roomId: string, requestId: string) =>
        `requests/${roomId}/${requestId}`,
};

export class FirebaseMessaging implements MessagingBackend {
    constructor(
        private firebaseUrl: string,
        private cloudFunctionUrl: string,
        private fcmToken?: string,
    ) { }

    async registerDevice(roomId: string, encryptedRegistration: string): Promise<void> {
        const response = await fetch(`${this.firebaseUrl}/${FirebasePaths.registration(roomId)}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                encryptedData: encryptedRegistration,
                registeredAt: Date.now()
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to register device: ${response.status}`);
        }
    }

    async getDeviceRegistration(roomId: string): Promise<string> {
        const response = await fetch(`${this.firebaseUrl}/${FirebasePaths.registration(roomId)}.json`);

        if (!response.ok) {
            throw new Error(`Failed to get registration: ${response.status}`);
        }

        const data = await response.json();
        if (!data || !data.encryptedData) {
            throw new Error('No registration data found for this room ID');
        }

        return data.encryptedData;
    }

    async submitRequest(roomId: string, requestId: string, request: StoredRequest): Promise<void> {
        const response = await fetch(`${this.firebaseUrl}/${FirebasePaths.request(roomId, requestId)}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            throw new Error(`Failed to submit request: ${response.status}`);
        }
    }

    async getRequest(roomId: string, requestId: string): Promise<StoredRequest | null> {
        const response = await fetch(`${this.firebaseUrl}/${FirebasePaths.request(roomId, requestId)}.json`);

        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`Failed to get request: ${response.status}`);
        }

        const data = await response.json();
        return data;
    }

    async sendNotification(roomId: string, requestId: string): Promise<void> {
        if (!this.fcmToken) {
            throw new Error('FCM token is not set');
        }

        const response = await fetch(this.cloudFunctionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: {
                    roomId,
                    requestId,
                    fcmToken: this.fcmToken
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to send notification: ${response.status}`);
        }
    }
}