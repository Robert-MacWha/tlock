import { Address, Hex } from "viem";
import { decryptMessage, deriveRoomId, encryptMessage } from "./crypto";
import { FirebaseMessaging } from "./firebaseBackend";
import { CLOUD_FUNCTION_URL, DeviceRegistration, FIREBASE_URL, SharedSecret } from "./pairing";
import {
    SignTypedDataVersion,
} from '@metamask/eth-sig-util';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'error';
export type RequestType = 'createAccount' | 'signPersonal' | 'signTransaction' | 'signTypedData' | 'signMessage';

export interface CreateAccountRequest {
    status: RequestStatus;
    address?: string;
}

export interface SignPersonalRequest {
    status: RequestStatus;
    from: Address;
    message: Hex;
    signature?: Hex;
}

export interface SignTransactionRequest {
    status: RequestStatus;
    from: Address;
    transaction: string;
    signature?: Hex;
}

export interface SignTypedDataRequest {
    status: RequestStatus;
    from: Address;
    data: string; // JSON stringified data
    version: SignTypedDataVersion;
    signature?: Hex;
}

export interface SignMessageRequest {
    status: RequestStatus;
    from: Address;
    message: Hex;
    signature?: Hex;
}

export interface RequestTypeMap {
    createAccount: CreateAccountRequest;
    signPersonal: SignPersonalRequest;
    signTransaction: SignTransactionRequest;
    signTypedData: SignTypedDataRequest;
    signMessage: SignMessageRequest;
}

// Stored request format within the backend
export interface StoredRequest {
    type: RequestType;
    data: string;
    created: number;
}

export interface PendingRequest {
    id: string;
    type: RequestType;
}

export interface Request<T extends RequestType = RequestType> {
    id: string;
    type: T;
    data: RequestTypeMap[T];
}

export interface MessagingBackend {
    submitDevice(roomId: string, registration: string): Promise<void>;
    getDevice(roomId: string): Promise<string>;

    submitRequest(roomId: string, requestId: string, request: StoredRequest): Promise<void>;
    getRequest(roomId: string, requestId: string): Promise<StoredRequest | null>;
    getRequests(roomId: string): Promise<{ [requestId: string]: StoredRequest }>;
    deleteRequest(roomId: string, requestId: string): Promise<void>;

    sendNotification(roomId: string, requestId: string): Promise<void>;
}

// Handles encrypted communication with the backend
export class SecureClient {
    private backend: MessagingBackend;
    private sharedSecret: SharedSecret;
    public roomId: string;

    constructor(backend: MessagingBackend, sharedSecret: SharedSecret) {
        this.backend = backend;
        this.sharedSecret = sharedSecret;
        this.roomId = deriveRoomId(sharedSecret);
    }

    async submitDevice(fcmToken: string, deviceName: string): Promise<void> {
        const registration: DeviceRegistration = {
            fcmToken,
            deviceName,
        };

        const encryptedRegistration = encryptMessage(registration, this.sharedSecret);
        await this.backend.submitDevice(this.roomId, encryptedRegistration);
    }

    async getDevice(): Promise<DeviceRegistration | null> {
        const encryptedRegistration = await this.backend.getDevice(this.roomId);
        if (!encryptedRegistration) return null;

        try {
            return await decryptMessage(encryptedRegistration, this.sharedSecret);
        } catch {
            return null;
        }
    }

    // submits a request to the backend, returning a unique request ID
    async submitRequest<T extends RequestType>(type: RequestType, data: RequestTypeMap[T]): Promise<string> {
        const requestId = this.generateRequestId();

        const encryptedData = encryptMessage(data, this.sharedSecret);
        const storedRequest: StoredRequest = {
            type,
            data: encryptedData,
            created: Date.now()
        };

        await this.backend.submitRequest(this.roomId, requestId, storedRequest);
        return requestId;
    }

    async updateRequest<T extends RequestType>(id: string, type: T, data: RequestTypeMap[T]): Promise<void> {
        const encryptedData = encryptMessage(data, this.sharedSecret);
        const storedRequest: StoredRequest = {
            type: type,
            data: encryptedData,
            created: Date.now()
        };

        await this.backend.submitRequest(this.roomId, id, storedRequest);
    }

    // retrieves a request by its ID
    async getRequest<T extends RequestType>(id: string, requestType: T): Promise<RequestTypeMap[T]> {
        const encryptedRequest = await this.backend.getRequest(this.roomId, id);
        if (!encryptedRequest) throw new Error('Request not found');

        const data = await decryptMessage(encryptedRequest.data, this.sharedSecret) as RequestTypeMap[T];
        return data;
    }

    async getRequests(): Promise<PendingRequest[]> {
        const encryptedRequests = await this.backend.getRequests(this.roomId);
        const requests: PendingRequest[] = [];

        for (const [requestId, encryptedRequest] of Object.entries(encryptedRequests)) {
            const type = encryptedRequest.type;
            requests.push({ type, id: requestId });
        }

        return requests;
    }

    async deleteRequest(id: string): Promise<void> {
        await this.backend.deleteRequest(this.roomId, id);
    }

    async pollUntil<T extends RequestType>(
        requestId: string,
        requestType: T,
        intervalMs: number,
        timeoutSeconds: number,
        condition: (response: RequestTypeMap[T]
        ) => boolean,
    ): Promise<RequestTypeMap[T]> {
        const startTime = Date.now();

        while (true) {
            await new Promise(resolve => setTimeout(resolve, intervalMs));

            const data = await this.getRequest(requestId, requestType);
            if (condition(data)) {
                return data;
            }

            console.log(`Polling request ${requestId}...`);

            if ((Date.now() - startTime) / 1000 > timeoutSeconds) {
                throw new Error(`Polling timed out after ${timeoutSeconds} seconds`);
            }
        }
    }

    private generateRequestId(): string {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 15);
        const id = `${timestamp}_${random}`;
        return id;
    }
}

export function createSecuredClient(
    sharedSecret: SharedSecret,
    fcmToken?: string,
) {
    const backend = new FirebaseMessaging(FIREBASE_URL, CLOUD_FUNCTION_URL, fcmToken);
    return new SecureClient(backend, sharedSecret);
}