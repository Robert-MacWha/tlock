import {
    Client,
    DeviceRegistration,
    Request,
    RequestType,
    RequestTypeMap,
} from '.';
import {
    decryptMessage,
    deriveRoomId,
    encryptMessage,
    SharedSecret,
} from '../crypto';
import { FirebaseHttpClient, HttpClient } from './client';

const FIREBASE_URL = 'https://tlock-974e6-default-rtdb.firebaseio.com/';

interface StoredRequest {
    type: RequestType;
    data: string; // encrypted
    lastUpdated: number;
}

const FirebasePaths = {
    registration: (roomId: string) => `registrations/${roomId}`,
    request: (roomId: string, requestId: string) =>
        `requests/${roomId}/${requestId}`,
    requests: (roomId: string) => `requests/${roomId}`,
};

export class FirebaseClient implements Client {
    public roomId: string;
    public fcmToken?: string | undefined;
    private sharedSecret: SharedSecret;
    private http: HttpClient;

    constructor(
        sharedSecret: SharedSecret,
        fcmToken?: string,
        httpClient: HttpClient = new FirebaseHttpClient(),
    ) {
        this.sharedSecret = sharedSecret;
        this.roomId = deriveRoomId(sharedSecret);
        this.fcmToken = fcmToken;
        this.http = httpClient;
    }

    async submitDevice(fcmToken: string, deviceName: string): Promise<void> {
        const registration: DeviceRegistration = {
            fcmToken,
            deviceName,
        };

        const encryptedData = encryptMessage(registration, this.sharedSecret);

        await this.http.put(
            FIREBASE_URL,
            FirebasePaths.registration(this.roomId),
            {
                encryptedData,
                registeredAt: Date.now(),
            },
        );

        // Update our local FCM token for notifications
        this.fcmToken = fcmToken;
    }

    async getDevice(): Promise<DeviceRegistration | null> {
        const data = await this.http.get<{ encryptedData: string }>(
            FIREBASE_URL,
            FirebasePaths.registration(this.roomId),
        );

        if (!data || !data.encryptedData) {
            return null;
        }

        try {
            return decryptMessage<DeviceRegistration>(
                data.encryptedData,
                this.sharedSecret,
            );
        } catch {
            return null;
        }
    }

    async pollUntilDeviceRegistered(
        intervalMs: number,
        timeoutSeconds: number,
    ): Promise<DeviceRegistration> {
        const startTime = Date.now();

        while (true) {
            const device = await this.getDevice();
            if (device) {
                return device;
            }

            if ((Date.now() - startTime) / 1000 > timeoutSeconds) {
                throw new Error(
                    `Polling for device registration timed out after ${timeoutSeconds} seconds`,
                );
            }

            await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
    }

    async submitRequest<T extends RequestType>(
        type: T,
        data: RequestTypeMap[T],
    ): Promise<string> {
        if (!this.fcmToken) {
            throw new Error('Missing FCM token.');
        }

        const requestId = generateRequestId();
        const encryptedData = encryptMessage(data, this.sharedSecret);

        const storedRequest: StoredRequest = {
            type,
            data: encryptedData,
            lastUpdated: Date.now(),
        };

        await this.http.put(
            FIREBASE_URL,
            FirebasePaths.request(this.roomId, requestId),
            storedRequest,
        );
        await this.sendNotification(this.fcmToken, requestId);

        return requestId;
    }

    async updateRequest<T extends RequestType>(
        id: string,
        type: T,
        partialData: Partial<RequestTypeMap[T]>,
    ): Promise<void> {
        const existingRequest = await this.getRequest(id, type);
        const mergedData = { ...existingRequest, ...partialData };
        const encryptedData = encryptMessage(mergedData, this.sharedSecret);

        const storedRequest: StoredRequest = {
            type,
            data: encryptedData,
            lastUpdated: Date.now(),
        };

        await this.http.put(
            FIREBASE_URL,
            FirebasePaths.request(this.roomId, id),
            storedRequest,
        );
    }

    async getRequest<T extends RequestType>(
        id: string,
        _requestType: T,
    ): Promise<RequestTypeMap[T]> {
        const storedRequest = await this.http.get<StoredRequest>(
            FIREBASE_URL,
            FirebasePaths.request(this.roomId, id),
        );

        if (!storedRequest || !storedRequest.data) {
            throw new Error('Request not found');
        }

        return decryptMessage<RequestTypeMap[T]>(
            storedRequest.data,
            this.sharedSecret,
        );
    }

    async getRequests(): Promise<Request[]> {
        const data = await this.http.get<{
            [requestId: string]: StoredRequest;
        }>(FIREBASE_URL, FirebasePaths.requests(this.roomId));

        if (!data) return [];

        const requests: Request[] = [];
        for (const [requestId, storedRequest] of Object.entries(data)) {
            const requestType = storedRequest.type;
            const requestData = decryptMessage(
                storedRequest.data,
                this.sharedSecret,
            );

            const request: Request = {
                id: requestId,
                type: requestType,
                request: requestData,
                lastUpdated: storedRequest.lastUpdated,
            } as Request;

            requests.push(request);
        }

        return requests;
    }

    async deleteRequest(id: string): Promise<void> {
        await this.http.delete(
            FIREBASE_URL,
            FirebasePaths.request(this.roomId, id),
        );
    }

    async pollUntil<T extends RequestType>(
        requestId: string,
        requestType: T,
        intervalMs: number,
        timeoutSeconds: number,
        condition: (response: RequestTypeMap[T]) => boolean,
    ): Promise<RequestTypeMap[T]> {
        const startTime = Date.now();

        while (true) {
            await new Promise((resolve) => setTimeout(resolve, intervalMs));

            const data = await this.getRequest(requestId, requestType);
            if (condition(data)) {
                return data;
            }

            if ((Date.now() - startTime) / 1000 > timeoutSeconds) {
                throw new Error(`Polling timed out`);
            }
        }
    }

    private async sendNotification(
        fcmToken: string,
        requestId: string,
    ): Promise<void> {
        console.log(
            'TODO: Send notification to FCM token:',
            fcmToken,
            'for request ID:',
            requestId,
        );
        // await this.http.post(CLOUD_FUNCTION_URL, {
        //     data: {
        //         roomId: this.roomId,
        //         requestId,
        //         fcmToken: fcmToken
        //     }
        // });
    }
}

function generateRequestId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 15);
    return timestamp + '_' + random;
}
