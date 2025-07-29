import React, { createContext, useContext, ReactNode, useState } from 'react';
import { Account, useKeyring } from '../hooks/useKeyring';
import type { Address, Hex, TransactionSerialized, TypedDataDefinition } from 'viem';

interface KeyringContextType {
    accounts: Account[];
    refreshAccounts: () => Promise<void>;
    getSeedPhrase: () => Promise<string>;
    generateSeedPhrase: (override?: boolean) => Promise<string>;
    addAccount: () => Promise<Address>;
    sign: (from: Address, hash: Hex) => Promise<Hex>;
    signPersonal: (from: Address, raw: Hex) => Promise<Hex>;
    signTypedData: (from: Address, data: TypedDataDefinition) => Promise<Hex>;
    signTransaction: (from: Address, transaction: Hex) => Promise<TransactionSerialized>;
}

const KeyringContext = createContext<KeyringContextType | undefined>(undefined);

export function KeyringProvider({ children }: { children: ReactNode }) {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const {
        getAccounts,
        getSeedPhrase,
        generateSeedPhrase,
        addAccount,
        sign,
        signPersonal,
        signTypedData,
        signTransaction
    } = useKeyring();

    const refreshAccounts = async () => {
        const loadedAccounts = await getAccounts();
        setAccounts(loadedAccounts);
    };

    const addAccountWithRefresh = async (): Promise<Address> => {
        const address = await addAccount();
        await refreshAccounts();
        return address;
    };

    const generateSeedPhraseWithRefresh = async (override?: boolean): Promise<string> => {
        const seedPhrase = await generateSeedPhrase(override);
        await refreshAccounts();
        return seedPhrase;
    };

    return (
        <KeyringContext.Provider value={{
            accounts,
            refreshAccounts,
            getSeedPhrase,
            generateSeedPhrase: generateSeedPhraseWithRefresh,
            addAccount: addAccountWithRefresh,
            sign,
            signPersonal,
            signTypedData,
            signTransaction
        }}>
            {children}
        </KeyringContext.Provider>
    );
}

export function useKeyringContext() {
    const context = useContext(KeyringContext);
    if (!context) {
        throw new Error('useKeyringContext must be used within a KeyringProvider');
    }
    return context;
}
