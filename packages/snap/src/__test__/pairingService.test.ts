import { PairingService } from '../pairingService';
import {
    generateSharedSecret,
    createClient,
    PairRequest,
    type Client,
    type SharedSecret,
} from '@lodgelock/shared';
import { updateState } from '../state';

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('@lodgelock/shared', () => ({
    ...jest.requireActual('@lodgelock/shared'),
    generateSharedSecret: jest.fn(),
    createClient: jest.fn(),
}));
jest.mock('../state');

const mockGenerateSharedSecret = generateSharedSecret as jest.MockedFunction<
    typeof generateSharedSecret
>;
const mockCreateClient = createClient as jest.MockedFunction<
    typeof createClient
>;
const mockUpdateState = updateState as jest.MockedFunction<typeof updateState>;

describe('PairingService', () => {
    let pairingService: PairingService;
    let mockClient: jest.Mocked<Client>;

    const mockSharedSecret = [1, 2, 3, 4, 5] as SharedSecret;
    const mockRequestId = 'test-request-id';

    beforeEach(() => {
        jest.clearAllMocks();

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

        mockGenerateSharedSecret.mockReturnValue(mockSharedSecret);
        mockCreateClient.mockReturnValue(mockClient);
        mockUpdateState.mockResolvedValue();

        pairingService = new PairingService();
    });

    describe('Constructor', () => {
        it('should initialize with provided client', () => {
            const service = new PairingService();
            expect(service).toBeDefined();
        });
    });

    describe('startPairing', () => {
        beforeEach(() => {
            mockClient.submitRequest.mockResolvedValue(mockRequestId);
        });

        it('should successfully start pairing flow', async () => {
            const result = await pairingService.start();

            expect(result).toEqual({
                qrData: '://pair/eyJ2ZXJzaW9uIjoxLCJzaGFyZWRTZWNyZXQiOlsxLDIsMyw0LDVdLCJwYWlyUmVxdWVzdElkIjoidGVzdC1yZXF1ZXN0LWlkIn0=',
                // QR code asci, so just check for a string
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                qrSrc: expect.any(String),
                requestId: mockRequestId,
                sharedSecret: mockSharedSecret,
            });

            expect(mockGenerateSharedSecret).toHaveBeenCalled();
            expect(mockCreateClient).toHaveBeenCalledWith(
                mockSharedSecret,
                undefined,
                undefined,
            );
            expect(mockClient.submitRequest).toHaveBeenCalledWith('pair', {
                status: 'pending',
                fcmToken: '',
                deviceName: '',
            });
            expect(mockUpdateState).toHaveBeenCalledWith({
                sharedSecret: mockSharedSecret,
            });
        });

        it('should handle client submission error', async () => {
            mockClient.submitRequest.mockRejectedValue(
                new Error('Network error'),
            );

            await expect(pairingService.start()).rejects.toThrow(
                'Error generating pairing data',
            );
        });
    });

    describe('waitForPairing', () => {
        const mockPairResponse: PairRequest = {
            status: 'approved',
            fcmToken: 'mock-fcm-token',
            deviceName: 'Test Device',
        };

        it('should successfully wait for pairing completion and update state', async () => {
            mockClient.pollUntil.mockResolvedValue(mockPairResponse);

            const result = await pairingService.waitForPairing(
                mockRequestId,
                mockClient,
                mockSharedSecret,
            );

            expect(result).toBe(mockPairResponse);
            expect(mockClient.pollUntil).toHaveBeenCalledWith(
                mockRequestId,
                'pair',
                500,
                300,
                expect.any(Function),
            );
            expect(mockUpdateState).toHaveBeenCalledWith({
                sharedSecret: mockSharedSecret,
                fcmToken: mockPairResponse.fcmToken,
                deviceName: mockPairResponse.deviceName,
            });
        });

        it('should not update state when pairing is rejected', async () => {
            const rejectedResponse: PairRequest = {
                status: 'rejected',
                fcmToken: '',
                deviceName: '',
            };
            mockClient.pollUntil.mockResolvedValue(rejectedResponse);

            const result = await pairingService.waitForPairing(
                mockRequestId,
                mockClient,
                mockSharedSecret,
            );

            expect(result).toBe(rejectedResponse);
            expect(mockUpdateState).toHaveBeenCalledTimes(0);
        });

        it('should handle polling error', async () => {
            mockClient.pollUntil.mockRejectedValue(new Error('Timeout'));

            await expect(
                pairingService.waitForPairing(
                    mockRequestId,
                    mockClient,
                    mockSharedSecret,
                ),
            ).rejects.toThrow('Pairing timed out or failed');
            expect(mockUpdateState).toHaveBeenCalledTimes(0);
        });
    });
});
