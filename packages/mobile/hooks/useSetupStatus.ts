import { useEffect, useState } from "react";
import * as SecureStore from 'expo-secure-store';

export function useSetupStatus() {
    const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);

    useEffect(() => {
        SecureStore.getItemAsync('tlock_setup_complete')
            .then(value => setIsSetupComplete(value === 'true'))
            .catch(() => setIsSetupComplete(false));
    }, []);

    const updateIsSetupComplete = async (isSetupComplete: boolean) => {
        await SecureStore.setItemAsync('tlock_setup_complete', isSetupComplete ? 'true' : 'false');
        setIsSetupComplete(isSetupComplete);
    };

    return { isSetupComplete, setIsSetupComplete: updateIsSetupComplete };
}