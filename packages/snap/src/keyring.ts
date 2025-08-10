import {
    recoverPersonalSignature,
} from '@metamask/eth-sig-util';
import type {
    Keyring,
    KeyringAccount,
    KeyringRequest,
    KeyringResponse,
} from '@metamask/keyring-api';
import {
    emitSnapKeyringEvent,
    KeyringEvent,
    EthAccountType,
    EthMethod,
} from '@metamask/keyring-api';
import type { Json } from '@metamask/snaps-sdk';
import type {
    Client,
    RequestType,
    RequestTypeMap,
} from '@tlock/shared';
import { v4 as uuid } from 'uuid';
import { serializeTransaction, type Address, type Hex } from 'viem';

import type { KeyringState } from './state';
import { updateState } from './state';
import { KeyringRequestParams, mapViemTransactionType, transactionRequestToViem as toViemTransaction, TransactionRequest, TypedDataRequest, typedDataToViem, viemTxToJson } from './keyringTypes';
import { POLL_INTERVAL, POLL_TIMEOUT, ERROR_CODES, ACCOUNT_NAME_SUGGESTION } from './constants';
import { throwError, handleError } from './errors';

// https://github.com/MetaMask/snap-simple-keyring/blob/main/packages/snap/src/keyring.ts
export class TlockKeyring implements Keyring {
    private client: Client;
    private state: KeyringState;
    private origin?: string | undefined;

    constructor(client: Client, state?: KeyringState, origin?: string) {
        this.client = client;
        this.state = state ?? {
            wallets: {},
            pendingRequests: {},
        };
        this.origin = origin;
    }

    /**
     * Generic utility to poll for request completion with consistent error handling
     */
    private async pollForRequestCompletion<T extends RequestType>(
        requestId: string,
        requestType: T,
        completionCheck: (response: RequestTypeMap[T]) => boolean = (r: RequestTypeMap[T]) => r.status !== 'pending'
    ): Promise<RequestTypeMap[T]> {
        try {
            const response = await this.client.pollUntil(
                requestId,
                requestType,
                POLL_INTERVAL,
                POLL_TIMEOUT,
                completionCheck,
            );
            await this.client.deleteRequest(requestId);
            return response;
        } catch (error) {
            handleError(error, ERROR_CODES.SIGNING_FAILED, `Polling for ${requestType} completion`);
        }
    }

    async listAccounts(): Promise<KeyringAccount[]> {
        console.log('Listing accounts');

        return Object.values(this.state.wallets).map(
            (wallet) => wallet.account,
        );
    }

    async getAccount(id: string): Promise<KeyringAccount | undefined> {
        console.log('Getting account with ID:', id);

        const wallet = this.state.wallets[id];
        if (!wallet) {
            throwError(ERROR_CODES.ACCOUNT_NOT_FOUND, `Account with ID ${id} not found`);
        }
        return wallet.account;
    }

    async createAccount(
        options: Record<string, Json> = {},
    ): Promise<KeyringAccount> {
        console.log('Creating account with options:', options);

        const requestId = await this.client.submitRequest('importAccount', {
            status: 'pending',
        });

        const response = await this.pollForRequestCompletion(
            requestId,
            'importAccount'
        );

        if (!response.address) {
            throwError(ERROR_CODES.IMPORT_FAILED, 'No address returned from mobile device');
        }

        const id = uuid();
        const { address } = response;
        const account = {
            id,
            address,
            options: {},
            methods: [
                EthMethod.PersonalSign,
                EthMethod.Sign,
                EthMethod.SignTransaction,
                EthMethod.SignTypedDataV1,
                EthMethod.SignTypedDataV3,
                EthMethod.SignTypedDataV4,
            ],
            type: EthAccountType.Eoa,
        };

        try {
            await emitSnapKeyringEvent(snap, KeyringEvent.AccountCreated, {
                account,
                accountNameSuggestion: ACCOUNT_NAME_SUGGESTION,
            });
        } catch (error) {
            // TODO: Handle error where account is already registered more gracefully
            handleError(error, ERROR_CODES.ACCOUNT_CREATION_FAILED, 'Error registering account with MetaMask');
        }

        this.state.wallets[id] = { account };
        await this.saveState();
        return account;
    }

    async filterAccountChains(id: string, chains: string[]): Promise<string[]> {
        console.log('Filtering account chains for ID:', id, 'Chains:', chains);

        // Accounts only compatible with EVM chains
        return chains.filter((chain) => chain.startsWith('eip155:'));
    }

    async updateAccount(account: KeyringAccount): Promise<void> {
        console.log('Updating account:', account);

        const wallet = this.state.wallets[account.id];
        if (!wallet) {
            throwError(ERROR_CODES.ACCOUNT_NOT_FOUND, `Account with ID ${account.id} not found`);
        }

        const newAccount: KeyringAccount = {
            ...wallet.account,
            ...account,
            // Restore read-only properties.
            address: wallet.account.address,
        };

        await emitSnapKeyringEvent(snap, KeyringEvent.AccountUpdated, {
            account: newAccount,
        });
        wallet.account = newAccount;
        await this.saveState();
    }

    async deleteAccount(id: string): Promise<void> {
        console.log('Deleting account with ID:', id);

        await emitSnapKeyringEvent(snap, KeyringEvent.AccountDeleted, { id });
        delete this.state.wallets[id];
        await this.saveState();
    }

    async listRequests?(): Promise<KeyringRequest[]> {
        console.log('Listing requests');

        return Object.values(this.state.pendingRequests);
    }

