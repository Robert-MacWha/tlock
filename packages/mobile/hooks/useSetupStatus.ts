import { useEffect, useState } from 'react';
import { useSecureStorage } from './useSecureStorage';

const SETUP_FLAG_KEY = 'lodgelock_setup_complete';

export function useSetupStatus() {
    const secureStorage = useSecureStorage();
    const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(
        null,
    );

    useEffect(() => {
        secureStorage
            .getItem(SETUP_FLAG_KEY, false)
            .then((value) => {
                setIsSetupComplete(value === 'true');
            })
            .catch(() => {
                setIsSetupComplete(false);
            });
    }, []);

    const updateIsSetupComplete = (isSetupComplete: boolean) => {
        setIsSetupComplete(isSetupComplete);
        void secureStorage.setItem(
            SETUP_FLAG_KEY,
            isSetupComplete ? 'true' : 'false',
            !isSetupComplete,
        );
    };

    return { isSetupComplete, setIsSetupComplete: updateIsSetupComplete };
}
