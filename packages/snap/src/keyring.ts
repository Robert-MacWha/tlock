import {
    recoverPersonalSignature,
    SignTypedDataVersion,
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
    ImportAccountRequest,
    SignMessageRequest,
    SignPersonalRequest,
    SignTransactionRequest,
    SignTypedDataRequest,
} from '@tlock/shared';
import { v4 as uuid } from 'uuid';
import type { Address, Hex, SignTypedDataParameters, Transaction } from 'viem';

import type { KeyringState } from './state';
import { updateState } from './state';

// https://github.com/MetaMask/snap-simple-keyring/blob/main/packages/snap/src/keyring.ts
export class TlockKeyring implements Keyring {
    private client: Client;
    private state: KeyringState;

    constructor(client: Client, state?: KeyringState) {
        console.log('TlockKeyring initialized');
        this.client = client;
        this.state = state ?? {
            wallets: {},
            pendingRequests: {},
        };
    }

    async listAccounts(): Promise<KeyringAccount[]> {
        console.log('Listing accounts');

        return Object.values(this.state.wallets).map(
            (wallet) => wallet.account,
        );
    }

    async getAccount(id: string): Promise<KeyringAccount | undefined> {
        console.log('Getting account with ID:', id);

        const wallet =
            this.state.wallets[id] ??
            throwError(`Account with ID ${id} not found`);
        return wallet.account;
    }

