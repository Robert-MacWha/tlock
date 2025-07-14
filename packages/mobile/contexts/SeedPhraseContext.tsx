import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { generateMnemonic, mnemonicToSeed } from 'bip39';
import { HDKey } from '@scure/bip32';
import { privateKeyToAccount } from 'viem/accounts';
import { bytesToHex } from 'viem';
import type { Address, Hex, PrivateKeyAccount } from 'viem';

export interface Account {
    id: number;
    address: string;
}

interface SeedPhraseContextType {
    accounts: Account[];
    addAccount: () => Promise<string>;
    signPersonal: (from: Address, raw: Hex) => Promise<Hex>;
    sign: (from: Address, hash: Hex) => Promise<Hex>;
}

const SEED_PHRASE_KEY = 'tlock_seed_phrase';
const ACCOUNT_COUNTER_KEY = 'tlock_account_counter';
const ACCOUNTS_KEY = 'tlock_accounts';

const SeedPhraseContext = createContext<SeedPhraseContextType | undefined>(undefined);

/**
 * SeedPhraseProvider provides methods to interact with seed phrases and private
 * keys securely without exposing sensitive data.
 */
export function SeedPhraseProvider({ children }: { children: ReactNode }) {
    const [accountCounter, setAccountCounter] = useState(0);
    const [accounts, setAccounts] = useState<Account[]>([]);

    useEffect(() => {
        console.log('Initializing seed phrase hook');
        const initializeApp = async () => {
            try {
                await generateSeedPhrase();
                console.log('Seed phrase generated successfully');
            } catch (error) {
                console.log('Failed to generate seed phrase:', error);
            }
            await loadAccounts();
        };

        initializeApp();
    }, []);

    // Generate a new seed phrase and save it. Throws an
    // error if the seed phrase already exists. 
    const generateSeedPhrase = async () => {
        const existing = await SecureStore.getItemAsync(SEED_PHRASE_KEY);
        if (existing) {
            throw new Error('Seed phrase already exists.');
        }

        const mnemonic = generateMnemonic();
        await SecureStore.setItemAsync(SEED_PHRASE_KEY, mnemonic);

        // Reset accounts when generating new seed
        setAccountCounter(0);
        setAccounts([]);
        await SecureStore.setItemAsync(ACCOUNT_COUNTER_KEY, '0');
        await SecureStore.setItemAsync(ACCOUNTS_KEY, JSON.stringify([]));
        console.log('New seed phrase generated:', mnemonic);
    };

    const loadAccounts = async () => {
        try {
            const counterStr = await SecureStore.getItemAsync(ACCOUNT_COUNTER_KEY);
            const accountsStr = await SecureStore.getItemAsync(ACCOUNTS_KEY);

            if (counterStr) {
                setAccountCounter(parseInt(counterStr, 10));
            }

            if (accountsStr) {
                setAccounts(JSON.parse(accountsStr));
            }
        } catch (error) {
            console.error('Failed to load accounts:', error);
        }
    };

    const addAccount = async (): Promise<string> => {
        const seedPhrase = await SecureStore.getItemAsync(SEED_PHRASE_KEY);
        if (!seedPhrase) {
            throw new Error('No seed phrase found. Generate one first.');
        }

        const newAccountId = accountCounter;
        const address = await deriveAddress(seedPhrase, newAccountId);

        const newAccount: Account = {
            id: newAccountId,
            address
        };

        const updatedAccounts = [...accounts, newAccount];
        const newCounter = accountCounter + 1;

        setAccounts(updatedAccounts);
        setAccountCounter(newCounter);

        await SecureStore.setItemAsync(ACCOUNT_COUNTER_KEY, newCounter.toString());
        await SecureStore.setItemAsync(ACCOUNTS_KEY, JSON.stringify(updatedAccounts));

        return address;
    };

    const sign = async (from: Address, hash: Hex): Promise<Hex> => {
        try {
            const account = await getAccountFromAddress(from);
            return await account.sign({ hash });
        } catch (error) {
            throw new Error(`Failed to sign hash: ${hash}`);
        }
    };

    const signPersonal = async (from: Address, raw: Hex): Promise<Hex> => {
        try {
            const account = await getAccountFromAddress(from);
            return await account.signMessage({ message: { raw } });
        } catch (error) {
            throw new Error(`Failed to sign raw: ${raw}`);
        }
    }

    const getAccountFromAddress = async (address: Address): Promise<PrivateKeyAccount> => {
        const account = accounts.find(account => account.address.toLowerCase() === address.toLowerCase());
        if (!account) {
            throw new Error(`Account with address ${address} not found`);
        }

        const privateKey = await getPrivateKey(account.id);
        return privateKeyToAccount(privateKey);
    }

    return (
        <SeedPhraseContext.Provider value={{
            accounts,
            addAccount,
            signPersonal,
            sign,
        }} >
            {children}
        </SeedPhraseContext.Provider>
    );
}

export function useSeedPhraseContext() {
    const context = useContext(SeedPhraseContext);
    if (!context) {
        throw new Error('useSeedPhraseContext must be used within a SeedPhraseProvider');
    }
    return context;
}

// Helper function to derive address without exposing private key
const deriveAddress = async (seedPhrase: string, accountId: number): Promise<string> => {
    const seed = await mnemonicToSeed(seedPhrase);
    const hdKey = HDKey.fromMasterSeed(seed);
    const derived = hdKey.derive(`m/44'/60'/0'/0/${accountId}`);

    if (!derived.privateKey) {
        throw new Error('Failed to derive private key');
    }

    const privateKey = bytesToHex(derived.privateKey);
    const account = privateKeyToAccount(privateKey);

    return account.address;
};

// Helper function to get private key (only used internally)
const getPrivateKey = async (accountId: number): Promise<Hex> => {
    try {
        const seedPhrase = await SecureStore.getItemAsync(SEED_PHRASE_KEY);
        if (!seedPhrase) {
            throw new Error('No seed phrase found');
        }

        const seed = await mnemonicToSeed(seedPhrase);
        const hdKey = HDKey.fromMasterSeed(seed);
        const derived = hdKey.derive(`m/44'/60'/0'/0/${accountId}`);

        if (!derived.privateKey) {
            throw new Error('Failed to derive private key');
        }

        return bytesToHex(derived.privateKey);
    } catch (error) {
        throw new Error('Failed to get private key');
    }
};