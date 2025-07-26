import { emitSnapKeyringEvent, Keyring, KeyringAccount, KeyringEvent, KeyringRequest, KeyringResponse } from "@metamask/keyring-api";
import { Json } from "@metamask/snaps-sdk";
import { Client, ImportAccountRequest, SignMessageRequest, SignPersonalRequest, SignTransactionRequest, SignTypedDataRequest } from "@tlock/shared";
import { v4 as uuid } from 'uuid';
import { EthAccountType, EthMethod, } from '@metamask/keyring-api';
import { recoverPersonalSignature, SignTypedDataVersion } from '@metamask/eth-sig-util';
import { Address, Hex, serializeTransaction } from 'viem';
import { KeyringState, updateState } from "./state";

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

        return Object.values(this.state.wallets).map(wallet => wallet.account);
    }

    async getAccount(id: string): Promise<KeyringAccount | undefined> {
        console.log('Getting account with ID:', id);

        const wallet = this.state.wallets[id] ?? throwError(`Account with ID ${id} not found`);
        return wallet.account;
    }

    async createAccount(options: Record<string, Json> = {}): Promise<KeyringAccount> {
        console.log('Creating account with options:', options);

        const requestId = await this.client.submitRequest('importAccount', { status: 'pending' });

        let response: ImportAccountRequest;
        try {
            response = await this.client.pollUntil(
                requestId,
                'importAccount',
                500, // ms
                60,  // s
                (r: ImportAccountRequest) => r.status !== 'pending'
            );
            await this.client.deleteRequest(requestId);
        } catch (error) {
            console.error("Error importing account:", error);
            throw new Error("Failed to importing account. Please try again.");
        }

        if (!response.address) {
            console.log('Account importing failed, no address returned');
            throw new Error("Account importing failed, no address returned");
        }

        const id = uuid();
        const address = response.address;
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
        return chains.filter(chain => chain.startsWith('eip155:'))
    }

    async updateAccount(account: KeyringAccount): Promise<void> {
        console.log('Updating account:', account);

        const wallet = this.state.wallets[account.id] ?? throwError(`Account with ID ${account.id} not found`);
        const newAccount: KeyringAccount = {
            ...wallet.account,
            ...account,
            // Restore read-only properties.
            address: wallet.account.address,
        }

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

        const request = this.state.pendingRequests[id] ?? throwError(`Request with ID ${id} not found`);
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

    async approveRequest?(id: string, response: KeyringResponse): Promise<void> {
        const { request } = this.state.pendingRequests[id] ?? throwError(`Request with ID ${id} not found`);
        const result = await this.handleSigningRequest(request.method, request.params ?? []);

        await this.removePendingRequest(id);
        await emitSnapKeyringEvent(snap, KeyringEvent.RequestApproved, { id, result });
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

    private async handleSigningRequest(method: string, params: Json): Promise<Json> {
        switch (method) {
            case EthMethod.PersonalSign: {
                const [message, from] = params as [Hex, Address];
                return await this.signPersonalMessage(message, from);
            }

            case EthMethod.SignTransaction: {
                const [tx] = params as [any];
                return await this.signTransaction(tx);
            }

            case EthMethod.SignTypedDataV1: {
                const [from, data] = params as [Address, Json];
                return await this.signTypedData(from, data, SignTypedDataVersion.V1);
            }

            case EthMethod.SignTypedDataV3: {
                const [from, data] = params as [Address, Json];
                return await this.signTypedData(from, data, SignTypedDataVersion.V3);
            }

            case EthMethod.SignTypedDataV4: {
                const [from, data] = params as [Address, Json];
                return await this.signTypedData(from, data, SignTypedDataVersion.V4);
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

    private async signPersonalMessage(message: Hex, from: Address): Promise<string> {
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
                60,  // s
                (r: SignPersonalRequest) => r.status !== 'pending'
            );
            await this.client.deleteRequest(requestId);
        } catch (error) {
            console.error("Error signing personal message:", error);
            throw new Error("Failed to sign personal message. Please try again.");
        }

        if (!response.signature) {
            console.log('Personal message signing failed, no signature returned');
            throw new Error("Personal message signing failed, no signature returned");
        }

        const recoveredAddress = recoverPersonalSignature({
            data: response.message,
            signature: response.signature
        });
        if (recoveredAddress !== from) {
            console.error(`Recovered address ${recoveredAddress} does not match from address ${from}`);
            throw new Error("Recovered address does not match the from address");
        } else {
            console.log(`Recovered address matches from address: ${recoveredAddress}`);
        }

        console.log(`Signed personal message for request ${requestId} from=${from} message=${message} signature=${response.signature}`);
        return response.signature;
    }

    private async signTransaction(tx: any): Promise<Json> {
        if (tx.chainId.startsWith('0x')) {
            tx.chainId = parseInt(tx.chainId, 16);
        }
        const serializedTx = serializeTransaction({
            ...tx
        });

        const requestId = await this.client.submitRequest('signTransaction', {
            status: 'pending',
            from: tx.from,
            transaction: serializedTx,
        });

        let response: SignTransactionRequest;
        try {
            response = await this.client.pollUntil(
                requestId,
                'signTransaction',
                500, // ms
                60,  // s
                (r: SignTransactionRequest) => r.status !== 'pending'
            );
            await this.client.deleteRequest(requestId);
        } catch (error) {
            console.error("Error signing transaction:", error);
            throw new Error("Failed to sign transaction. Please try again.");
        }

        if (!response.signature) {
            console.log('Transaction signing failed, no signature returned');
            throw new Error("Transaction signing failed, no signature returned");
        }

        return response.signature;
    }

    private async signTypedData(from: Address, data: Json, version: SignTypedDataVersion): Promise<string> {
        console.log('Signing typed data:', data, 'from:', from, 'version:', version);

        const requestId = await this.client.submitRequest('signTypedData', {
            status: 'pending',
            from,
            data: JSON.stringify(data),
            version,
        });

        let response: SignTypedDataRequest;
        try {
            response = await this.client.pollUntil(
                requestId,
                'signTypedData',
                500, // ms
                60,  // s
                (r: SignTypedDataRequest) => r.status !== 'pending'
            );
            await this.client.deleteRequest(requestId);
        } catch (error) {
            console.error("Error signing typed data:", error);
            throw new Error("Failed to sign typed data. Please try again.");
        }

        if (!response.signature) {
            console.log('Typed data signing failed, no signature returned');
            throw new Error("Typed data signing failed, no signature returned");
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
                60,  // s
                (r: SignMessageRequest) => r.status !== 'pending'
            );
            await this.client.deleteRequest(requestId);
        } catch (error) {
            console.error("Error signing message:", error);
            throw new Error("Failed to sign message. Please try again.");
        }

        if (!response.signature) {
            console.log('Message signing failed, no signature returned');
            throw new Error("Message signing failed, no signature returned");
        }

        return response.signature;
    }

    private async saveState(): Promise<void> {
        updateState({
            keyringState: this.state,
        });
    }
}

function throwError(message: string): never {
    throw new Error(message);
}