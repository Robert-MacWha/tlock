import { selectScreen } from '../index';
import { SCREENS } from '../constants';
import { handleHomeScreen } from '../homeScreen';
import { showPairingScreen } from '../pairing';
import { handleImportAccount } from '../importAccount';
import { handleSettingsScreen } from '../settings';
import { showErrorScreen } from '../screen';

jest.mock('../homeScreen');
jest.mock('../pairing');
jest.mock('../importAccount');
jest.mock('../settings');
jest.mock('../screen');

const mockHandlers = {
    handleHomeScreen: handleHomeScreen as jest.MockedFunction<typeof handleHomeScreen>,
    showPairingScreen: showPairingScreen as jest.MockedFunction<typeof showPairingScreen>,
    handleImportAccount: handleImportAccount as jest.MockedFunction<typeof handleImportAccount>,
    handleSettingsScreen: handleSettingsScreen as jest.MockedFunction<typeof handleSettingsScreen>,
    showErrorScreen: showErrorScreen as jest.MockedFunction<typeof showErrorScreen>,
};

describe('index', () => {
    const mockInterfaceId = 'test-interface-id';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    describe('selectScreen', () => {
        it('should route to home screen', async () => {
            await selectScreen(mockInterfaceId, SCREENS.HOME);
            expect(mockHandlers.handleHomeScreen).toHaveBeenCalledWith(mockInterfaceId);
        });

        it('should route to pairing screen', async () => {
            await selectScreen(mockInterfaceId, SCREENS.PAIR);
            expect(mockHandlers.showPairingScreen).toHaveBeenCalledWith(mockInterfaceId);
        });

        it('should route to import account screen', async () => {
            await selectScreen(mockInterfaceId, SCREENS.IMPORT_ACCOUNT);
            expect(mockHandlers.handleImportAccount).toHaveBeenCalledWith(mockInterfaceId);
        });

        it('should route to settings screen', async () => {
            await selectScreen(mockInterfaceId, SCREENS.SETTINGS);
            expect(mockHandlers.handleSettingsScreen).toHaveBeenCalledWith(mockInterfaceId);
        });

        it('should handle unknown screens gracefully', async () => {
            await selectScreen(mockInterfaceId, 'unknown-screen');
            // Should not call any handlers for unknown screen
            expect(mockHandlers.handleHomeScreen).not.toHaveBeenCalled();
            expect(mockHandlers.showPairingScreen).not.toHaveBeenCalled();
        });

        it('should show error screen when handler throws', async () => {
            const error = new Error('Handler failed');
            mockHandlers.handleHomeScreen.mockRejectedValue(error);

            await selectScreen(mockInterfaceId, SCREENS.HOME);

            expect(mockHandlers.showErrorScreen).toHaveBeenCalledWith(
                mockInterfaceId,
                'Handler failed'
            );
        });

        it('should handle non-Error exceptions', async () => {
            mockHandlers.handleHomeScreen.mockRejectedValue('string error');

            await selectScreen(mockInterfaceId, SCREENS.HOME);

            expect(mockHandlers.showErrorScreen).toHaveBeenCalledWith(
                mockInterfaceId,
                'An unexpected error occurred'
            );
        });
    });
});