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
    data: string; // encrypted
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

        // Validate StoredRequest structure
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

        // Verify request type matches
        if (storedRequest.type !== requestType) {
            throw new Error(
                `Request type mismatch: expected ${requestType}, got ${storedRequest.type}`,
            );
        }

        // Decrypt and validate the data
        const schema = RequestTypeSchemaMap[requestType];
        return decryptMessage(storedRequest.data, this.sharedSecret, schema);
    }

    async getRequests(): Promise<Request[]> {
        const rawData = await this.http.get<unknown>(
            this.firebaseUrl,
            FirebasePaths.requests(this.roomId),
        );

        if (!rawData) return [];

        // Validate that we got an object
        if (typeof rawData !== 'object' || rawData === null) {
            throw new Error(
                'Invalid requests data from Firebase: expected object',
            );
        }

        const requests: Request[] = [];
        for (const [requestId, rawStoredRequest] of Object.entries(rawData)) {
            try {
                // Validate each StoredRequest structure
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

                // Decrypt and validate the data
                const schema = RequestTypeSchemaMap[requestType];
                const decryptedData = decryptMessage(
                    storedRequest.data,
                    this.sharedSecret,
                    schema,
                );

                const request: Request = {
                    id: requestId,
                    type: requestType,
                    request: decryptedData,
                    lastUpdated: storedRequest.lastUpdated,
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
        fcmToken: string | undefined,
        requestId: string,
    ): Promise<void> {
        if (!fcmToken) {
            return;
        }

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
