import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { generateMnemonic, mnemonicToSeed } from 'bip39';
import { HDKey } from '@scure/bip32';
import { privateKeyToAccount } from 'viem/accounts';
import { bytesToHex } from 'viem';
import type { Address, Hex, PrivateKeyAccount } from 'viem';

export interface Account {
    id: number;
    address: Address;
}

interface SeedPhraseContextType {
    accounts: Account[];
    addAccount: () => Promise<Address>;
    signPersonal: (from: Address, raw: Hex) => Promise<Hex>;
    sign: (from: Address, hash: Hex) => Promise<Hex>;
    generateSeedPhrase: (override?: boolean) => Promise<string>;
    getSeedPhrase: () => Promise<string>;
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
            await loadAccounts();
        };

        initializeApp();
    }, []);

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

    const generateSeedPhrase = async (override: boolean = false): Promise<string> => {
        const seedPhrase = generateMnemonic();

        if (!seedPhrase) {
            throw new Error('Seed phrase cannot be empty');
        }

        const existingSeedPhrase = await SecureStore.getItemAsync(SEED_PHRASE_KEY);
        if (existingSeedPhrase && !override) {
            throw new Error('Seed phrase already exists. Use override to replace it.');
        }

        await SecureStore.setItemAsync(SEED_PHRASE_KEY, seedPhrase);

        // Reset accounts and counter
        setAccounts([]);
        setAccountCounter(0);
        await SecureStore.setItemAsync(ACCOUNTS_KEY, JSON.stringify([]));
        await SecureStore.setItemAsync(ACCOUNT_COUNTER_KEY, '0');

        return seedPhrase;
    }

    const getSeedPhrase = async (): Promise<string> => {
        const seedPhrase = await SecureStore.getItemAsync(SEED_PHRASE_KEY);
        if (!seedPhrase) {
            throw new Error('No seed phrase found');
        }
        return seedPhrase;
    };

    const addAccount = async (): Promise<Address> => {
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

    // const signTypedData = async (version: ethSigUtil.SignTypedDataVersion, from: Address, data: any): Promise<string> => {
    //     try {
    //         const privateKey = await getPrivateKeyFromAddress(from);
    //         const signature = ethSigUtil.signTypedData({
    //             privateKey,
    //             data: data as unknown as TypedDataV1 | TypedMessage<any>,
    //             version: version,
    //         });
    //         return signature;
    //     } catch (error) {
    //         throw new Error(`Failed to sign typed data: ${JSON.stringify(data)}`);
    //     }
    // }

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
            generateSeedPhrase,
            addAccount,
            signPersonal,
            sign,
            getSeedPhrase,
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
const deriveAddress = async (seedPhrase: string, accountId: number): Promise<Address> => {
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