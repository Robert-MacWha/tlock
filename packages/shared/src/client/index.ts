import { Address, Hex, TransactionSerialized, TypedDataDefinition } from 'viem';
import { FirebaseClient } from './firebaseClient';
import { SharedSecret } from '../crypto';

/**
 * Request represents a request currently pending in the backend.
 */
export type Request =
    | {
        id: string;
        lastUpdated: number;
        type: 'pair';
        request: PairRequest;
    }
    | {
        id: string;
        lastUpdated: number;
        type: 'importAccount';
        request: ImportAccountRequest;
    }
    | {
        id: string;
        lastUpdated: number;
        type: 'signPersonal';
        request: SignPersonalRequest;
    }
    | {
        id: string;
        lastUpdated: number;
        type: 'signTransaction';
        request: SignTransactionRequest;
    }
    | {
        id: string;
        lastUpdated: number;
        type: 'signTypedData';
        request: SignTypedDataRequest;
    }
    | {
        id: string;
        lastUpdated: number;
        type: 'signMessage';
        request: SignMessageRequest;
    };

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'error';
export type RequestType =
    | 'pair'
    | 'importAccount'
    | 'signPersonal'
    | 'signTransaction'
    | 'signTypedData'
    | 'signMessage';

export interface PairRequest {
    status: RequestStatus;
    fcmToken: string;
    deviceName: string;
}

export interface ImportAccountRequest {
    status: RequestStatus;
    address?: string;
}

export interface SignPersonalRequest {
    status: RequestStatus;
    origin?: string | undefined;
    from: Address;
    message: Hex;
    signature?: Hex;
}

export interface SignTransactionRequest {
    status: RequestStatus;
    origin?: string | undefined;
    from: Address;
    transaction: Hex;
    signed?: TransactionSerialized;
}

export interface SignTypedDataRequest {
    status: RequestStatus;
    origin?: string | undefined;
    from: Address;
    data: TypedDataDefinition;
    signature?: Hex;
}

export interface SignMessageRequest {
    status: RequestStatus;
    origin?: string | undefined;
    from: Address;
    message: Hex;
    signature?: Hex;
}

export interface RequestTypeMap {
    pair: PairRequest;
    importAccount: ImportAccountRequest;
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

    submitRequest<T extends RequestType>(
        type: T,
        data: RequestTypeMap[T],
    ): Promise<string>;
    updateRequest<T extends RequestType>(
        id: string,
        type: T,
        data: Partial<RequestTypeMap[T]>,
    ): Promise<void>;
    getRequest<T extends RequestType>(
        id: string,
        requestType: T,
    ): Promise<RequestTypeMap[T]>;
    getRequests(): Promise<Request[]>;
    deleteRequest(id: string): Promise<void>;

    pollUntil<T extends RequestType>(
        requestId: string,
        requestType: T,
        intervalMs: number,
        timeoutSeconds: number,
        condition: (response: RequestTypeMap[T]) => boolean,
    ): Promise<RequestTypeMap[T]>;
}

export function createClient(
    sharedSecret: SharedSecret,
    fcmToken?: string,
    firebaseUrl?: string,
): Client {
    return new FirebaseClient(sharedSecret, fcmToken, undefined, firebaseUrl);
}

export { DEFAULT_FIREBASE_URL } from '../constants';
