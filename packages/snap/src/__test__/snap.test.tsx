import { installSnap } from '@metamask/snaps-jest';
import { TlockKeyring } from '../keyring';
import { PairingService } from '../pairingService';
import { getState } from '../state';
import { SCREENS } from '../constants';
import { Box, Button, Heading, Image, Text } from '@metamask/snaps-sdk/jsx';
import { createClient } from '@tlock/shared';

jest.mock('../keyring');
jest.mock('../pairingService');
jest.mock('../state');
jest.mock('@tlock/shared', () => ({
    ...jest.requireActual('@tlock/shared'),
    createClient: jest.fn(),
}));

const mockTlockKeyring = TlockKeyring as jest.MockedClass<typeof TlockKeyring>;
const mockPairingService = PairingService as jest.MockedClass<typeof PairingService>;
const mockGetState = getState as jest.MockedFunction<typeof getState>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Tlock Snap', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('User Input Handling', () => {
        it('should handle navigation to pairing screen', async () => {
            const mockPairingServiceInstance = {
                startPairing: jest.fn().mockResolvedValue({
                    qrData: 'test-qr-data',
                    qrSrc: 'test-qr-svg',
                    requestId: 'test-request-id',
                    sharedSecret: [1, 2, 3, 4, 5],
                }),
                waitForPairing: jest.fn().mockResolvedValue({
                    status: 'approved',
                    fcmToken: 'test-token',
                    deviceName: 'Test Device',
                }),
            };
            mockPairingService.mockImplementation(() => mockPairingServiceInstance);

            const snap = await installSnap();
            const response = await snap.onHomePage();

            console.error('Pairing screen');

            {
                const screen = response.getInterface();
                console.error('Pairing screen:', screen);
                await screen.clickElement("pair");
                console.error('Pairing screen response:', screen);
            }

            {
                const screen = response.getInterface();
                expect(mockPairingServiceInstance.startPairing).toHaveBeenCalled();
                expect(screen).toRender((
                    <Box>
                        <Heading>Pair Your Wallet</Heading>
                        <Text>
                            Open the Foxguard mobile app and scan this QR code to pair:
                        </Text>
                        <Image src="" alt="Pairing QR Code" />
                        <Button name={SCREENS.HOME}>Cancel Pairing</Button>
                    </Box>
                ));
            }
        });

        //     it('should handle navigation to import account screen', async () => {
        //         const { onHomePage } = await installSnap();

        //         // Mock state as paired
        //         mockGetState.mockResolvedValue({
        //             sharedSecret: [1, 2, 3, 4, 5],
        //             fcmToken: 'test-token',
        //             deviceName: 'Test Device',
        //             keyringState: { wallets: {}, pendingRequests: {} }
        //         });

        //         // Mock keyring
        //         const mockKeyringInstance = {
        //             createAccount: jest.fn().mockResolvedValue({
        //                 id: 'test-account-id',
        //                 address: '0x1234567890123456789012345678901234567890',
        //                 options: {},
        //                 methods: [],
        //                 type: 'eoa'
        //             })
        //         };
        //         mockTlockKeyring.mockImplementation(() => mockKeyringInstance);

        //         const homeResponse = await onHomePage();
        //         const interfaceId = homeResponse.id;

        //         // Click import account button
        //         const importResponse = await onUserInput({
        //             id: interfaceId,
        //             event: {
        //                 type: 'ButtonClickEvent',
        //                 name: SCREENS.IMPORT_ACCOUNT,
        //             },
        //         });

        //         expect(mockKeyringInstance.createAccount).toHaveBeenCalled();
        //         expect(importResponse).toRender(
        //             expect.objectContaining({
        //                 type: 'Box',
        //                 children: expect.arrayContaining([
        //                     expect.objectContaining({
        //                         type: 'Text',
        //                         children: expect.stringContaining('0x1234567890123456789012345678901234567890')
        //                     })
        //                 ])
        //             })
        //         );
        //     });

        //     it('should handle navigation back to home screen', async () => {
        //         const { onHomePage, onUserInput } = await installSnap();

        //         const homeResponse = await onHomePage();
        //         const interfaceId = homeResponse.id;

        //         // Navigate to home
        //         const backResponse = await onUserInput({
        //             id: interfaceId,
        //             event: {
        //                 type: 'ButtonClickEvent',
        //                 name: SCREENS.HOME,
        //             },
        //         });

        //         expect(backResponse).toRender(
        //             expect.objectContaining({
        //                 type: 'Box',
        //                 children: expect.arrayContaining([
        //                     expect.objectContaining({
        //                         type: 'Heading',
        //                         children: 'Tlock Wallet'
        //                     })
        //                 ])
        //             })
        //         );
        //     });
        // });

        // describe('Error Handling', () => {
        //     it('should show error screen when pairing fails', async () => {
        //         const { onHomePage, onUserInput } = await installSnap();

        //         // Mock pairing service to throw error
        //         const mockPairingServiceInstance = {
        //             startPairing: jest.fn().mockRejectedValue(new Error('Network error')),
        //         };
        //         mockPairingService.mockImplementation(() => mockPairingServiceInstance as any);

        //         const homeResponse = await onHomePage();
        //         const interfaceId = homeResponse.id;

        //         // Try to pair - should show error
        //         const errorResponse = await onUserInput({
        //             id: interfaceId,
        //             event: {
        //                 type: 'ButtonClickEvent',
        //                 name: SCREENS.PAIR,
        //             },
        //         });

        //         expect(errorResponse).toRender(
        //             expect.objectContaining({
        //                 type: 'Box',
        //                 children: expect.arrayContaining([
        //                     expect.objectContaining({
        //                         type: 'Heading',
        //                         children: 'Error'
        //                     })
        //                 ])
        //             })
        //         );
        //     });

        //     it('should show error screen when account import fails', async () => {
        //         const { onHomePage, onUserInput } = await installSnap();

        //         // Mock state as paired but keyring throws error
        //         mockGetState.mockResolvedValue({
        //             sharedSecret: [1, 2, 3, 4, 5],
        //             fcmToken: 'test-token',
        //             deviceName: 'Test Device',
        //             keyringState: { wallets: {}, pendingRequests: {} }
        //         });

        //         const mockKeyringInstance = {
        //             createAccount: jest.fn().mockRejectedValue(new Error('Import failed')),
        //         };
        //         mockTlockKeyring.mockImplementation(() => mockKeyringInstance as any);

        //         const homeResponse = await onHomePage();
        //         const interfaceId = homeResponse.id;

        //         // Try to import account - should show error
        //         const errorResponse = await onUserInput({
        //             id: interfaceId,
        //             event: {
        //                 type: 'ButtonClickEvent',
        //                 name: SCREENS.IMPORT_ACCOUNT,
        //             },
        //         });

        //         expect(errorResponse).toRender(
        //             expect.objectContaining({
        //                 type: 'Box',
        //                 children: expect.arrayContaining([
        //                     expect.objectContaining({
        //                         type: 'Heading',
        //                         children: 'Error'
        //                     })
        //                 ])
        //             })
        //         );
        //     });

        //     it('should handle unknown button clicks gracefully', async () => {
        //         const { onHomePage, onUserInput } = await installSnap();

        //         const homeResponse = await onHomePage();
        //         const interfaceId = homeResponse.id;

        //         // Click unknown button - should not crash
        //         await expect(
        //             onUserInput({
        //                 id: interfaceId,
        //                 event: {
        //                     type: 'ButtonClickEvent',
        //                     name: 'unknown-button',
        //                 },
        //             })
        //         ).resolves.not.toThrow();
        //     });
        // });

        // describe('Keyring Request Handling', () => {
        //     it('should handle keyring requests with valid state', async () => {
        //         const { onKeyringRequest } = await installSnap();

        //         // Mock paired state
        //         mockGetState.mockResolvedValue({
        //             sharedSecret: [1, 2, 3, 4, 5],
        //             fcmToken: 'test-token',
        //             deviceName: 'Test Device',
        //             keyringState: { wallets: {}, pendingRequests: {} }
        //         });

        //         // Mock keyring
        //         const mockKeyringInstance = {
        //             listAccounts: jest.fn().mockResolvedValue([]),
        //         };
        //         mockTlockKeyring.mockImplementation(() => mockKeyringInstance as any);

        //         const response = await onKeyringRequest({
        //             origin: 'test-origin',
        //             request: {
        //                 id: 'test-request-id',
        //                 method: 'keyring_listAccounts',
        //                 params: {},
        //             },
        //         });

        //         expect(mockKeyringInstance.listAccounts).toHaveBeenCalled();
        //         expect(response).toRespondWith([]);
        //     });

        //     it('should reject keyring requests when not paired', async () => {
        //         const { onKeyringRequest } = await installSnap();

        //         // Mock unpaired state
        //         mockGetState.mockResolvedValue({});

        //         await expect(
        //             onKeyringRequest({
        //                 origin: 'test-origin',
        //                 request: {
        //                     id: 'test-request-id',
        //                     method: 'keyring_listAccounts',
        //                     params: {},
        //                 },
        //             })
        //         ).rejects.toThrow();
        //     });

        //     it('should pass origin to keyring constructor', async () => {
        //         const { onKeyringRequest } = await installSnap();

        //         mockGetState.mockResolvedValue({
        //             sharedSecret: [1, 2, 3, 4, 5],
        //             fcmToken: 'test-token',
        //             deviceName: 'Test Device',
        //             keyringState: { wallets: {}, pendingRequests: {} }
        //         });

        //         const testOrigin = 'https://test-dapp.com';

        //         await onKeyringRequest({
        //             origin: testOrigin,
        //             request: {
        //                 id: 'test-request-id',
        //                 method: 'keyring_listAccounts',
        //                 params: {},
        //             },
        //         });

        //         expect(mockTlockKeyring).toHaveBeenCalledWith(
        //             expect.anything(), // client
        //             expect.anything(), // state
        //             testOrigin // origin
        //         );
        //     });
        // });

        // describe('State Management', () => {
        //     it('should initialize with empty state', async () => {
        //         const { onHomePage } = await installSnap();

        //         mockGetState.mockResolvedValue(null);

        //         const response = await onHomePage();

        //         // Should still render home page even with empty state
        //         expect(response).toRender(
        //             expect.objectContaining({
        //                 type: 'Box',
        //             })
        //         );
        //     });

        //     it('should handle state corruption gracefully', async () => {
        //         const { onHomePage } = await installSnap();

        //         mockGetState.mockRejectedValue(new Error('State corrupted'));

        //         const response = await onHomePage();

        //         // Should still render something, possibly error screen
        //         expect(response).toRender(
        //             expect.objectContaining({
        //                 type: 'Box',
        //             })
        //         );
        //     });
        // });

        // describe('Pairing Flow Integration', () => {
        //     it('should complete full pairing flow', async () => {
        //         const { onHomePage, onUserInput } = await installSnap();

        //         // Mock successful pairing
        //         const mockPairResponse = {
        //             status: 'approved',
        //             fcmToken: 'new-token',
        //             deviceName: 'New Device',
        //         };

        //         const mockPairingServiceInstance = {
        //             startPairing: jest.fn().mockResolvedValue({
        //                 qrData: 'test-qr-data',
        //                 qrSrc: 'test-qr-svg',
        //                 requestId: 'test-request-id',
        //                 sharedSecret: [1, 2, 3, 4, 5],
        //             }),
        //             waitForPairing: jest.fn().mockResolvedValue(mockPairResponse),
        //         };
        //         mockPairingService.mockImplementation(() => mockPairingServiceInstance as any);

        //         const homeResponse = await onHomePage();
        //         const interfaceId = homeResponse.id;

        //         // Start pairing
        //         const pairResponse = await onUserInput({
        //             id: interfaceId,
        //             event: {
        //                 type: 'ButtonClickEvent',
        //                 name: SCREENS.PAIR,
        //             },
        //         });

        //         // Should show QR code
        //         expect(pairResponse).toRender(
        //             expect.objectContaining({
        //                 type: 'Box',
        //                 children: expect.arrayContaining([
        //                     expect.objectContaining({
        //                         type: 'Image',
        //                         src: 'test-qr-svg'
        //                     })
        //                 ])
        //             })
        //         );

        //         // Verify pairing service was called correctly
        //         expect(mockPairingServiceInstance.startPairing).toHaveBeenCalled();
        //         expect(mockPairingServiceInstance.waitForPairing).toHaveBeenCalledWith(
        //             'test-request-id',
        //             expect.anything(), // client
        //             [1, 2, 3, 4, 5]    // shared secret
        //         );
        //     });

        //     it('should handle pairing timeout', async () => {
        //         const { onHomePage, onUserInput } = await installSnap();

        //         const mockPairingServiceInstance = {
        //             startPairing: jest.fn().mockResolvedValue({
        //                 qrData: 'test-qr-data',
        //                 qrSrc: 'test-qr-svg',
        //                 requestId: 'test-request-id',
        //                 sharedSecret: [1, 2, 3, 4, 5],
        //             }),
        //             waitForPairing: jest.fn().mockRejectedValue(new Error('Timeout')),
        //         };
        //         mockPairingService.mockImplementation(() => mockPairingServiceInstance as any);

        //         const homeResponse = await onHomePage();
        //         const interfaceId = homeResponse.id;

        //         // Try pairing - should handle timeout gracefully
        //         const errorResponse = await onUserInput({
        //             id: interfaceId,
        //             event: {
        //                 type: 'ButtonClickEvent',
        //                 name: SCREENS.PAIR,
        //             },
        //         });

        //         expect(errorResponse).toRender(
        //             expect.objectContaining({
        //                 type: 'Box',
        //                 children: expect.arrayContaining([
        //                     expect.objectContaining({
        //                         type: 'Text',
        //                         children: expect.stringContaining('timed out')
        //                     })
        //                 ])
        //             })
        //         );
        //     });
    });
});