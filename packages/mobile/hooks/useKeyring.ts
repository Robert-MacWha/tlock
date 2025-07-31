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
const ACCOUNT_COUNTER_KEY = 'tlock_account_counter';
const ACCOUNTS_KEY = 'tlock_accounts';

export function useKeyring() {
    const { authenticate } = useAuthenticator();

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

        console.log('Generated new seed phrase:', seedPhrase);
        await SecureStore.setItemAsync(SEED_PHRASE_KEY, seedPhrase);

        // Reset accounts and counter
        await setAccounts([]);
        await setAccountCounter(0);
        await SecureStore.setItemAsync(ACCOUNTS_KEY, JSON.stringify([]));
        await SecureStore.setItemAsync(ACCOUNT_COUNTER_KEY, '0');

        return seedPhrase;
    }

    const getAccounts = async (): Promise<Account[]> => {
        const accountsStr = await SecureStore.getItemAsync(ACCOUNTS_KEY);

        if (accountsStr) {
            return JSON.parse(accountsStr) as Account[];
        }
        return [];
    };

    const addAccount = async (): Promise<Address> => {
        console.log('Adding new account...');

        const accounts = await getAccounts();
        const newAccountId = await _getAccountCounter() + 1;
        const address = await _deriveAddress(newAccountId);

        const newAccount: Account = {
            id: newAccountId,
            address
        };

        const newAccounts = [...accounts, newAccount];
        await setAccounts(newAccounts);
        await setAccountCounter(newAccountId);

        return address;
    };

    const renameAccount = async (address: Address, name: string): Promise<void> => {
        const accounts = await getAccounts();
        const updatedAccounts = accounts.map(account =>
            account.address === address ? { ...account, name } : account
        );
        await setAccounts(updatedAccounts);
    };

    const hideAccount = async (address: Address, hide: boolean): Promise<void> => {
        const accounts = await getAccounts();
        const updatedAccounts = accounts.map(account =>
            account.address === address ? { ...account, isHidden: hide } : account
        );
        await setAccounts(updatedAccounts);
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

    const _getAccountCounter = async (): Promise<number> => {
        const counterStr = await SecureStore.getItemAsync(ACCOUNT_COUNTER_KEY);
        if (counterStr) {
            return parseInt(counterStr, 10);
        }
        return 0;
    };

    const _getAccountFromAddress = async (address: Address): Promise<PrivateKeyAccount> => {
        try {
            const accounts = await getAccounts();
            const account = accounts.find(account => account.address.toLowerCase() === address.toLowerCase());
            if (!account) {
                throw new Error(`Account with address ${address} not found`);
            }

            const privateKey = await _getPrivateKey(account.id);
            return privateKeyToAccount(privateKey);
        } catch (error) {
            console.error('Error getting account from address:', error);
            throw new Error(`Failed to get account from address: ${address}`);
        }
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
        getSeedPhrase,
        generateSeedPhrase,
        getAccounts,
        renameAccount,
        hideAccount,
        addAccount,
        sign,
        signPersonal,
        signTypedData,
        signTransaction,
    }
}

const setAccounts = async (accounts: Account[]) => {
    await SecureStore.setItemAsync(ACCOUNTS_KEY, JSON.stringify(accounts));
}

const setAccountCounter = async (counter: number) => {
    await SecureStore.setItemAsync(ACCOUNT_COUNTER_KEY, counter.toString());
}