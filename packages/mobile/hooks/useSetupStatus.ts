import { useEffect, useState } from "react";
import * as SecureStore from 'expo-secure-store';

export function useSetupStatus() {
    const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);

    useEffect(() => {
        SecureStore.getItemAsync('tlock_setup_complete')
            .then(value => setIsSetupComplete(value === 'true'))
            .catch(() => setIsSetupComplete(false));
    }, []);

    const updateIsSetupComplete = (isSetupComplete: boolean) => {
        if (isSetupComplete) {
            SecureStore.setItem('tlock_setup_complete', 'true');
        } else {
            SecureStore.setItem('tlock_setup_complete', 'false', { requireAuthentication: true });
        }
        setIsSetupComplete(isSetupComplete);
    };

    return { isSetupComplete, setIsSetupComplete: updateIsSetupComplete };
}