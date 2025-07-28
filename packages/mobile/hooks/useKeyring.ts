import * as SecureStore from 'expo-secure-store';
import { generateMnemonic, mnemonicToSeed } from 'bip39';
import { HDKey } from '@scure/bip32';
import { privateKeyToAccount } from 'viem/accounts';
import { bytesToHex, parseTransaction } from 'viem';
import type { Address, Hex, PrivateKeyAccount, TransactionSerialized, TypedDataDefinition } from 'viem';
import { useAuthenticator } from './useAuthenticator';

export interface Account {
    id: number;
    address: Address;
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
            throw new Error('Seed phrase already exists. Use override to replace it.');
        }

        const seedPhrase = generateMnemonic();
        if (!seedPhrase) {
            throw new Error('Seed phrase cannot be empty');
        }

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

    const sign = async (from: Address, hash: Hex): Promise<Hex> => {
        const account = await _getAccountFromAddress(from);
        try {
            return await account.sign({ hash });
        } catch (error) {
            console.log(error);
            throw new Error(`Failed to sign hash: ${hash}`);
        }
    };

    const signPersonal = async (from: Address, raw: Hex): Promise<Hex> => {
        const account = await _getAccountFromAddress(from);
        try {
            return await account.signMessage({ message: { raw } });
        } catch (error) {
            console.log(error);
            throw new Error(`Failed to sign raw: ${raw}`);
        }
    }

    const signTypedData = async (from: Address, data: TypedDataDefinition): Promise<Hex> => {
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
        const privateKey = await _getPrivateKeyFromAddress(address);
        return privateKeyToAccount(privateKey);
    }

    const _getPrivateKeyFromAddress = async (address: Address): Promise<Hex> => {
        const accounts = await getAccounts();
        const account = accounts.find(account => account.address.toLowerCase() === address.toLowerCase());
        if (!account) {
            throw new Error(`Account with address ${address} not found`);
        }

        const privateKey = await _getPrivateKey(account.id);
        return privateKey;
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
            throw new Error('Failed to get private key');
        }
    }

    const _deriveAddress = async (accountId: number): Promise<Address> => {
        const privateKey = await _getPrivateKey(accountId);
        try {
            const account = privateKeyToAccount(privateKey);
            return account.address;
        } catch (_error) {
            throw new Error('Failed to derive address');
        }
    }

    return {
        getSeedPhrase,
        generateSeedPhrase,
        getAccounts,
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