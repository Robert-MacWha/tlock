import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { entropyToMnemonic, mnemonicToSeed } from 'bip39';
import { HDKey } from '@scure/bip32';
import { privateKeyToAccount } from 'viem/accounts';
import { bytesToHex, parseTransaction } from 'viem';
import type { Address, Hex, PrivateKeyAccount, TransactionSerialized, TypedDataDefinition } from 'viem';
import { useAuthenticator } from './useAuthenticator';
import * as Crypto from 'expo-crypto';

export interface Account {
    id: number;
    name?: string | undefined;
    address: Address;
    isHidden?: boolean;
}

const SEED_PHRASE_KEY = 'tlock_seed_phrase';
const ACCOUNTS_KEY = 'tlock_accounts';

export function useKeyring() {
    const { authenticate } = useAuthenticator();
    //? Stateful accounts variable for external use. Internally make sure to
    //? always use the _loadAccounts function to ensure data consistency.
    const [externalAccounts, setAccounts] = useState<Account[]>([]);

    useEffect(() => {
        void _loadAccounts().then(setAccounts);
    }, []);

    const getSeedPhrase = async (): Promise<string> => {
        await authenticate();

        const seedPhrase = await SecureStore.getItemAsync(SEED_PHRASE_KEY);
        if (!seedPhrase) {
            throw new Error('No seed phrase found');
        }
        return seedPhrase;
    };

    const generateSeedPhrase = async (override: boolean = false): Promise<string> => {
        await authenticate();

        const existingSeedPhrase = await SecureStore.getItemAsync(SEED_PHRASE_KEY);
        if (existingSeedPhrase && !override) {
            console.log('Seed phrase already exists, not generating new one');
            throw new Error('Seed phrase already exists. Use override to replace it.');
        }

        let seedPhrase: string;
        try {
            const entropy = Crypto.getRandomBytes(16);
            seedPhrase = entropyToMnemonic(Buffer.from(entropy));
            if (!seedPhrase) {
                throw new Error('No seed phrase generated');
            }
        } catch (error) {
            console.error('Error generating seed phrase:', error);
            throw new Error('Failed to generate seed phrase');
        }

        await SecureStore.setItemAsync(SEED_PHRASE_KEY, seedPhrase);

        // Reset accounts
        await _saveAccounts([]);
        setAccounts([]);

        return seedPhrase;
    }

    const addAccount = async (): Promise<Address> => {
        console.log('Adding new account...');

        const accounts = await _loadAccounts();
        const newAccountId = accounts.length + 1;
        const address = await _deriveAddress(newAccountId);

        const newAccount: Account = {
            id: newAccountId,
            address
        };

        const newAccounts = [...accounts, newAccount];
        await _saveAccounts(newAccounts);
        setAccounts(newAccounts);

        return address;
    };

    const renameAccount = async (address: Address, name: string): Promise<void> => {
        const accounts = await _loadAccounts();
        const updatedAccounts = accounts.map(account =>
            account.address === address ? { ...account, name } : account
        );
        await _saveAccounts(updatedAccounts);
        setAccounts(updatedAccounts);
    };

    const hideAccount = async (address: Address, hide: boolean): Promise<void> => {
        const accounts = await _loadAccounts();
        const updatedAccounts = accounts.map(account =>
            account.address === address ? { ...account, isHidden: hide } : account
        );
        await _saveAccounts(updatedAccounts);
        setAccounts(updatedAccounts);
    };

    const sign = async (from: Address, hash: Hex): Promise<Hex> => {
        console.log('Signing hash:', hash);

        const account = await _getAccountFromAddress(from);
        try {
            return await account.sign({ hash });
        } catch (error) {
            console.log(error);
            throw new Error(`Failed to sign hash: ${hash}`);
        }
    };

    const signPersonal = async (from: Address, raw: Hex): Promise<Hex> => {
        console.log('Signing raw:', raw);

        const account = await _getAccountFromAddress(from);
        try {
            return await account.signMessage({ message: { raw } });
        } catch (error) {
            console.log(error);
            throw new Error(`Failed to sign raw: ${raw}`);
        }
    }

    const signTypedData = async (from: Address, data: TypedDataDefinition): Promise<Hex> => {
        console.log('Signing typed data:', data);

        const account = await _getAccountFromAddress(from);
        try {
            return await account.signTypedData(data);
        } catch (error) {
            console.log(error);
            throw new Error(`Failed to sign typed data: ${JSON.stringify(data)}`);
        }
    }

    const signTransaction = async (from: Address, transaction: Hex): Promise<TransactionSerialized> => {
        console.log('Signing transaction:', transaction);

        const account = await _getAccountFromAddress(from);
        try {
            const parsed = parseTransaction(transaction);
            const signedTransaction = await account.signTransaction(parsed);
            return signedTransaction;
        } catch (error) {
            console.log(error);
            throw new Error(`Failed to sign transaction from address: ${from}`);
        }
    }

    const _loadAccounts = async (): Promise<Account[]> => {
        const accountsStr = await SecureStore.getItemAsync(ACCOUNTS_KEY);

        let accounts: Account[] = [];
        if (accountsStr) {
            accounts = JSON.parse(accountsStr) as Account[];
        }
        setAccounts(accounts);
        return accounts;
    };

    const _saveAccounts = async (accounts: Account[]) => {
        setAccounts(accounts);
        await SecureStore.setItemAsync(ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    const _getAccountFromAddress = async (address: Address): Promise<PrivateKeyAccount> => {
        const accounts = await _loadAccounts();
        let account: Account | undefined;
        try {
            account = accounts.find(account => account.address.toLowerCase() === address.toLowerCase());
            if (!account) {
                throw new Error(`Account with address ${address} not found`);
            }
        } catch (error) {
            console.error('Error getting account from address:', error);
            throw new Error(`Failed to get account from address: ${address}`);
        }

        const privateKey = await _getPrivateKey(account.id);
        return privateKeyToAccount(privateKey);
    }

    const _deriveAddress = async (accountId: number): Promise<Address> => {
        const privateKey = await _getPrivateKey(accountId);
        try {
            const account = privateKeyToAccount(privateKey);
            return account.address;
        } catch (_error) {
            // ? Should never be thrown, just here to prevent data leaks
            throw new Error('Failed to derive address');
        }
    }

    const _getPrivateKey = async (accountId: number): Promise<Hex> => {
        const seedPhrase = await getSeedPhrase();
        try {
            const seed = await mnemonicToSeed(seedPhrase);
            const hdKey = HDKey.fromMasterSeed(seed);
            const derived = hdKey.derive(`m/44'/60'/0'/0/${accountId}`);

            if (!derived.privateKey) {
                throw new Error('Failed to derive private key');
            }

            return bytesToHex(derived.privateKey);
        } catch (_error) {
            // ? Should never be thrown, just here to prevent data leaks
            throw new Error('Failed to get private key');
        }
    }

    return {
        accounts: externalAccounts,
        getSeedPhrase,
        generateSeedPhrase,
        renameAccount,
        hideAccount,
        addAccount,
        sign,
        signPersonal,
        signTypedData,
        signTransaction,
    }
}