    async createAccount(
        options: Record<string, Json> = {},
    ): Promise<KeyringAccount> {
        console.log('Creating account with options:', options);

        const requestId = await this.client.submitRequest('importAccount', {
            status: 'pending',
        });

        let response: ImportAccountRequest;
        try {
            response = await this.client.pollUntil(
                requestId,
                'importAccount',
                500, // ms
                60, // s
                (r: ImportAccountRequest) => r.status !== 'pending',
            );
            await this.client.deleteRequest(requestId);
        } catch (error) {
            console.error('Error importing account:', error);
            throw new Error('Failed to importing account. Please try again.');
        }

        if (!response.address) {
            console.log('Account importing failed, no address returned');
            throw new Error('Account importing failed, no address returned');
        }

        const id = uuid();
        const { address } = response;
        const account: KeyringAccount = {
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
        await emitSnapKeyringEvent(snap, KeyringEvent.AccountCreated, {
            account,
            accountNameSuggestion: 'Tlock Account',
        });

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

        const wallet =
            this.state.wallets[account.id] ??
            throwError(`Account with ID ${account.id} not found`);
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

        const request =
            this.state.pendingRequests[id] ??
            throwError(`Request with ID ${id} not found`);
        return request;
    }

    async submitRequest(request: KeyringRequest): Promise<KeyringResponse> {
        console.log('Submitting request:', request);

        const { method, params = [] } = request.request;
        const signature = await this.handleSigningRequest(method, params);
        return {
            pending: false,
            result: signature,
        };
    }

    async approveRequest?(
        id: string,
        _response: KeyringResponse,
    ): Promise<void> {
        const { request } =
            this.state.pendingRequests[id] ??
            throwError(`Request with ID ${id} not found`);
        const result = await this.handleSigningRequest(
            request.method,
            request.params ?? [],
        );

        await this.removePendingRequest(id);
        await emitSnapKeyringEvent(snap, KeyringEvent.RequestApproved, {
            id,
            result,
        });
    }

    async rejectRequest?(id: string): Promise<void> {
        console.log('Rejecting request with ID:', id);
        if (this.state.pendingRequests[id] === undefined) {
            throwError(`Request with ID ${id} not found`);
        }

        await this.removePendingRequest(id);
        await emitSnapKeyringEvent(snap, KeyringEvent.RequestRejected, { id });
    }

    private async removePendingRequest(id: string) {
        delete this.state.pendingRequests[id];
        await this.saveState();
    }

    private async handleSigningRequest(
        method: string,
        params: Json,
    ): Promise<Json> {
        switch (method as EthMethod) {
            case EthMethod.PersonalSign: {
                const [message, from] = params as [Hex, Address];
                return await this.signPersonalMessage(message, from);
            }

            case EthMethod.SignTransaction: {
                const [tx] = (params as [unknown]) as [Transaction];
                return await this.signTransaction(tx);
            }

            case EthMethod.SignTypedDataV1: {
                const [from, data] = params as [Address, Json];
                return await this.signTypedData(
                    from,
                    data,
                    SignTypedDataVersion.V1,
                );
            }

            case EthMethod.SignTypedDataV3: {
                const [from, data] = params as [Address, Json];
                return await this.signTypedData(
                    from,
                    data,
                    SignTypedDataVersion.V3,
                );
            }

            case EthMethod.SignTypedDataV4: {
                const [from, data] = params as [Address, Json];
                return await this.signTypedData(
                    from,
                    data,
                    SignTypedDataVersion.V4,
                );
            }

            case EthMethod.Sign: {
                const [from, data] = params as [Address, Hex];
                return await this.signMessage(from, data);
            }

            default: {
                throw new Error(`EVM method '${method}' not supported`);
            }
        }
    }

    private async signPersonalMessage(
        message: Hex,
        from: Address,
    ): Promise<string> {
        console.log('Signing personal message:', message, 'from:', from);

        const requestId = await this.client.submitRequest('signPersonal', {
            status: 'pending',
            message,
            from,
        });

        let response: SignPersonalRequest;
        try {
            response = await this.client.pollUntil(
                requestId,
                'signPersonal',
                500, // ms
                60, // s
                (r: SignPersonalRequest) => r.status !== 'pending',
            );
            await this.client.deleteRequest(requestId);
        } catch (error) {
            console.error('Error signing personal message:', error);
            throw new Error(
                'Failed to sign personal message. Please try again.',
            );
        }

        if (!response.signature) {
            console.log(
                'Personal message signing failed, no signature returned',
            );
            throw new Error(
                'Personal message signing failed, no signature returned',
            );
        }

        const recoveredAddress = recoverPersonalSignature({
            data: response.message,
            signature: response.signature,
        });
        if (recoveredAddress !== from) {
            console.error(
                `Recovered address ${recoveredAddress} does not match from address ${from}`,
            );
            throw new Error(
                'Recovered address does not match the from address',
            );
        } else {
            console.log(
                `Recovered address matches from address: ${recoveredAddress}`,
            );
        }

        console.log(
            `Signed personal message for request ${requestId} from=${from} message=${message} signature=${response.signature}`,
        );
        return response.signature;
    }

    // https://docs.metamask.io/services/concepts/transaction-types/
    //? Metamask and viem's types should be compatible thanks to standardization,
    //? but this will be tested via unit and integration tests anyways because
    //? *I don't trust metamask*
    private async signTransaction(tx: Transaction): Promise<Json> {
        //? Might also be a string because of metamask
        let chainId = tx.chainId as unknown;
        if (chainId && typeof chainId === 'string' && chainId.startsWith('0x')) {
            chainId = parseInt(chainId, 16);
            tx.chainId = chainId as number;
        }

        const requestId = await this.client.submitRequest('signTransaction', {
            status: 'pending',
            from: tx.from,
            transaction: tx,
        });

        let response: SignTransactionRequest;
        try {
            response = await this.client.pollUntil(
                requestId,
                'signTransaction',
                500, // ms
                60, // s
                (r: SignTransactionRequest) => r.status !== 'pending',
            );
            await this.client.deleteRequest(requestId);
        } catch (error) {
            console.error('Error signing transaction:', error);
            throw new Error('Failed to sign transaction. Please try again.');
        }

        if (!response.signature) {
            console.log('Transaction signing failed, no signature returned');
            throw new Error(
                'Transaction signing failed, no signature returned',
            );
        }

        return response.signature;
    }

    private async signTypedData(
        from: Address,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any,
        version: SignTypedDataVersion,
    ): Promise<string> {
        console.log(
            'Signing typed data:',
            data,
            'from:',
            from,
            'version:',
            version,
        );

        if (version !== SignTypedDataVersion.V4) {
            throw new Error(`Unsupported SignTypedDataVersion: ${version}`);
        }

        if (!data) {
            throw new Error(
                'Data for signing typed data cannot be null or undefined',
            );
        }

        const castData: SignTypedDataParameters = data as SignTypedDataParameters;
        const requestId = await this.client.submitRequest('signTypedData', {
            status: 'pending',
            from,
            data: castData,
        });

        let response: SignTypedDataRequest;
        try {
            response = await this.client.pollUntil(
                requestId,
                'signTypedData',
                500, // ms
                60, // s
                (r: SignTypedDataRequest) => r.status !== 'pending',
            );
            await this.client.deleteRequest(requestId);
        } catch (error) {
            console.error('Error signing typed data:', error);
            throw new Error('Failed to sign typed data. Please try again.');
        }

        if (!response.signature) {
            console.log('Typed data signing failed, no signature returned');
            throw new Error('Typed data signing failed, no signature returned');
        }

        return response.signature;
    }

    private async signMessage(from: Address, data: Hex): Promise<string> {
        console.log('Signing message:', data, 'from:', from);

        const requestId = await this.client.submitRequest('signMessage', {
            status: 'pending',
            from,
            message: data,
        });

        let response: SignMessageRequest;
        try {
            response = await this.client.pollUntil(
                requestId,
                'signMessage',
                500, // ms
                60, // s
                (r: SignMessageRequest) => r.status !== 'pending',
            );
            await this.client.deleteRequest(requestId);
        } catch (error) {
            console.error('Error signing message:', error);
            throw new Error('Failed to sign message. Please try again.');
        }

        if (!response.signature) {
            console.log('Message signing failed, no signature returned');
            throw new Error('Message signing failed, no signature returned');
        }

        return response.signature;
    }

    private async saveState(): Promise<void> {
        await updateState({
            keyringState: this.state,
        });
    }
}

function throwError(message: string): never {
    throw new Error(message);
}
