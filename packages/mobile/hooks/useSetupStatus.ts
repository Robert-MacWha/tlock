import { useEffect, useState } from 'react';
import { useSecureStorage } from './useSecureStorage';

export function useSetupStatus() {
    const secureStorage = useSecureStorage();
    const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(
        null,
    );

    useEffect(() => {
        secureStorage.getItem('tlock_setup_complete').then((value) => {
            setIsSetupComplete(value === 'true');
        }).catch(() => {
            setIsSetupComplete(false);
        });
    }, []);

    const updateIsSetupComplete = (isSetupComplete: boolean) => {
        setIsSetupComplete(isSetupComplete);
        void secureStorage.setItem('tlock_setup_complete', isSetupComplete ? 'true' : 'false', isSetupComplete);
    };

    return { isSetupComplete, setIsSetupComplete: updateIsSetupComplete };
}
