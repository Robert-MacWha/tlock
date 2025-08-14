import React, { createContext, useContext, ReactNode } from 'react';
import { Account, useKeyring } from '../hooks/useKeyring';
import type {
    Address,
    Hex,
    TransactionSerialized,
    TypedDataDefinition,
} from 'viem';

interface KeyringContextType {
    accounts: Account[];
    getSeedPhrase: () => Promise<string>;
    generateSeedPhrase: (override?: boolean) => Promise<string>;
    addAccount: () => Promise<Address>;
    renameAccount: (address: Address, name: string) => Promise<void>;
    hideAccount: (address: Address, hide: boolean) => Promise<void>;
    sign: (from: Address, hash: Hex) => Promise<Hex>;
    signPersonal: (from: Address, raw: Hex) => Promise<Hex>;
    signTypedData: (from: Address, data: TypedDataDefinition) => Promise<Hex>;
    signTransaction: (
        from: Address,
        transaction: Hex,
    ) => Promise<TransactionSerialized>;
}

const KeyringContext = createContext<KeyringContextType | undefined>(undefined);

export function KeyringProvider({ children }: { children: ReactNode }) {
    const {
        accounts,
        getSeedPhrase,
        generateSeedPhrase,
        addAccount,
        renameAccount,
        hideAccount,
        sign,
        signPersonal,
        signTypedData,
        signTransaction,
    } = useKeyring();

    return (
        <KeyringContext.Provider
            value={{
                accounts,
                getSeedPhrase,
                generateSeedPhrase,
                addAccount,
                renameAccount,
                hideAccount,
                sign,
                signPersonal,
                signTypedData,
                signTransaction,
            }}
        >
            {children}
        </KeyringContext.Provider>
    );
}

export function useKeyringContext() {
    const context = useContext(KeyringContext);
    if (!context) {
        throw new Error(
            'useKeyringContext must be used within a KeyringProvider',
        );
    }
    return context;
}
