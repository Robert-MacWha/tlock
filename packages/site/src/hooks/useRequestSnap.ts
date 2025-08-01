import { useMetaMaskContext } from './MetamaskContext';
import { useRequest } from './useRequest';
import type { Snap } from '../types';

/**
 * Utility hook to wrap the `wallet_requestSnaps` method.
 */
export const useRequestSnap = (
    snapId: string,
    version?: string,
) => {
    const request = useRequest();
    const { setInstalledSnap } = useMetaMaskContext();

    const requestSnap = async () => {
        try {
            const snaps = (await request({
                method: 'wallet_requestSnaps',
                params: {
                    [snapId]: version ? { version } : {},
                },
            })) as Record<string, Snap>;

            const installedSnap = snaps?.[snapId];
            if (!installedSnap) {
                throw new Error(`Snap ${snapId} was not installed`);
            }

            setInstalledSnap(installedSnap);
            return installedSnap;
        } catch (error) {
            console.error('Failed to install snap:', error);
            throw error;
        }
    };

    return requestSnap;
};