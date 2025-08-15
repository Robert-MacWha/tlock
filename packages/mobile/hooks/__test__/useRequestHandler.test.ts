import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useRequestHandler } from '../useRequestHandler';
import { RequestTypeMap, SharedSecret } from '@tlock/shared';
import { Address, Hex } from 'viem';
import { ClientInstance } from '../useClients';

// Mock dependencies
jest.mock('expo-router', () => ({
    useLocalSearchParams: jest.fn(),
    router: { replace: jest.fn(), back: jest.fn() },
}));

jest.mock('../../contexts/ClientContext', () => ({
    useClientsContext: jest.fn(),
}));

import { useLocalSearchParams, router } from 'expo-router';
import { useClientsContext } from '../../contexts/ClientContext';

const mockUseLocalSearchParams = useLocalSearchParams as jest.MockedFunction<
    typeof useLocalSearchParams
>;
const mockUseClientsContext = useClientsContext as jest.MockedFunction<
    typeof useClientsContext
>;
const mockRouter = router as jest.Mocked<typeof router>;

describe('useRequestHandler', () => {
    const mockGetRequest = jest.fn();
    const mockUpdateRequest = jest.fn();

    const mockClient: ClientInstance = {
        id: 'test-client-id',
        name: 'Test Client',
        sharedSecret: [1, 2, 3, 4, 5] as SharedSecret,
        client: {
            roomId: 'test-room-id',
            submitRequest: jest.fn(),
            updateRequest: mockUpdateRequest,
            getRequest: mockGetRequest,
            getRequests: jest.fn(),
            deleteRequest: jest.fn(),
            pollUntil: jest.fn(),
        },
    };

    const mockRequest: RequestTypeMap['signPersonal'] = {
        status: 'pending',
        from: '0x123' as Address,
        message: '0xdeadbeef' as Hex,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => { });

        mockUseLocalSearchParams.mockReturnValue({
            clientId: 'test-client-id',
            requestId: 'test-request-id',
        });

        mockUseClientsContext.mockReturnValue({
            clients: [mockClient],
            addClient: jest.fn(),
            removeClient: jest.fn(),
            setClientName: jest.fn(),
            firebaseUrl: 'test-firebase-url',
            setFirebaseUrl: jest.fn(),
        });

        mockGetRequest.mockResolvedValue(mockRequest);
        mockUpdateRequest.mockResolvedValue(undefined);
    });

    it('should fetch request successfully', async () => {
        const { result } = renderHook(() =>
            useRequestHandler({
                type: 'signPersonal',
                onApprove: jest.fn(),
            }),
        );

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(mockGetRequest).toHaveBeenCalledWith(
            'test-request-id',
            'signPersonal',
        );
        expect(result.current.request).toEqual(mockRequest);
        expect(result.current.client).toEqual(mockClient);
        expect(result.current.error).toBeNull();
    });

    describe('handleApprove', () => {
        it('should update request and redirect on approval', async () => {
            const mockOnApprove = jest
                .fn()
                .mockResolvedValue({ signature: '0xsignature' as Hex });

            const { result } = renderHook(() =>
                useRequestHandler({
                    type: 'signPersonal',
                    onApprove: mockOnApprove,
                }),
            );

            await waitFor(() => expect(result.current.loading).toBe(false));
            await act(() => result.current.handleApprove());

            expect(mockOnApprove).toHaveBeenCalledWith(mockRequest);
            expect(mockUpdateRequest).toHaveBeenCalledWith(
                'test-request-id',
                'signPersonal',
                {
                    ...mockRequest,
                    signature: '0xsignature',
                    status: 'approved',
                },
            );
            expect(mockRouter.replace).toHaveBeenCalledWith({
                pathname: '/_requests/success',
                params: { type: 'signPersonal' },
            });
        });
    });

    describe('handleReject', () => {
        it('should update request on rejection', async () => {
            const { result } = renderHook(() =>
                useRequestHandler({
                    type: 'signPersonal',
                    onApprove: jest.fn(),
                }),
            );

            await waitFor(() => expect(result.current.loading).toBe(false));
            await act(() => result.current.handleReject());

            expect(mockUpdateRequest).toHaveBeenCalledWith(
                'test-request-id',
                'signPersonal',
                {
                    ...mockRequest,
                    status: 'rejected',
                },
            );
            expect(mockRouter.back).toHaveBeenCalledWith();
        });
    });

    it('should handle client not found', async () => {
        mockUseClientsContext.mockReturnValue({
            clients: [],
            addClient: jest.fn(),
            removeClient: jest.fn(),
            setClientName: jest.fn(),
            firebaseUrl: 'test-firebase-url',
            setFirebaseUrl: jest.fn(),
        });

        const { result } = renderHook(() =>
            useRequestHandler({
                type: 'signPersonal',
                onApprove: jest.fn(),
            }),
        );

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe('Client not found');
    });

    it('should handle onApprove failure', async () => {
        const mockOnApprove = jest
            .fn()
            .mockRejectedValue(new Error('Approval failed'));

        const { result } = renderHook(() =>
            useRequestHandler({
                type: 'signPersonal',
                onApprove: mockOnApprove,
            }),
        );

        await waitFor(() => expect(result.current.loading).toBe(false));
        await act(() => result.current.handleApprove());

        expect(result.current.error).toBe('Approval failed');
        expect(mockUpdateRequest).not.toHaveBeenCalled();
    });
});
