import { Client, Request, RequestType, RequestTypeMap } from '.';
import {
    decryptMessage,
    deriveRoomId,
    encryptMessage,
    SharedSecret,
} from '../crypto';
import { FirebaseHttpClient, HttpClient } from './client';
import { DEFAULT_FIREBASE_URL } from '../constants';
import { StoredRequestSchema, RequestTypeSchemaMap } from '../validation';

interface StoredRequest {
    type: RequestType;
    data: string;
    lastUpdated: number;
}

const FirebasePaths = {
    request: (roomId: string, requestId: string) =>
        `requests/${roomId}/${requestId}`,
    requests: (roomId: string) => `requests/${roomId}`,
};

export class FirebaseClient implements Client {
    public roomId: string;
    public fcmToken?: string | undefined;
    private sharedSecret: SharedSecret;
    private http: HttpClient;
    private firebaseUrl: string;

    constructor(
        sharedSecret: SharedSecret,
        fcmToken?: string,
        httpClient: HttpClient = new FirebaseHttpClient(),
        firebaseUrl: string = DEFAULT_FIREBASE_URL,
    ) {
        this.sharedSecret = sharedSecret;
        this.roomId = deriveRoomId(sharedSecret);
        this.fcmToken = fcmToken;
        this.http = httpClient;
        this.firebaseUrl = firebaseUrl;
    }

    async submitRequest<T extends RequestType>(
        type: T,
        data: RequestTypeMap[T],
    ): Promise<string> {
        const requestId = generateRequestId();
        const encryptedData = encryptMessage(data, this.sharedSecret);

        const storedRequest: StoredRequest = {
            type,
            data: encryptedData,
            lastUpdated: Date.now(),
        };

        await this.http.put(
            this.firebaseUrl,
            FirebasePaths.request(this.roomId, requestId),
            storedRequest,
        );
        await this.sendNotification(`New ${type} request pending`);

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
            this.firebaseUrl,
            FirebasePaths.request(this.roomId, id),
            storedRequest,
        );
    }

    async getRequest<T extends RequestType>(
        id: string,
        requestType: T,
    ): Promise<RequestTypeMap[T]> {
        const rawStoredRequest = await this.http.get<unknown>(
            this.firebaseUrl,
            FirebasePaths.request(this.roomId, id),
        );

        if (!rawStoredRequest) {
            throw new Error('Request not found');
        }

        const storedRequestResult =
            StoredRequestSchema.safeParse(rawStoredRequest);
        if (!storedRequestResult.success) {
            const errorDetails = storedRequestResult.error.issues
                .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
                .join(', ');
            throw new Error(
                `Invalid stored request data from Firebase: ${errorDetails}`,
            );
        }

        const storedRequest = storedRequestResult.data;

        if (storedRequest.type !== requestType) {
            throw new Error(
                `Request type mismatch: expected ${requestType}, got ${storedRequest.type}`,
            );
        }

        const schema = RequestTypeSchemaMap[requestType];
        return decryptMessage(storedRequest.data, this.sharedSecret, schema);
    }

    async getRequests(): Promise<Request[]> {
        const rawData = await this.http.get<unknown>(
            this.firebaseUrl,
            FirebasePaths.requests(this.roomId),
        );

        if (!rawData) return [];

        const requests: Request[] = [];
        for (const [requestId, rawStoredRequest] of Object.entries(rawData)) {
            try {
                const storedRequestResult =
                    StoredRequestSchema.safeParse(rawStoredRequest);
                if (!storedRequestResult.success) {
                    console.warn(
                        `Skipping invalid stored request ${requestId}:`,
                        storedRequestResult.error.issues,
                    );
                    continue;
                }

                const storedRequest = storedRequestResult.data;
                const requestType = storedRequest.type;

                const schema = RequestTypeSchemaMap[requestType];
                const decryptedData = decryptMessage(
                    storedRequest.data,
                    this.sharedSecret,
                    schema,
                );

                const request: Request = {
                    id: requestId,
                    lastUpdated: storedRequest.lastUpdated,
                    type: requestType,
                    request: decryptedData,
                } as Request;

                requests.push(request);
            } catch (error) {
                console.warn(`Error processing request ${requestId}:`, error);
                // Continue processing other requests instead of failing completely
            }
        }

        return requests;
    }

    async deleteRequest(id: string): Promise<void> {
        await this.http.delete(
            this.firebaseUrl,
            FirebasePaths.request(this.roomId, id),
        );
    }

    async pollUntil<T extends RequestType>(
        id: string,
        type: T,
        intervalMs: number,
        timeoutSeconds: number,
        condition: (response: RequestTypeMap[T]) => boolean,
    ): Promise<RequestTypeMap[T]> {
        const startTime = Date.now();

        while (true) {
            await new Promise((resolve) => setTimeout(resolve, intervalMs));

            const data = await this.getRequest(id, type);
            if (condition(data)) {
                return data;
            }

            if ((Date.now() - startTime) / 1000 > timeoutSeconds) {
                throw new Error(`Polling timed out`);
            }
        }
    }

    private async sendNotification(
        body: string,
    ): Promise<void> {
        if (!this.fcmToken) {
            console.log('No FCM token available for notifications');
            return;
        }

        console.log(
            'Sending push notification to:',
            this.fcmToken,
            'with body:',
            body,
        );

        const message = {
            to: this.fcmToken,
            sound: 'default',
            title: `New Request`,
            body
        };

        //? Use Firebase Function as proxy to expo's CORS
        const functionUrl = `https://sendpushnotification-clnhgoo57a-uc.a.run.app`;

        await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: { message }
            }),
        });
    }
}

function generateRequestId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 15);
    return timestamp + '_' + random;
}
