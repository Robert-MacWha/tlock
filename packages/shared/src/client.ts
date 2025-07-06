import { decryptMessage, encryptMessage } from "./crypto";
import { FirebaseMessaging } from "./firebaseBackend";
import { DeviceRegistration, PairingData } from "./pairing";

// Stored request format within the backend
export interface StoredRequest {
    requestType: 'signTransaction';
    data: string;
    created: number;
}

export interface MessagingBackend {
    submitDevice(roomId: string, registration: string): Promise<void>;
    getDevice(roomId: string): Promise<string>;

    submitRequest(roomId: string, requestId: string, request: StoredRequest): Promise<void>;
    getRequest(roomId: string, requestId: string): Promise<StoredRequest | null>;

    sendNotification(roomId: string, requestId: string): Promise<void>;
}

// Handles encrypted communication with the backend
export class SecureClient {
    constructor(
        private backend: MessagingBackend,
        private pairingData: PairingData
    ) { }

    async submitDevice(fcmToken: string, deviceName: string): Promise<void> {
        const registration: DeviceRegistration = {
            fcmToken,
            deviceName,
        };

        const encryptedRegistration = encryptMessage(registration, this.pairingData.sharedSecret);
        await this.backend.submitDevice(this.pairingData.roomId, encryptedRegistration);
    }

    async getDevice(): Promise<DeviceRegistration | null> {
        const encryptedRegistration = await this.backend.getDevice(this.pairingData.roomId);
        if (!encryptedRegistration) return null;

        try {
            return await decryptMessage(encryptedRegistration, this.pairingData.sharedSecret);
        } catch {
            return null;
        }
    }

    async submitRequest<T>(requestType: StoredRequest['requestType'], requestData: T): Promise<void> {
        const requestId = this.generateRequestId();

        const encryptedData = encryptMessage(requestData, this.pairingData.sharedSecret);
        const storedRequest: StoredRequest = {
            requestType,
            data: encryptedData,
            created: Date.now()
        };

        await this.backend.submitRequest(this.pairingData.roomId, requestId, storedRequest);
    }

    async getRequest<T>(requestId: string): Promise<T> {
        const encryptedRequest = await this.backend.getRequest(this.pairingData.roomId, requestId);
        if (!encryptedRequest) throw new Error('Request not found');

        const decryptedData = await decryptMessage(encryptedRequest.data, this.pairingData.sharedSecret);
        return decryptedData as T;
    }

    private generateRequestId(): string {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 15);
        const id = `${timestamp}_${random}`;
        return id;
    }
}

export function createSecuredClient(
    firebaseUrl: string,
    cloudFunctionUrl: string,
    pairingData: PairingData,
    fcmToken?: string,
) {
    const backend = new FirebaseMessaging(firebaseUrl, cloudFunctionUrl, fcmToken);
    return new SecureClient(backend, pairingData);
}