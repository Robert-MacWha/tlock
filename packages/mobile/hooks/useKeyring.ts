import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { entropyToMnemonic, mnemonicToSeedSync } from 'bip39';
import { HDKey } from '@scure/bip32';
import { privateKeyToAccount } from 'viem/accounts';
import { bytesToHex, parseTransaction } from 'viem';
import type { Address, Hex, PrivateKeyAccount, TransactionSerialized, TypedDataDefinition } from 'viem';
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
    //? Stateful accounts variable for external use. Internally make sure to
    //? always use the _loadAccounts function to ensure data consistency.
    const [accounts, setAccounts] = useState<Account[]>([]);

    useEffect(() => {
        const accounts = _loadAccounts()
        setAccounts(accounts);
    }, []);

    const getSeedPhrase = (): string => {
        const seedPhrase = SecureStore.getItem(SEED_PHRASE_KEY, { requireAuthentication: true });
        if (!seedPhrase) {
            throw new Error('No seed phrase found');
        }
        return seedPhrase;
    };

    const generateSeedPhrase = (override: boolean = false): string => {
        const existingSeedPhrase = SecureStore.getItem(SEED_PHRASE_KEY, { requireAuthentication: true });
        if (existingSeedPhrase && !override) {
            throw new Error('Seed phrase already exists. Use override to replace it.');
        }

        const entropy = Crypto.getRandomBytes(16);
        const seedPhrase = entropyToMnemonic(Buffer.from(entropy));
        if (!seedPhrase) {
            throw new Error('No seed phrase generated');
        }
        SecureStore.setItem(SEED_PHRASE_KEY, seedPhrase);

        // Reset accounts
        _saveAccounts([]);
        setAccounts([]);

        return seedPhrase;
    }

    const addAccount = (): Address => {
        const newAccountId = accounts.length + 1;
        const address = _deriveAddress(newAccountId);

        const newAccount: Account = {
            id: newAccountId,
            address
        };

        const newAccounts = [...accounts, newAccount];
        _saveAccounts(newAccounts);
        setAccounts(newAccounts);

        return address;
    };

    const renameAccount = (address: Address, name: string): void => {
        const updatedAccounts = accounts.map(account =>
            account.address === address ? { ...account, name } : account
        );
        _saveAccounts(updatedAccounts);
        setAccounts(updatedAccounts);
    };

    const hideAccount = (address: Address, hide: boolean): void => {
        const updatedAccounts = accounts.map(account =>
            account.address === address ? { ...account, isHidden: hide } : account
        );
        _saveAccounts(updatedAccounts);
        setAccounts(updatedAccounts);
    };

    const sign = async (from: Address, hash: Hex): Promise<Hex> => {
        const account = _getAccountFromAddress(from);
        return await account.sign({ hash });
    };

    const signPersonal = async (from: Address, raw: Hex): Promise<Hex> => {
        const account = _getAccountFromAddress(from);
        return await account.signMessage({ message: { raw } });
    }

    const signTypedData = async (from: Address, data: TypedDataDefinition): Promise<Hex> => {
        const account = _getAccountFromAddress(from);
        return await account.signTypedData(data);
    }

    const signTransaction = async (from: Address, transaction: Hex): Promise<TransactionSerialized> => {
        const account = _getAccountFromAddress(from);
        const parsed = parseTransaction(transaction);
        const signedTransaction = await account.signTransaction(parsed);
        return signedTransaction;
    }

    const _loadAccounts = (): Account[] => {
        const accountsStr = SecureStore.getItem(ACCOUNTS_KEY);

        let accounts: Account[] = [];
        if (accountsStr) {
            accounts = JSON.parse(accountsStr) as Account[];
        }
        setAccounts(accounts);
        return accounts;
    };

    const _saveAccounts = (accounts: Account[]) => {
        setAccounts(accounts);
        SecureStore.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    const _getAccountFromAddress = (address: Address): PrivateKeyAccount => {
        const account = accounts.find(account => account.address.toLowerCase() === address.toLowerCase());
        if (!account) {
            throw new Error(`Account with address ${address} not found`);
        }

        const privateKey = _getPrivateKey(account.id);
        return privateKeyToAccount(privateKey);
    }

    const _deriveAddress = (accountId: number): Address => {
        const privateKey = _getPrivateKey(accountId);
        try {
            const account = privateKeyToAccount(privateKey);
            return account.address;
        } catch (_error) {
            // ? Should never be thrown, just here to prevent data leaks
            throw new Error('Failed to derive address');
        }
    }

    const _getPrivateKey = (accountId: number): Hex => {
        const seedPhrase = getSeedPhrase();
        try {
            const seed = mnemonicToSeedSync(seedPhrase);
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
        accounts,
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