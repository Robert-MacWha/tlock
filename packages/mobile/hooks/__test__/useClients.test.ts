import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useClients } from '../useClients';
import { useSecureStorage } from '../useSecureStorage';
import { SharedSecret } from '@tlock/shared';
import * as ExportoCrypto from 'expo-crypto';

const mockClient = {
    getRequests: jest.fn(),
    getRequest: jest.fn(),
    updateRequest: jest.fn(),
    deleteRequest: jest.fn(),
    submitRequest: jest.fn(),
    submitDevice: jest.fn(),
    getDevice: jest.fn(),
    pollUntil: jest.fn(),
    roomId: 'mock-room-id',
};

// Mock dependencies
jest.mock('../useSecureStorage');
jest.mock('@tlock/shared', () => ({
    createClient: jest.fn(() => mockClient),
    DEFAULT_FIREBASE_URL: 'https://default-firebase-url.com',
}));
jest.mock('expo-crypto');

const mockUseSecureStorage = useSecureStorage as jest.MockedFunction<
    typeof useSecureStorage
>;
const mockExportoCrypto = ExportoCrypto as jest.Mocked<typeof ExportoCrypto>;

const mockSecureStorageReturn = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    securityLevel: null,
};

describe('useClients', () => {
    const mockSharedSecret: SharedSecret = [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    ];
    const mockSharedSecret2: SharedSecret = [
        16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        mockUseSecureStorage.mockReturnValue(mockSecureStorageReturn);
        mockSecureStorageReturn.getItem.mockResolvedValue(null);
        mockSecureStorageReturn.setItem.mockResolvedValue(undefined);
        mockExportoCrypto.randomUUID.mockReturnValue('test-uuid-123');
    });

    describe('Initialization', () => {
        it('should initialize with empty clients when no stored data', async () => {
            const { result } = renderHook(() => useClients());

            await waitFor(() => {
                expect(result.current.clients).toEqual([]);
            });
        });

        it('should load existing clients from storage', async () => {
            const storedClients = [
                {
                    id: 'client-1',
                    name: 'Test Client',
                    sharedSecret: mockSharedSecret,
                },
            ];
            mockSecureStorageReturn.getItem.mockResolvedValue(
                JSON.stringify(storedClients),
            );

            const { result } = renderHook(() => useClients());

            await waitFor(() => {
                expect(result.current.clients).toHaveLength(1);
                expect(result.current.clients[0]).toEqual(
                    expect.objectContaining({
                        id: 'client-1',
                        name: 'Test Client',
                        sharedSecret: mockSharedSecret,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        client: expect.any(Object),
                    }),
                );
            });
        });
    });

    describe('Adding clients', () => {
        it('should add client with name successfully', async () => {
            const { result } = renderHook(() => useClients());

            let newClient;
            await act(async () => {
                newClient = await result.current.addClient(
                    mockSharedSecret,
                    'My Client',
                );
            });

            expect(newClient).toEqual(
                expect.objectContaining({
                    id: 'test-uuid-123',
                    name: 'My Client',
                    sharedSecret: mockSharedSecret,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    client: expect.any(Object),
                }),
            );

            await waitFor(() => {
                expect(result.current.clients).toHaveLength(1);
            });
        });

        it('should add client without name successfully', async () => {
            const { result } = renderHook(() => useClients());

            let newClient;
            await act(async () => {
                newClient = await result.current.addClient(mockSharedSecret);
            });

            expect(newClient).toEqual(
                expect.objectContaining({
                    id: 'test-uuid-123',
                    name: undefined,
                    sharedSecret: mockSharedSecret,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    client: expect.any(Object),
                }),
            );
        });

        it('should persist new client to storage', async () => {
            const { result } = renderHook(() => useClients());

            await act(async () => {
                await result.current.addClient(mockSharedSecret, 'Test Client');
            });

            expect(mockSecureStorageReturn.setItem).toHaveBeenCalledWith(
                'tlock_clients',
                expect.stringContaining('Test Client'),
                false,
            );
        });
    });

    describe('Removing clients', () => {
        it('should remove existing client successfully', async () => {
            // Setup initial client
            const storedClients = [
                {
                    id: 'client-1',
                    name: 'Client 1',
                    sharedSecret: mockSharedSecret,
                },
                {
                    id: 'client-2',
                    name: 'Client 2',
                    sharedSecret: mockSharedSecret2,
                },
            ];
            mockSecureStorageReturn.getItem.mockResolvedValue(
                JSON.stringify(storedClients),
            );

            const { result } = renderHook(() => useClients());

            await waitFor(() => {
                expect(result.current.clients).toHaveLength(2);
            });

            await act(async () => {
                await result.current.removeClient('client-1');
            });

            await waitFor(() => {
                expect(result.current.clients).toHaveLength(1);
                expect(result.current.clients[0]?.id).toBe('client-2');
            });
        });

        it('should persist removal to storage', async () => {
            const storedClients = [
                {
                    id: 'client-1',
                    name: 'Client 1',
                    sharedSecret: mockSharedSecret,
                },
            ];
            mockSecureStorageReturn.getItem.mockResolvedValue(
                JSON.stringify(storedClients),
            );

            const { result } = renderHook(() => useClients());

            await waitFor(() => {
                expect(result.current.clients).toHaveLength(1);
            });

            await act(async () => {
                await result.current.removeClient('client-1');
            });

            expect(mockSecureStorageReturn.setItem).toHaveBeenCalledWith(
                'tlock_clients',
                '[]',
                false,
            );
        });

        it('should handle removing non-existent client gracefully', async () => {
            const { result } = renderHook(() => useClients());

            await act(async () => {
                await result.current.removeClient('non-existent');
            });

            await waitFor(() => {
                expect(result.current.clients).toEqual([]);
            });
        });
    });

    describe('Renaming clients', () => {
        it('should rename existing client successfully', async () => {
            const storedClients = [
                {
                    id: 'client-1',
                    name: 'Old Name',
                    sharedSecret: mockSharedSecret,
                },
            ];
            mockSecureStorageReturn.getItem.mockResolvedValue(
                JSON.stringify(storedClients),
            );

            const { result } = renderHook(() => useClients());

            await waitFor(() => {
                expect(result.current.clients[0]?.name).toBe('Old Name');
            });

            await act(async () => {
                await result.current.setClientName('client-1', 'New Name');
            });

            await waitFor(() => {
                expect(result.current.clients[0]?.name).toBe('New Name');
            });
        });

        it('should persist name change to storage', async () => {
            const storedClients = [
                {
                    id: 'client-1',
                    name: 'Old Name',
                    sharedSecret: mockSharedSecret,
                },
            ];
            mockSecureStorageReturn.getItem.mockResolvedValue(
                JSON.stringify(storedClients),
            );

            const { result } = renderHook(() => useClients());

            await waitFor(() => {
                expect(result.current.clients).toHaveLength(1);
            });

            await act(async () => {
                await result.current.setClientName('client-1', 'New Name');
            });

            expect(mockSecureStorageReturn.setItem).toHaveBeenCalledWith(
                'tlock_clients',
                expect.stringContaining('New Name'),
                false,
            );
        });

        it('should handle renaming non-existent client gracefully', async () => {
            const storedClients = [
                {
                    id: 'client-1',
                    name: 'Old Name',
                    sharedSecret: mockSharedSecret,
                    client: mockClient,
                },
            ];
            mockSecureStorageReturn.getItem.mockResolvedValue(
                JSON.stringify(storedClients),
            );

            const { result } = renderHook(() => useClients());

            await waitFor(() => {
                expect(result.current.clients).toHaveLength(1);
            });

            await act(async () => {
                await result.current.setClientName('non-existent', 'New Name');
            });

            await waitFor(() => {
                expect(result.current.clients).toEqual(storedClients);
            });
        });
    });
});
