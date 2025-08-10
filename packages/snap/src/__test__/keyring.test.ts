import { TlockKeyring } from '../keyring';
import { EthAccountType, EthMethod, KeyringEvent, KeyringRequest } from '@metamask/keyring-api';
import { updateState } from '../state';
import type { Client } from '@tlock/shared';
import { v4 as uuid } from 'uuid';
import { emitSnapKeyringEvent } from '@metamask/keyring-api';
import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import { Address, Hex, TransactionSerializedLegacy } from 'viem';

// Mock dependencies
jest.mock('../state');
jest.mock('uuid');
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('@metamask/keyring-api', () => ({
    ...jest.requireActual('@metamask/keyring-api'),
    emitSnapKeyringEvent: jest.fn(),
}));
jest.mock('@metamask/eth-sig-util');

const mockUpdateState = updateState as jest.MockedFunction<typeof updateState>;
const mockUuid = uuid as jest.MockedFunction<() => string>;
const mockEmitSnapKeyringEvent = emitSnapKeyringEvent as jest.MockedFunction<typeof emitSnapKeyringEvent>;
const mockRecoverPersonalSignature = recoverPersonalSignature as jest.MockedFunction<typeof recoverPersonalSignature>;

// Mock the snap global variable
declare const snap: unknown;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
(global as any).snap = {};

