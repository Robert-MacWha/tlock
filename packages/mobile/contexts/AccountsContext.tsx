import React, { createContext, useContext, ReactNode, useState } from 'react';
import { Account, useSeedPhrase } from '../hooks/useSeedPhrase';
import type { Address, Hex, Transaction } from 'viem';
import { SignTypedDataVersion } from '@metamask/eth-sig-util';

interface AccountsContextType {
    accounts: Account[];
    refreshAccounts: () => Promise<void>;
    getSeedPhrase: () => Promise<string>;
    generateSeedPhrase: (override?: boolean) => Promise<string>;
    addAccount: () => Promise<Address>;
    sign: (from: Address, hash: Hex) => Promise<Hex>;
    signPersonal: (from: Address, raw: Hex) => Promise<Hex>;
    signTypedData: (from: Address, data: any) => Promise<Hex>;
    signTransaction: (from: Address, transaction: Transaction) => Promise<Hex>;
}

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

export function AccountsProvider({ children }: { children: ReactNode }) {
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
    } = useSeedPhrase();

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
        <AccountsContext.Provider value={{
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
        </AccountsContext.Provider>
    );
}

export function useAccountsContext() {
    const context = useContext(AccountsContext);
    if (!context) {
        throw new Error('useAccountsContext must be used within a AccountsProvider');
    }
    return context;
}
