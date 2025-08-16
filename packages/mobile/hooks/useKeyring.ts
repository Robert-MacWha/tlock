import { useState, useEffect } from 'react';
import { useSecureStorage } from './useSecureStorage';
import { entropyToMnemonic, mnemonicToSeedSync } from 'bip39';
import { HDKey } from '@scure/bip32';
import { privateKeyToAccount } from 'viem/accounts';
import { bytesToHex, parseTransaction } from 'viem';
import type {
    Address,
    Hex,
    PrivateKeyAccount,
    TransactionSerialized,
    TypedDataDefinition,
} from 'viem';
import * as Crypto from 'expo-crypto';

export interface Account {
    id: number;
    name?: string | undefined;
    address: Address;
    isHidden?: boolean;
}

export interface UseKeyringReturn {
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

const SEED_PHRASE_KEY = 'tlock_seed_phrase';
const ACCOUNTS_KEY = 'tlock_accounts';

export function useKeyring(): UseKeyringReturn {
    //? Stateful accounts variable for external use. Internally make sure to
    //? always use the _loadAccounts function to ensure data consistency.
    const [accounts, setAccounts] = useState<Account[]>([]);
    const secureStorage = useSecureStorage();

    useEffect(() => {
        _loadAccounts().catch(() => {
            console.warn('Failed to load accounts');
        });
    }, []);

    const getSeedPhrase = async (): Promise<string> => {
        const seedPhrase = await secureStorage.getItem(SEED_PHRASE_KEY, true);
        if (!seedPhrase) {
            throw new Error('No seed phrase found');
        }
        return seedPhrase;
    };

    const generateSeedPhrase = async (
        override: boolean = false,
    ): Promise<string> => {
        const existingSeedPhrase = await secureStorage.getItem(
            SEED_PHRASE_KEY,
            true,
        );
        if (existingSeedPhrase && !override) {
            throw new Error(
                'Seed phrase already exists. Use override to replace it.',
            );
        }

        const entropy = Crypto.getRandomBytes(16);
        const seedPhrase = entropyToMnemonic(Buffer.from(entropy));
        if (!seedPhrase) {
            throw new Error('No seed phrase generated');
        }
        await secureStorage.setItem(SEED_PHRASE_KEY, seedPhrase, false);

        // Reset accounts
        await _saveAccounts([]);
        setAccounts([]);

        return seedPhrase;
    };

    const addAccount = async (): Promise<Address> => {
        const newAccountId = accounts.length + 1;
        const address = await _deriveAddress(newAccountId);

        const newAccount: Account = {
            id: newAccountId,
            address,
        };

        const newAccounts = [...accounts, newAccount];
        await _saveAccounts(newAccounts);
        setAccounts(newAccounts);

        return address;
    };

    const renameAccount = async (
        address: Address,
        name: string,
    ): Promise<void> => {
        const updatedAccounts = accounts.map((account) =>
            account.address === address ? { ...account, name } : account,
        );
        await _saveAccounts(updatedAccounts);
        setAccounts(updatedAccounts);
    };

    const hideAccount = async (
        address: Address,
        hide: boolean,
    ): Promise<void> => {
        const updatedAccounts = accounts.map((account) =>
            account.address === address
                ? { ...account, isHidden: hide }
                : account,
        );
        await _saveAccounts(updatedAccounts);
        setAccounts(updatedAccounts);
    };

    const sign = async (from: Address, hash: Hex): Promise<Hex> => {
        const account = await _getAccountFromAddress(from);
        return await account.sign({ hash });
    };

    const signPersonal = async (from: Address, raw: Hex): Promise<Hex> => {
        const account = await _getAccountFromAddress(from);
        return await account.signMessage({ message: { raw } });
    };

    const signTypedData = async (
        from: Address,
        data: TypedDataDefinition,
    ): Promise<Hex> => {
        const account = await _getAccountFromAddress(from);
        return await account.signTypedData(data);
    };

    const signTransaction = async (
        from: Address,
        transaction: Hex,
    ): Promise<TransactionSerialized> => {
        const account = await _getAccountFromAddress(from);
        const parsed = parseTransaction(transaction);
        const signedTransaction = await account.signTransaction(parsed);
        return signedTransaction;
    };

    const _loadAccounts = async (): Promise<Account[]> => {
        const accountsStr = await secureStorage.getItem(ACCOUNTS_KEY, false);

        let accounts: Account[] = [];
        if (accountsStr) {
            accounts = JSON.parse(accountsStr) as Account[];
        }
        setAccounts(accounts);
        return accounts;
    };

    const _saveAccounts = async (accounts: Account[]): Promise<void> => {
        setAccounts(accounts);
        await secureStorage.setItem(
            ACCOUNTS_KEY,
            JSON.stringify(accounts),
            false,
        );
    };

    const _getAccountFromAddress = async (
        address: Address,
    ): Promise<PrivateKeyAccount> => {
        const account = accounts.find(
            (account) =>
                account.address.toLowerCase() === address.toLowerCase(),
        );
        if (!account) {
            throw new Error(`Account with address ${address} not found`);
        }

        const privateKey = await _getPrivateKey(account.id);
        return privateKeyToAccount(privateKey);
    };

    const _deriveAddress = async (accountId: number): Promise<Address> => {
        const privateKey = await _getPrivateKey(accountId);
        try {
            const account = privateKeyToAccount(privateKey);
            return account.address;
        } catch (_error) {
            // ? Should never be thrown, just here to prevent data leaks
            throw new Error('Failed to derive address');
        }
    };

    const _getPrivateKey = async (accountId: number): Promise<Hex> => {
        const seedPhrase = await getSeedPhrase();
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
    };

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
    };
}