describe('TlockKeyring', () => {
    let keyring: TlockKeyring;
    let mockClient: jest.Mocked<Client>;

    const mockAddress = '0x8f72fcf695523A6FC7DD97EafDd7A083c386b7b6' as Address;
    const mockAccountId = '12345678';
    const mockRequestId = 'test-request-id';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });

        mockUuid.mockImplementation(() => mockAccountId);
        mockUpdateState.mockResolvedValue();
        mockEmitSnapKeyringEvent.mockResolvedValue();

        // Create mock client with all required properties
        mockClient = {
            roomId: 'test-room',
            submitDevice: jest.fn(),
            getDevice: jest.fn(),
            pollUntilDeviceRegistered: jest.fn(),
            submitRequest: jest.fn(),
            updateRequest: jest.fn(),
            getRequest: jest.fn(),
            getRequests: jest.fn(),
            deleteRequest: jest.fn(),
            pollUntil: jest.fn(),
        } as jest.Mocked<Client>;

        // Create keyring instance
        keyring = new TlockKeyring(mockClient);
    });

    // Helper function to setup keyring state
    const setupKeyringState = (options: {
        wallets?: Record<string, { account: ReturnType<typeof createMockAccount> }>;
        pendingRequests?: Record<string, KeyringRequest>;
    }) => {
        keyring['state'] = {
            wallets: options.wallets ?? {},
            pendingRequests: options.pendingRequests ?? {},
        };
    };

    // Helper function to create mock account
    const createMockAccount = (id = mockAccountId, address = mockAddress) => ({
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
    });

    // Helper function to test common error scenarios across methods
    const testAccountNotFound = (methodName: string, methodCall: () => Promise<unknown>) => {
        it(`${methodName} should throw when account does not exist`, async () => {
            await expect(methodCall()).rejects.toThrow('Account with ID non-existent not found');
        });
    };

    const testRequestNotFound = (methodName: string, methodCall: () => Promise<unknown>) => {
        it(`${methodName} should throw when request does not exist`, async () => {
            await expect(methodCall()).rejects.toThrow('Request with ID non-existent not found');
        });
    };

    const testClientPollingFailure = (methodName: string, setupMocks: () => void, methodCall: () => Promise<unknown>) => {
        it(`${methodName} should handle client polling failure`, async () => {
            setupMocks();
            mockClient.pollUntil.mockRejectedValue(new Error('Network timeout'));
            await expect(methodCall()).rejects.toThrow('Network timeout');
        });
    };

    describe('Constructor', () => {
        it('should initialize with empty state', () => {
            expect(keyring['state']).toEqual({
                wallets: {},
                pendingRequests: {},
            });
        });

        it('should use provided state', () => {
            const state = { wallets: {}, pendingRequests: {} };
            const newKeyring = new TlockKeyring(mockClient, state);
            expect(newKeyring['state']).toBe(state);
        });

        it('should store origin', () => {
            const origin = 'https://example.com';
            const newKeyring = new TlockKeyring(mockClient, undefined, origin);
            expect(newKeyring['origin']).toBe(origin);
        });
    });

    describe('Account management', () => {
        describe('listAccounts', () => {
            it('should return empty array when no accounts', async () => {
                const accounts = await keyring.listAccounts();
                expect(accounts).toEqual([]);
            });

            it('should return accounts from state', async () => {
                const account = createMockAccount();
                setupKeyringState({ wallets: { [mockAccountId]: { account } } });

                const accounts = await keyring.listAccounts();
                expect(accounts).toEqual([account]);
            });
        });

        describe('getAccount', () => {
            it('should return existing account', async () => {
                const account = createMockAccount();
                setupKeyringState({ wallets: { [mockAccountId]: { account } } });

                const result = await keyring.getAccount(mockAccountId);
                expect(result).toBe(account);
            });

            testAccountNotFound('getAccount', () => keyring.getAccount('non-existent'));
        });

        describe('createAccount', () => {
            it('should create and store account', async () => {
                mockClient.submitRequest.mockResolvedValue(mockRequestId);
                mockClient.pollUntil.mockResolvedValue({
                    status: 'approved',
                    address: mockAddress,
                });

                const account = await keyring.createAccount();

                expect(account.id).toBe(mockAccountId);
                expect(account.address).toBe(mockAddress);
                expect(keyring['state'].wallets[mockAccountId]?.account).toBe(account);
            });

            it('should emit account creation event', async () => {
                mockClient.submitRequest.mockResolvedValue(mockRequestId);
                mockClient.pollUntil.mockResolvedValue({
                    status: 'approved',
                    address: mockAddress,
                });

                await keyring.createAccount();

                expect(mockEmitSnapKeyringEvent).toHaveBeenCalledWith(
                    snap,
                    KeyringEvent.AccountCreated,
                    {
                        account: {
                            id: mockAccountId,
                            address: mockAddress,
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
                        },
                        accountNameSuggestion: 'Tlock Account',
                    }
                );
            });

            it('should throw when no address returned', async () => {
                mockClient.submitRequest.mockResolvedValue(mockRequestId);
                mockClient.pollUntil.mockResolvedValue({ status: 'approved' });

                await expect(keyring.createAccount()).rejects.toThrow('No address returned from mobile device');
            });

            testClientPollingFailure(
                'createAccount',
                () => mockClient.submitRequest.mockResolvedValue(mockRequestId),
                () => keyring.createAccount()
            );
        });

        describe('updateAccount', () => {
            it('should update account in state', async () => {
                const account = createMockAccount();
                setupKeyringState({ wallets: { [mockAccountId]: { account } } });

                const updatedAccount = { ...account, options: { name: 'New Name' } };
                await keyring.updateAccount(updatedAccount);

                expect(keyring['state'].wallets[mockAccountId]?.account).toEqual(updatedAccount);
            });

            it('should preserve original address', async () => {
                const account = createMockAccount();
                setupKeyringState({ wallets: { [mockAccountId]: { account } } });

                const updatedAccount = { ...account, address: '0xdifferent' as Address };
                await keyring.updateAccount(updatedAccount);

                expect(keyring['state'].wallets[mockAccountId]?.account.address).toBe(mockAddress);
            });

            testAccountNotFound('updateAccount', () => keyring.updateAccount(createMockAccount('non-existent')));
        });

        describe('deleteAccount', () => {
            it('should remove account from state', async () => {
                const account = createMockAccount();
                setupKeyringState({ wallets: { [mockAccountId]: { account } } });

                await keyring.deleteAccount(mockAccountId);

                expect(keyring['state'].wallets[mockAccountId]).toBeUndefined();
            });

            it('should emit deletion event', async () => {
                const account = createMockAccount();
                setupKeyringState({ wallets: { [mockAccountId]: { account } } });

                await keyring.deleteAccount(mockAccountId);

                expect(mockEmitSnapKeyringEvent).toHaveBeenCalledWith(
                    snap,
                    KeyringEvent.AccountDeleted,
                    { id: mockAccountId }
                );
            });
        });
    });

    describe('Chain filtering', () => {
        it('should return only EVM chains', async () => {
            const chains = ['eip155:1', 'eip155:137', 'cosmos:hub-4', 'solana:mainnet'];
            const filtered = await keyring.filterAccountChains(mockAccountId, chains);
            expect(filtered).toEqual(['eip155:1', 'eip155:137']);
        });

        it('should return empty for non-EVM chains', async () => {
            const chains = ['cosmos:hub-4', 'solana:mainnet'];
            const filtered = await keyring.filterAccountChains(mockAccountId, chains);
            expect(filtered).toEqual([]);
        });
    });

    describe('Request management', () => {
        describe('listRequests', () => {
            it('should return empty when no requests', async () => {
                const requests = await keyring.listRequests!();
                expect(requests).toEqual([]);
            });

            it('should return pending requests', async () => {
                const request: KeyringRequest = {
                    id: mockRequestId,
                    account: mockAccountId,
                    scope: 'eip155:1',
                    request: {
                        method: EthMethod.PersonalSign,
                        params: ['0x123456' as Hex, mockAddress],
                    },
                };
                setupKeyringState({ pendingRequests: { [mockRequestId]: request } });

                const requests = await keyring.listRequests!();
                expect(requests).toEqual([request]);
            });
        });

        describe('getRequest', () => {
            it('should return existing request', async () => {
                const request: KeyringRequest = {
                    id: mockRequestId,
                    account: mockAccountId,
                    scope: 'eip155:1',
                    request: {
                        method: EthMethod.PersonalSign,
                        params: ['0x123456' as Hex, mockAddress],
                    },
                };
                setupKeyringState({ pendingRequests: { [mockRequestId]: request } });

                const result = await keyring.getRequest!(mockRequestId);
                expect(result).toBe(request);
            });

            testRequestNotFound('getRequest', () => keyring.getRequest!('non-existent'));
        });

        describe('rejectRequest', () => {
            it('should remove request and emit event', async () => {
                const request: KeyringRequest = {
                    id: mockRequestId,
                    account: mockAccountId,
                    scope: 'eip155:1',
                    request: {
                        method: EthMethod.PersonalSign,
                        params: ['0x123456' as Hex, mockAddress],
                    },
                };
                setupKeyringState({ pendingRequests: { [mockRequestId]: request } });

                await keyring.rejectRequest(mockRequestId);

                expect(keyring['state'].pendingRequests[mockRequestId]).toBeUndefined();
                expect(mockEmitSnapKeyringEvent).toHaveBeenCalledWith(
                    snap,
                    KeyringEvent.RequestRejected,
                    { id: mockRequestId }
                );
            });

            testRequestNotFound('rejectRequest', () => keyring.rejectRequest('non-existent'));
        });
    });

    describe('Signing', () => {
        describe('submitRequest - personal sign', () => {
            it('should sign and return signature', async () => {
                const signature = '0xabcdef' as Hex;
                const message = '0x123456' as Hex;
                mockClient.submitRequest.mockResolvedValue(mockRequestId);
                mockClient.pollUntil.mockResolvedValue({
                    status: 'approved',
                    signature,
                    message,
                });
                mockRecoverPersonalSignature.mockReturnValue(mockAddress);

                const mockRequest: KeyringRequest = {
                    id: mockRequestId,
                    account: mockAccountId,
                    scope: 'eip155:1',
                    request: {
                        method: EthMethod.PersonalSign,
                        params: [message, mockAddress],
                    },
                };

                const response = await keyring.submitRequest(mockRequest);

                expect(response).toEqual({ pending: false, result: signature });
                expect(mockRecoverPersonalSignature).toHaveBeenCalledWith({
                    data: message,
                    signature,
                });
            });

            it('should validate signature recovery', async () => {
                const signature = '0xabcdef' as Hex;
                const message = '0x123456' as Hex;
                mockClient.submitRequest.mockResolvedValue(mockRequestId);
                mockClient.pollUntil.mockResolvedValue({
                    status: 'approved',
                    signature,
                    message,
                });
                mockRecoverPersonalSignature.mockReturnValue('0x999');

                const mockRequest: KeyringRequest = {
                    id: mockRequestId,
                    account: mockAccountId,
                    scope: 'eip155:1',
                    request: {
                        method: EthMethod.PersonalSign,
                        params: [message, mockAddress],
                    },
                };

                await expect(keyring.submitRequest(mockRequest)).rejects.toThrow(`Recovered address 0x999 does not match from address ${mockAddress}`);
            });

            it('should require signature in response', async () => {
                mockClient.submitRequest.mockResolvedValue(mockRequestId);
                mockClient.pollUntil.mockResolvedValue({ status: 'approved' });

                const mockRequest: KeyringRequest = {
                    id: mockRequestId,
                    account: mockAccountId,
                    scope: 'eip155:1',
                    request: {
                        method: EthMethod.PersonalSign,
                        params: ['0x123456' as Hex, mockAddress],
                    },
                };

                await expect(keyring.submitRequest(mockRequest)).rejects.toThrow('No signature returned');
            });
        });

        describe('submitRequest - transaction', () => {
            it('should sign transaction', async () => {
                const signedTx = '0x02ef83aa36a7068459682f008459763ba982520894309d83b27c0c19933f33d20a9539e1d5618b371585e8d4a5100080c0' as TransactionSerializedLegacy;
                mockClient.submitRequest.mockResolvedValue(mockRequestId);
                mockClient.pollUntil.mockResolvedValue({
                    status: 'approved',
                    signed: signedTx,
                });

                const mockTx = {
                    nonce: '0x6' as Hex,
                    chainId: '0xaa36a7' as Hex,
                    from: mockAddress,
                    to: "0x309d83b27c0c19933f33d20a9539e1d5618b3715",
                    value: '0xe8d4a51000' as Hex,
                    data: '0x' as Hex,
                    gasLimit: "0x5208",
                    maxFeePerGas: "0x59763ba9",
                    maxPriorityFeePerGas: "0x59682f00",
                };

                const mockRequest: KeyringRequest = {
                    id: mockRequestId,
                    account: mockAccountId,
                    scope: 'eip155:1',
                    request: {
                        method: EthMethod.SignTransaction,
                        params: [mockTx],
                    },
                };

                const response = await keyring.submitRequest(mockRequest);

                expect(response).toEqual({
                    pending: false,
                    result: {
                        nonce: "0x6",
                        chainId: "0xaa36a7",
                        to: "0x309d83b27c0c19933f33d20a9539e1d5618b3715",
                        value: "0xe8d4a51000",
                        data: "0x",
                        gasLimit: "0x5208",
                        maxFeePerGas: "0x59763ba9",
                        maxPriorityFeePerGas: "0x59682f00",
                        type: 0,
                        r: "0x0",
                        s: "0x0",
                        v: "0x0",
                    },
                });
                expect(mockClient.submitRequest).toHaveBeenCalledWith('signTransaction', {
                    status: 'pending',
                    origin: undefined,
                    from: mockAddress,
                    transaction: "0xe7068082520894309d83b27c0c19933f33d20a9539e1d5618b371585e8d4a510008083aa36a78080",
                });
            });

            it('should require signed transaction in response', async () => {
                mockClient.submitRequest.mockResolvedValue(mockRequestId);
                mockClient.pollUntil.mockResolvedValue({ status: 'approved' });

                const mockTx = {
                    nonce: '0x0' as Hex,
                    from: mockAddress,
                    to: mockAddress,
                    value: '0x3e8' as Hex,
                    data: '0x' as Hex,
                    gasLimit: '0x5208' as Hex,
                    gasPrice: '0x9184e72a000' as Hex,
                    chainId: '0x1' as Hex,
                };

                const mockRequest: KeyringRequest = {
                    id: mockRequestId,
                    account: mockAccountId,
                    scope: 'eip155:1',
                    request: {
                        method: EthMethod.SignTransaction,
                        params: [mockTx],
                    },
                };

                await expect(keyring.submitRequest(mockRequest)).rejects.toThrow('No signed transaction returned');
            });
        });

        describe('submitRequest - typed data', () => {
            it('should sign typed data', async () => {
                const signature = '0xabcdef' as Hex;
                const typedData = {
                    domain: { name: 'Test', version: '1' },
                    types: {
                        EIP712Domain: [
                            { name: 'name', type: 'string' },
                            { name: 'version', type: 'string' },
                        ],
                        Test: [{ name: 'value', type: 'string' }],
                    },
                    primaryType: 'Test',
                    message: { value: 'hello' },
                };
                mockClient.submitRequest.mockResolvedValue(mockRequestId);
                mockClient.pollUntil.mockResolvedValue({
                    status: 'approved',
                    signature,
                });

                const mockRequest: KeyringRequest = {
                    id: mockRequestId,
                    account: mockAccountId,
                    scope: 'eip155:1',
                    request: {
                        method: EthMethod.SignTypedDataV4,
                        params: [mockAddress, typedData],
                    },
                };

                const response = await keyring.submitRequest(mockRequest);

                expect(response).toEqual({ pending: false, result: signature });
                expect(mockClient.submitRequest).toHaveBeenCalledWith('signTypedData', {
                    status: 'pending',
                    origin: undefined,
                    from: mockAddress,
                    data: {
                        domain: { name: 'Test', version: '1' },
                        types: { Test: [{ name: 'value', type: 'string' }] },
                        primaryType: 'Test',
                        message: { value: 'hello' },
                    },
                });
            });
        });

        describe('Error handling', () => {
            testClientPollingFailure(
                'submitRequest',
                () => mockClient.submitRequest.mockResolvedValue(mockRequestId),
                () => {
                    const mockRequest: KeyringRequest = {
                        id: mockRequestId,
                        account: mockAccountId,
                        scope: 'eip155:1',
                        request: {
                            method: EthMethod.PersonalSign,
                            params: ['0x123456' as Hex, mockAddress],
                        },
                    };
                    return keyring.submitRequest(mockRequest);
                }
            );

            it('should reject unsupported methods', async () => {
                const mockRequest: KeyringRequest = {
                    id: mockRequestId,
                    account: mockAccountId,
                    scope: 'eip155:1',
                    request: {
                        method: 'eth_unsupported',
                        params: [],
                    },
                };

                await expect(keyring.submitRequest(mockRequest)).rejects.toThrow("EVM method 'eth_unsupported' not supported");
            });
        });
    });
});