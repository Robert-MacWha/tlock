import Constants from 'expo-constants';

export function useDevMode() {
    const isDev = Constants.appOwnership === 'expo';

    return {
        isDev,
    };
}