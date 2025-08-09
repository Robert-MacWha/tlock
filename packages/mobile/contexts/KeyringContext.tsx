import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Account, useKeyring } from '../hooks/useKeyring';
import type { Address, Hex, TransactionSerialized, TypedDataDefinition } from 'viem';

interface KeyringContextType {
    accounts: Account[];
    refreshAccounts: () => Promise<void>;
    getSeedPhrase: () => Promise<string>;
    generateSeedPhrase: (override?: boolean) => Promise<string>;
    addAccount: () => Promise<Address>;
    renameAccount: (address: Address, name: string) => Promise<void>;
    hideAccount: (address: Address, hide: boolean) => Promise<void>;
    sign: (from: Address, hash: Hex) => Promise<Hex>;
    signPersonal: (from: Address, raw: Hex) => Promise<Hex>;
    signTypedData: (from: Address, data: TypedDataDefinition) => Promise<Hex>;
    signTransaction: (from: Address, transaction: Hex) => Promise<TransactionSerialized>;
}

const KeyringContext = createContext<KeyringContextType | undefined>(undefined);

/**
 * KeyringProvider is a provider context that exposes a stateful list of accounts,
 * and keeps that list in sync with the keyring.
 * 
 * We basically just need to add a `refreshAccounts` call after any operation that
 * modifies the accounts set.
 */
export function KeyringProvider({ children }: { children: ReactNode }) {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const {
        getAccounts,
        getSeedPhrase,
        generateSeedPhrase,
        addAccount,
        renameAccount,
        hideAccount,
        sign,
        signPersonal,
        signTypedData,
        signTransaction
    } = useKeyring();

    useEffect(() => {
        void refreshAccounts();
    }, []);

    const refreshAccounts = async () => {
        const loadedAccounts = await getAccounts();
        setAccounts(loadedAccounts);
    };

    const addAccountWithRefresh = async (): Promise<Address> => {
        const address = await addAccount();
        await refreshAccounts();
        return address;
    };

    const renameAccountWithRefresh = async (address: Address, name: string) => {
        await renameAccount(address, name);
        await refreshAccounts();
    }

    const hideAccountWithRefresh = async (address: Address, hide: boolean) => {
        await hideAccount(address, hide);
        await refreshAccounts();
    }

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
            renameAccount: renameAccountWithRefresh,
            hideAccount: hideAccountWithRefresh,
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
