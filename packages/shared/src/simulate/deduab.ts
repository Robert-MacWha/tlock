// Dedaub Transaction Simulation API Client

import type { Address, Hex, Hash } from 'viem';

type BlockNumber = number | 'latest';

export interface SimulationRequest {
    data: Hex;
    to_a?: Address | undefined;
    from_a: Address;
    value: Hex;
    gas: Hex;
    block_number: BlockNumber;
}

export interface AbiInput {
    name: string;
    type: string;
    indexed?: boolean;
    internalType?: string;
}

export interface AbiOutput {
    name: string;
    type: string;
    internalType?: string;
}

export interface TraceNode {
    opcode: string;
    from_a: Address;
    to_a: Address;
    vm_step: number;
    caller_pc: number;
    gas_used: number;
    selector: Hex;
    callvalue: number;
    calldata: Hex;
    signature: string | null;
    calldata_decoded: Record<string, unknown> | null;
    children: Array<TraceNode | LogNode | ReturnNode | SelfDestructNode>;
    abi: AbiInfo | null;
}

export interface LogNode {
    opcode: 'LOG0' | 'LOG1' | 'LOG2' | 'LOG3' | 'LOG4';
    topics: Hex[];
    memory: Hex;
    address: Address;
    signature: string;
    eventdata_decoded: Record<string, unknown>;
    abi: EventAbi | null;
    caller_pc: number;
}

export interface ReturnNode {
    opcode: 'RETURN' | 'REVERT';
    error: string;
    selector: Hex;
    signature: string;
    returndata: Hex;
    returndata_decoded: Record<string, unknown> | null;
    abi: AbiInfo | null;
    caller_pc: number;
    from_a: Address;
}

export interface SelfDestructNode {
    opcode: 'SELFDESTRUCT';
    beneficiary: Address;
    value: number;
    caller_pc: number;
}

export interface AbiInfo {
    selector: Hex;
    signature: string;
    name: string;
    inputs: AbiInput[];
    address: Address;
    outputs?: AbiOutput[];
    type: 'function';
    stateMutability: 'payable' | 'nonpayable' | 'view' | 'pure';
}

export interface EventAbi {
    selector: Hex;
    signature: string;
    name: string;
    inputs: AbiInput[];
    address: Address;
    indexes: boolean[][];
    anonymous: boolean;
    type: 'event';
}

export interface TokenTransfer {
    address: Address;
    from_a: Address;
    to_a: Address;
    amount: Hex;
    type: 'NATIVE' | 'ERC20' | 'ERC721' | 'ERC1155';
}

export interface BalanceDelta {
    token: Address;
    address: Address;
    balance: Hex;
    tokenId: string | null;
}

export interface TokenInfo {
    token_address: Address;
    chain_id: number;
    token_name: string;
    symbol: string;
    decimals: number;
    presentation_symbol: string | null;
    last_price: number;
    last_cap: number;
    last_total_supply: number;
    logo_small: string;
    ts: number;
}

export interface AddressInfo {
    name: string;
    logo_small: string;
}

export interface TxData {
    block_number: number;
    tx_index: number;
    tx_hash: Hash;
    gas_price: number;
    gas: number;
    gas_refund: number;
    gas_used: number;
    contract_address: Address;
    block_timestamp: number;
    to_a: Address;
    from_a: Address;
    blockHash: Hash;
    nonce: number;
    value: number;
    baseFeePerGas: number;
    priorityFeePerGas: number;
    nativeTokenPrice: number;
}

export interface SimulationResponse {
    trace_node: TraceNode;
    address_map: Record<string, AddressInfo>;
    token_transfers: TokenTransfer[];
    balance_deltas: BalanceDelta[];
    tokens: Record<string, TokenInfo>;
    addresses: Address[];
    tx_data: TxData | null;
}

export const NETWORKS = [
    'ethereum',
    'polygon',
    'bsc',
    'arbitrum',
    'optimism',
    'avalanche',
    'fantom',
] as const;
export type Network = (typeof NETWORKS)[number];

export function isNetwork(value: string): value is Network {
    return Object.values(NETWORKS).includes(value.toLowerCase() as Network);
}

export class DedaubClient {
    private readonly baseUrl = 'https://api.dedaub.com/api';

    async simulate(
        network: Network,
        request: SimulationRequest,
    ): Promise<SimulationResponse> {
        const url = `${this.baseUrl}/transaction/${network}/simulate`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
            );
        }

        return response.json() as Promise<SimulationResponse>;
    }
}

// Utility functions
export class SimulationUtils {
    static getGasUsed(response: SimulationResponse): number {
        return response.trace_node.gas_used;
    }

    static wouldRevert(response: SimulationResponse): boolean {
        const findRevert = (
            node: TraceNode | LogNode | ReturnNode | SelfDestructNode,
        ): boolean => {
            if ('opcode' in node && node.opcode === 'REVERT') return true;
            if ('error' in node && node.error && node.error !== '') return true;
            if ('children' in node && node.children) {
                return node.children.some((child) => findRevert(child));
            }
            return false;
        };

        return findRevert(response.trace_node);
    }

    static getBalanceChanges(
        response: SimulationResponse,
        address: Address,
    ): BalanceDelta[] {
        return response.balance_deltas.filter(
            (delta) => delta.address.toLowerCase() === address.toLowerCase(),
        );
    }

    static getNativeTransfers(response: SimulationResponse): TokenTransfer[] {
        return response.token_transfers.filter(
            (transfer) => transfer.type === 'NATIVE',
        );
    }

    static getERC20Transfers(response: SimulationResponse): TokenTransfer[] {
        return response.token_transfers.filter(
            (transfer) => transfer.type === 'ERC20',
        );
    }

    static addressInTrace(
        response: SimulationResponse,
        address: Address,
    ): boolean {
        return response.addresses.some(
            (addr) => addr.toLowerCase() === address.toLowerCase(),
        );
    }
}
