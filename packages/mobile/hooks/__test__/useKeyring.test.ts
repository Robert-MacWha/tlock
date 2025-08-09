import { renderHook, waitFor } from '@testing-library/react-native';
import { useKeyring } from '../useKeyring';
import * as SecureStore from 'expo-secure-store';
import { useAuthenticator } from '../useAuthenticator';
import { Address, Hex, parseGwei, parseTransaction, serializeTransaction, TransactionSerializableLegacy, TypedDataDefinition } from 'viem';

// Mock only specific dependencies
jest.mock('expo-secure-store');
jest.mock('../useAuthenticator');
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('bip39', () => ({
    ...jest.requireActual('bip39'),
    entropyToMnemonic: jest.fn(() => 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'),
}));

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockUseAuthenticator = useAuthenticator as jest.MockedFunction<typeof useAuthenticator>;

// Mock implementations
const mockAuthenticate = jest.fn();

describe('useSeedPhrase', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default mocks
        mockUseAuthenticator.mockReturnValue({
            authenticate: mockAuthenticate,
        });

        // Mock SecureStore methods directly
        mockSecureStore.getItemAsync.mockImplementation(jest.fn());
        mockSecureStore.setItemAsync.mockImplementation(jest.fn());

        // Default successful authentication
        mockAuthenticate.mockResolvedValue(undefined);
    });

    describe('Hook initialization', () => {
        it('should initialize without errors', () => {
            const { result } = renderHook(() => useKeyring());
            expect(result.current).toBeDefined();
        });
    });

    // Helper function to setup storage state
    const setupStorageState = (options: {
        seedPhrase?: string | null;
        accounts?: string | null;
    }) => {
        mockSecureStore.getItemAsync.mockImplementation((key: string) => {
            switch (key) {
                case 'tlock_seed_phrase':
                    return Promise.resolve(options.seedPhrase ?? null);
                case 'tlock_accounts':
                    return Promise.resolve(options.accounts ?? null);
                default:
                    return Promise.resolve(null);
            }
        });
    };

    // Helper function to test authentication failures
    const testAuthenticationFailure = (methodName: string, methodCall: (result: ReturnType<typeof useKeyring>) => Promise<unknown>) => {
        it(`${methodName} should throw error when authentication fails`, async () => {
            const existingAccounts = [{ id: 1, address: '0x123' }];
            setupStorageState({
                seedPhrase: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
                accounts: JSON.stringify(existingAccounts)
            });

            mockAuthenticate.mockRejectedValue(new Error('Authentication failed'));
            const { result } = renderHook(() => useKeyring());

            await expect(methodCall(result.current)).rejects.toThrow('Authentication failed');
        });
    };

    // Helper function to test account does not exist errors
    const testAccountNotFound = (methodName: string, methodCall: (result: ReturnType<typeof useKeyring>) => Promise<unknown>) => {
        it(`${methodName} should throw error when account does not exist`, async () => {
            setupStorageState({ accounts: '[]' });
            const { result } = renderHook(() => useKeyring());

            await expect(methodCall(result.current)).rejects.toThrow('Failed to get account from address: 0x123');
        });
    };

    describe('Authentication failures', () => {
        testAuthenticationFailure('getSeedPhrase', (result) => result.getSeedPhrase());
        testAuthenticationFailure('generateSeedPhrase', (result) => result.generateSeedPhrase());
        testAuthenticationFailure('addAccount', (result) => result.addAccount());
        testAuthenticationFailure('sign', (result) => result.sign('0x123' as Address, '0x11223344' as Hex));
        testAuthenticationFailure('signPersonal', (result) => result.signPersonal('0x123' as Address, '0xmessage' as Hex));
        testAuthenticationFailure('signTransaction', (result) => result.signTransaction('0x123' as Address, '0x1122' as Hex));
        testAuthenticationFailure('signTypedData', (result) => result.signTypedData('0x123' as Address, {} as TypedDataDefinition));
    });

    describe('Account not found errors', () => {
        testAccountNotFound('sign', (result) => result.sign('0x123' as Address, '0x11223344' as Hex));
        testAccountNotFound('signPersonal', (result) => result.signPersonal('0x123' as Address, '0xmessage' as Hex));
        testAccountNotFound('signTransaction', (result) => result.signTransaction('0x123' as Address, '0x1122' as Hex));
    });

    describe('getSeedPhrase', () => {
        it('should throw error when seed phrase does not exist', async () => {
            setupStorageState({ seedPhrase: null });
            const { result } = renderHook(() => useKeyring());

            await expect(result.current.getSeedPhrase()).rejects.toThrow('No seed phrase found');
        });

        it('should handle empty string seed phrase', async () => {
            setupStorageState({ seedPhrase: '' });
            const { result } = renderHook(() => useKeyring());

            await expect(result.current.getSeedPhrase()).rejects.toThrow('No seed phrase found');
        });

        it('should return seed phrase when it exists', async () => {
            const mockSeedPhrase = 'test seed phrase';
            setupStorageState({ seedPhrase: mockSeedPhrase });
            const { result } = renderHook(() => useKeyring());

            const seedPhrase = await result.current.getSeedPhrase();

            expect(seedPhrase).toBe(mockSeedPhrase);
        });
    });

    describe('generateSeedPhrase', () => {
        it('should throw error when seed phrase already exists without override', async () => {
            setupStorageState({ seedPhrase: 'existing seed phrase' });
            const { result } = renderHook(() => useKeyring());

            await expect(result.current.generateSeedPhrase(false)).rejects.toThrow('Seed phrase already exists. Use override to replace it.');
        });

        it('should generate new seed phrase successfully', async () => {
            setupStorageState({ seedPhrase: null });
            const { result } = renderHook(() => useKeyring());

            const seedPhrase = await result.current.generateSeedPhrase();

            expect(seedPhrase).toBe('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
            expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('tlock_seed_phrase', seedPhrase);
            expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('tlock_accounts', '[]');
        });

        it('should override existing seed phrase when override is true', async () => {
            setupStorageState({ seedPhrase: 'existing seed phrase' });
            const { result } = renderHook(() => useKeyring());

            const seedPhrase = await result.current.generateSeedPhrase(true);

            expect(seedPhrase).toBe('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
            expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('tlock_seed_phrase', seedPhrase);
        });
    });

    describe('accounts', () => {
        it('should return empty array when no accounts exist', async () => {
            setupStorageState({ accounts: null });
            const { result } = renderHook(() => useKeyring());

            await waitFor(() => {
                expect(result.current.accounts).toEqual([]);
            });
        });

        it('should return accounts when they exist', async () => {
            const mockAccounts = [{ id: 1, address: '0x123' }];
            setupStorageState({ accounts: JSON.stringify(mockAccounts) });
            const { result } = renderHook(() => useKeyring());

            await waitFor(() => {
                expect(result.current.accounts).toEqual(mockAccounts);
            });
        });
    });

    describe('addAccount', () => {
        it('should throw error when no seed phrase exists', async () => {
            setupStorageState({ seedPhrase: null, accounts: '[]' });
            const { result } = renderHook(() => useKeyring());

            await expect(result.current.addAccount()).rejects.toThrow('No seed phrase found');
        });

        it('should add first account successfully', async () => {
            setupStorageState({
                seedPhrase: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
                accounts: '[]',
            });
            const { result } = renderHook(() => useKeyring());

            const address = await result.current.addAccount();

            expect(address).toBeDefined();
            expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('tlock_accounts', expect.stringContaining(address));
        });

        it('should add new accounts successfully', async () => {
            const existingAccounts = [{ id: 1, address: '0x123' }];
            setupStorageState({
                seedPhrase: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
                accounts: JSON.stringify(existingAccounts),
            });
            const { result } = renderHook(() => useKeyring());

            const address = await result.current.addAccount();
            expect(address).toBeDefined();
            expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('tlock_accounts', expect.stringContaining(address));
            expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('tlock_accounts', expect.stringContaining('0x123'));
        });
    });

    describe('sign', () => {
        it('should handle missing accounts', async () => {
            setupStorageState({
                seedPhrase: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
                accounts: JSON.stringify([])
            });
            const { result } = renderHook(() => useKeyring());

            await expect(result.current.sign(
                '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc' as Address,
                '0x11223344' as Hex
            )).rejects.toThrow('Failed to get account from address: 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc');
        });

        it('should handle case-insensitive address matching', async () => {
            const mockAccount = { id: 1, address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc' };
            setupStorageState({
                seedPhrase: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
                accounts: JSON.stringify([mockAccount])
            });
            const { result } = renderHook(() => useKeyring());

            // Test with lowercase address
            const signature = await result.current.sign(
                mockAccount.address.toLowerCase() as Address,
                '0x11223344' as Hex
            );
            expect(signature).toBeDefined();
        });

        it('should sign hash successfully', async () => {
            const mockAccount = { id: 1, address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc' };
            setupStorageState({
                seedPhrase: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
                accounts: JSON.stringify([mockAccount])
            });
            const { result } = renderHook(() => useKeyring());

            const signature = await result.current.sign(mockAccount.address as Address, '0x11223344' as Hex);

            expect(signature).toBeDefined();
            expect(signature).toBe("0x0c43fcdbe26032227a790b33d9153dfddcb0e96f9b343ab62a06547d5b876ae57c4c421bb0f6f55b0605686c8c58ac9753ca64a6da88386d2281b5ed1c306f5f1c");
        });
    });

    describe('signPersonal', () => {
        it('should sign personal message successfully', async () => {
            const mockAccount = { id: 1, address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc' };
            setupStorageState({
                seedPhrase: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
                accounts: JSON.stringify([mockAccount])
            });
            const { result } = renderHook(() => useKeyring());

            const signature = await result.current.signPersonal(mockAccount.address as Address, '0xmessage' as Hex);

            expect(signature).toBeDefined();
            expect(signature).toBe("0x4254c2fe56c860aa52ed65245b8270ca323ba21e1de8a77ed7dbc8269328b79178f58f11bc4c63818346fb93fad6e1d885b3c7e98d1d24b2c984ade9ff08b6701c");
        });
    });

    describe('signTransaction', () => {
        it('should sign legacy transaction successfully', async () => {
            const mockAccount = { id: 1, address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc' };
            setupStorageState({
                seedPhrase: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
                accounts: JSON.stringify([mockAccount])
            });
            const { result } = renderHook(() => useKeyring());

            const transaction: TransactionSerializableLegacy = {
                chainId: 1,
                gas: 21001n,
                nonce: 69,
                to: '0x1234567890123456789012345678901234567890' as Address,
                value: parseGwei('0.1'),
                data: '0x00' as Hex,
                type: 'legacy',
            };
            const serialized = serializeTransaction(transaction);
            const signed = await result.current.signTransaction(mockAccount.address as Address, serialized);

            expect(signed).toBeDefined();
            expect(signed).toEqual("0xf86345808252099412345678901234567890123456789012345678908405f5e1000026a03e789887f49de3184594fd43dee586fec3c016f7eeed512773afacbf66f9c6aba019239a2415e90438bc7e124d0f93e786473c3b1bfdcff6392a2518d8d9a1b362");

            // Ensure the transaction was serialized correctly
            const parsed = parseTransaction(signed);
            expect(parsed).toEqual({
                ...transaction,
                r: "0x3e789887f49de3184594fd43dee586fec3c016f7eeed512773afacbf66f9c6ab",
                s: "0x19239a2415e90438bc7e124d0f93e786473c3b1bfdcff6392a2518d8d9a1b362",
                v: 38n,
                yParity: 1,
            });
        });
    });

    describe('signTypedData', () => {
        it('should sign typed data successfully', async () => {
            const mockAccount = { id: 1, address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc' };
            setupStorageState({
                seedPhrase: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
                accounts: JSON.stringify([mockAccount])
            });
            const { result } = renderHook(() => useKeyring());

            const typedData: TypedDataDefinition = {
                domain: {
                    name: 'Ether Mail',
                    version: '1',
                    chainId: 1,
                    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
                },
                types: {
                    Person: [
                        { name: 'name', type: 'string' },
                        { name: 'wallet', type: 'address' },
                    ],
                    Mail: [
                        { name: 'from', type: 'Person' },
                        { name: 'to', type: 'Person' },
                        { name: 'contents', type: 'string' },
                    ],
                },
                primaryType: 'Mail',
                message: {
                    from: {
                        name: 'Cow',
                        wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
                    },
                    to: {
                        name: 'Bob',
                        wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                    },
                    contents: 'Hello, Bob!',
                },
            }

            const signature = await result.current.signTypedData(mockAccount.address as Address, typedData);
            expect(signature).toBeDefined();
            expect(signature).toBe("0x97e9bdce2d01d4ecc9091bf4df4e687e06ccd3ddfbd002d03cffe12e99ae9c6c613d334370ed3b71db4a535ddf18d34d7dfb14edd6a5b923e7b8565ee83bf02c1c");
        });
    });

    describe('SecureStore failures', () => {
        it('should handle SecureStore setItemAsync failures in generateSeedPhrase', async () => {
            setupStorageState({ seedPhrase: null });
            mockSecureStore.setItemAsync.mockRejectedValue(new Error('SecureStore write failed'));
            const { result } = renderHook(() => useKeyring());

            await expect(result.current.generateSeedPhrase()).rejects.toThrow('SecureStore write failed');
        });

        it('should handle SecureStore failures in addAccount', async () => {
            setupStorageState({
                seedPhrase: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
                accounts: '[]',
            });
            mockSecureStore.setItemAsync.mockRejectedValue(new Error('SecureStore write failed'));
            const { result } = renderHook(() => useKeyring());

            await expect(result.current.addAccount()).rejects.toThrow('SecureStore write failed');
        });
    });
});