    async getRequest?(id: string): Promise<KeyringRequest | undefined> {
        console.log('Getting request with ID:', id);

        const request = this.state.pendingRequests[id];
        if (!request) {
            throwError(ERROR_CODES.REQUEST_NOT_FOUND, `Request with ID ${id} not found`);
        }
        return request;
    }

    async submitRequest(request: KeyringRequest): Promise<KeyringResponse> {
        console.log('Submitting request:', request);

        const req: KeyringRequestParams = request.request as KeyringRequestParams;
        const signature = await this.handleSigningRequest(req);
        return {
            pending: false,
            result: signature,
        };
    }

    async approveRequest?(
        id: string,
        _response: KeyringResponse,
    ): Promise<void> {
        const pendingRequest = this.state.pendingRequests[id];
        if (!pendingRequest) {
            throwError(ERROR_CODES.REQUEST_NOT_FOUND, `Request with ID ${id} not found`);
        }

        let result: Json;
        try {
            result = await this.handleSigningRequest(pendingRequest.request as KeyringRequestParams);
        } catch (error) {
            console.error('Error handling signing request:', error);
            await this.rejectRequest(id);
            return;
        }

        await this.removePendingRequest(id);
        await emitSnapKeyringEvent(snap, KeyringEvent.RequestApproved, {
            id,
            result,
        });
    }

    async rejectRequest(id: string): Promise<void> {
        console.log('Rejecting request with ID:', id);

        if (!this.state.pendingRequests[id]) {
            throwError(ERROR_CODES.REQUEST_NOT_FOUND, `Request with ID ${id} not found`);
        }

        await this.removePendingRequest(id);
        await emitSnapKeyringEvent(snap, KeyringEvent.RequestRejected, { id });
    }

    private async removePendingRequest(id: string) {
        delete this.state.pendingRequests[id];
        await this.saveState();
    }

    private async handleSigningRequest(request: KeyringRequestParams): Promise<Json> {
        switch (request.method) {
            case EthMethod.PersonalSign: {
                const [message, from] = request.params;
                return await this.signPersonalMessage(message, from);
            }
            case EthMethod.SignTransaction: {
                const [tx] = request.params;
                return await this.signTransaction(tx);
            }
            case EthMethod.SignTypedDataV4: {
                const [from, data] = request.params;
                return await this.signTypedData(
                    from,
                    data,
                );
            }
            case EthMethod.Sign: {
                const [from, data] = request.params;
                return await this.signMessage(from, data);
            }
            default: {
                throw new Error(`EVM method '${request.method}' not supported`);
            }
        }
    }

    private async signPersonalMessage(
        message: Hex,
        from: Address,
    ): Promise<Hex> {
        console.log('Signing personal message:', message, 'from:', from);

        const requestId = await this.client.submitRequest('signPersonal', {
            status: 'pending',
            origin: this.origin,
            message,
            from,
        });

        const response = await this.pollForRequestCompletion(
            requestId,
            'signPersonal'
        );

        if (!response.signature) {
            throwError(ERROR_CODES.SIGNING_FAILED, 'No signature returned');
        }

        const recoveredAddress = recoverPersonalSignature({
            data: response.message,
            signature: response.signature,
        });

        if (recoveredAddress !== from) {
            throwError(
                ERROR_CODES.SIGNATURE_VERIFICATION_FAILED,
                `Recovered address ${recoveredAddress} does not match from address ${from}`
            );
        }

        console.log(`Recovered address matches from address: ${recoveredAddress}`);
        console.log(
            `Signed personal message for request ${requestId} from=${from} message=${message} signature=${response.signature}`,
        );
        return response.signature;
    }

    private async signTransaction(tx: TransactionRequest): Promise<Json> {
        console.log('Raw transaction from MetaMask:', tx);
        const viemTx = toViemTransaction(tx);
        console.log('Viem transaction:', viemTx);

        const requestId = await this.client.submitRequest('signTransaction', {
            status: 'pending',
            origin: this.origin,
            from: tx.from,
            transaction: serializeTransaction(viemTx),
        });

        const response = await this.pollForRequestCompletion(
            requestId,
            'signTransaction'
        );

        if (!response.signed) {
            throwError(ERROR_CODES.SIGNING_FAILED, 'No signed transaction returned');
        }

        const signed = response.signed;
        const json = viemTxToJson(signed, mapViemTransactionType(viemTx.type));
        return json;
    }

    private async signTypedData(
        from: Address,
        data: TypedDataRequest,
    ): Promise<Hex> {
        console.log('Signing typed data V4:', data, 'from:', from);

        const requestId = await this.client.submitRequest('signTypedData', {
            status: 'pending',
            origin: this.origin,
            from,
            data: typedDataToViem(data),
        });

        const response = await this.pollForRequestCompletion(
            requestId,
            'signTypedData'
        );

        if (!response.signature) {
            throwError(ERROR_CODES.SIGNING_FAILED, 'No signature returned');
        }

        return response.signature;
    }

    private async signMessage(from: Address, data: Hex): Promise<Hex> {
        console.log('Signing message:', data, 'from:', from);

        const requestId = await this.client.submitRequest('signMessage', {
            status: 'pending',
            origin: this.origin,
            from,
            message: data,
        });

        const response = await this.pollForRequestCompletion(
            requestId,
            'signMessage'
        );

        if (!response.signature) {
            throwError(ERROR_CODES.SIGNING_FAILED, 'No signature returned');
        }

        return response.signature;
    }

    private async saveState(): Promise<void> {
        await updateState({
            keyringState: this.state,
        });
    }
}
