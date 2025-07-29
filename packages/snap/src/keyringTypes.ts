// https://github.com/MetaMask/accounts/blob/main/packages/keyring-api/docs/evm-methods.md

import { Json } from "@metamask/snaps-sdk";
import { JSONTx } from "@ethereumjs/tx";
import { TypedData, Address, Hash, Hex, parseTransaction, TypedDataDefinition, toHex, TransactionSerializable, TransactionSerializableEIP1559, TransactionSerializableEIP2930, TransactionSerializableLegacy, TransactionSerialized } from "viem";

interface AccessListItem {
    address: Address;
    storageKeys: Hash[];
}

export interface TransactionRequest {
    type?: Hex;
    nonce: Hex;
    to: Address | null;
    from: Address;
    value: Hex;
    data: Hex;
    gasLimit: Hex;
    gasPrice?: Hex;
    maxPriorityFeePerGas?: Hex;
    maxFeePerGas?: Hex;
    accessList?: AccessListItem[];
    chainId: Hex;
}

interface TypedDataDomain {
    name?: string;
    version?: string;
    chainId?: number;
    verifyingContract?: Address;
    salt?: Hash;
}

interface TypedDataType {
    name: string;
    type: string;
}

export interface TypedDataRequest {
    domain: TypedDataDomain;
    types: {
        EIP712Domain: TypedDataType[];
        [key: string]: TypedDataType[];
    };
    primaryType: string;
    message: Record<string, unknown>;
}

// https://github.com/MetaMask/accounts/blob/main/packages/keyring-api/docs/evm-methods.md#returns-2
export interface TransactionSignature {
    v: Hex;
    r: Hash;
    s: Hash;
}

export type KeyringRequestParams =
    | {
        method: 'personal_sign';
        params: [message: Hex, address: Address];
    }
    | {
        method: 'eth_sign';
        params: [address: Address, hash: Hash];
    }
    | {
        method: 'eth_signTransaction';
        params: [transaction: TransactionRequest];
    }
    | {
        method: 'eth_signTypedData_v4';
        params: [address: Address, typedData: TypedDataRequest];
    };

/**
 * Represents the response from a keyring operation.
 * `0x${string}` is used for eth_sign, personal_sign, and eth_signTypedData_v4,
 * `TransactionSignature` is used for eth_signTransaction.
 */
export type KeyringResponse = | `0x${string}` | TransactionSignature;

/**
 * Maps hex transaction type to viem's transaction type format
 */
export function mapTransactionType(hexType?: Hex): "legacy" | "eip2930" | "eip1559" | undefined {
    if (!hexType) return undefined;

    const typeMap: Record<string, "legacy" | "eip2930" | "eip1559"> = {
        '0x0': 'legacy',
        '0x00': 'legacy',
        '0x1': 'eip2930',
        '0x01': 'eip2930',
        '0x2': 'eip1559',
        '0x02': 'eip1559',
    };

    return typeMap[hexType.toLowerCase()];
}

export function mapViemTransactionType(type: "legacy" | "eip2930" | "eip1559" | "eip4844" | "eip7702" | undefined): number {
    if (!type) return 0;

    const typeMap: Record<string, number> = {
        legacy: 0,
        eip2930: 1,
        eip1559: 2,
    };

    const hexType = type.toLowerCase();
    return typeMap[hexType] || 0;
}

/**
 * Converts a custom TransactionRequest to viem's TransactionSerializable format
 */
export function transactionRequestToViem(tx: TransactionRequest): TransactionSerializable {
    const mappedType = mapTransactionType(tx.type);
    const chainId = parseInt(tx.chainId, 16);
    const baseFields = {
        nonce: tx.nonce ? parseInt(tx.nonce, 16) : undefined,
        to: tx.to,
        value: BigInt(tx.value),
        data: tx.data,
        gas: BigInt(tx.gasLimit),
    };

    switch (mappedType) {
        case 'eip2930':
            {
                const txSerializableEIP2930: TransactionSerializableEIP2930 = {
                    ...baseFields,
                    type: 'eip2930',
                    gasPrice: tx.gasPrice ? BigInt(tx.gasPrice) : undefined,
                    accessList: tx.accessList?.map(item => ({
                        address: item.address,
                        storageKeys: item.storageKeys
                    })),
                    chainId,
                };
                return txSerializableEIP2930;
            }

        case 'eip1559':
            {
                const txSerializableEIP1559: TransactionSerializableEIP1559 = {
                    ...baseFields,
                    type: 'eip1559',
                    maxPriorityFeePerGas: tx.maxPriorityFeePerGas ? BigInt(tx.maxPriorityFeePerGas) : undefined,
                    maxFeePerGas: tx.maxFeePerGas ? BigInt(tx.maxFeePerGas) : undefined,
                    accessList: tx.accessList?.map(item => ({
                        address: item.address,
                        storageKeys: item.storageKeys
                    })),
                    chainId,
                };
                return txSerializableEIP1559;
            }
        case 'legacy':
        default:
            {
                const txSerializableLegacy: TransactionSerializableLegacy = {
                    ...baseFields,
                    type: 'legacy',
                    gasPrice: tx.gasPrice ? BigInt(tx.gasPrice) : undefined,
                    chainId,
                };
                return txSerializableLegacy;
            }
    }
}

export function typedDataToViem(typedData: TypedDataRequest): TypedDataDefinition {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { EIP712Domain, ...customTypes } = typedData.types;

    // Convert TypedDataType[] to the format expected by viem
    const viemTypes: TypedData = {};
    Object.entries(customTypes).forEach(([key, typeArray]) => {
        viemTypes[key] = typeArray.map(type => ({
            name: type.name,
            type: type.type,
        }));
    });

    return {
        domain: typedData.domain,
        types: viemTypes,
        primaryType: typedData.primaryType,
        message: typedData.message,
    };
}

export function viemTxToJson(tx: TransactionSerialized, type: number): Json {
    const parsed = parseTransaction(tx);

    console.log('Parsed transaction:', parsed);

    const jsonTx: JSONTx = {
        chainId: toHex(parsed.chainId || 0),
        nonce: toHex(parsed.nonce || 0),
        maxPriorityFeePerGas: toHex(parsed.maxPriorityFeePerGas || 0),
        maxFeePerGas: toHex(parsed.maxFeePerGas || 0),
        gasLimit: toHex(parsed.gas || 0),
        value: toHex(parsed.value || 0),
        data: parsed.data || '0x',
        v: toHex(parsed.yParity || 0),
        r: parsed.r || '0x0',
        s: parsed.s || '0x0',
    }
    if (parsed.to) {
        jsonTx.to = parsed.to;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serializableSignedTx: Record<string, any> = {
        ...jsonTx,
        type
    }

    Object.entries(serializableSignedTx).forEach(([key, _]) => {
        if (serializableSignedTx[key] === undefined) {
            delete serializableSignedTx[key];
        }
    });

    return serializableSignedTx;
}