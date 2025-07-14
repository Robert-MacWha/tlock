import { SignTypedDataVersion } from "@metamask/eth-sig-util";
import { Address, Hex } from "viem";
import { FirebaseClient } from "./firebaseClient";
import { SharedSecret } from "../crypto";

/**
 * PendingRequest represents a request currently pending in the backend.
 */
export interface PendingRequest {
    id: string;
    type: RequestType;
}

/**
 * DeviceRegistration used for pairing devices with the backend.
 * @property fcmToken - FCM token for push notifications to mobile devices.
 * @property deviceName - Name of the mobile device.
 */
export interface DeviceRegistration {
    fcmToken: string;
    deviceName: string;
}

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

/**
 * Client interface defines the methods for interacting with the backend
 * messaging system.
 */
export interface Client {
    roomId: string;

    submitDevice(fcmToken: string, deviceName: string): Promise<void>;
    getDevice(): Promise<DeviceRegistration | null>;

    submitRequest<T extends RequestType>(type: T, data: RequestTypeMap[T]): Promise<string>;
    updateRequest<T extends RequestType>(id: string, type: T, data: Partial<RequestTypeMap[T]>): Promise<void>;
    getRequest<T extends RequestType>(id: string, requestType: T): Promise<RequestTypeMap[T]>;
    getRequests(): Promise<PendingRequest[]>;
    deleteRequest(id: string): Promise<void>;

    pollUntil<T extends RequestType>(
        requestId: string,
        requestType: T,
        intervalMs: number,
        timeoutSeconds: number,
        condition: (response: RequestTypeMap[T]) => boolean,
    ): Promise<RequestTypeMap[T]>;
}

export function createClient(sharedSecret: SharedSecret, fcmToken?: string): Client {
    return new FirebaseClient(sharedSecret, fcmToken);
}