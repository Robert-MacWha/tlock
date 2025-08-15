import {
    createClient,
    Client,
    SharedSecret,
    DEFAULT_FIREBASE_URL,
} from '@tlock/shared';
import { useEffect, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import { useSecureStorage } from './useSecureStorage';

interface SavedClient {
    id: string;
    name?: string | undefined;
    sharedSecret: SharedSecret;
}

export interface ClientInstance {
    id: string;
    name?: string | undefined;
    sharedSecret: SharedSecret;
    client: Client;
}

const CLIENTS_KEY = 'tlock_clients';
const FIREBASE_URL_KEY = 'tlock_firebase_url';

export function useClients() {
    const secureStorage = useSecureStorage();
    const [clients, setClients] = useState<ClientInstance[]>([]);
    const [firebaseUrl, setFirebaseUrlState] =
        useState<string>(DEFAULT_FIREBASE_URL);

    useEffect(() => {
        void loadFirebaseUrl();
    }, []);

    useEffect(() => {
        if (firebaseUrl) {
            void loadClients();
        }
    }, [firebaseUrl]);

    const saveClients = async (clientsToSave: ClientInstance[] = clients) => {
        const savedClients: SavedClient[] = clientsToSave.map((client) => ({
            id: client.id,
            name: client.name,
            sharedSecret: client.sharedSecret,
        }));

        await secureStorage.setItem(CLIENTS_KEY, JSON.stringify(savedClients), true);
    };

    const loadFirebaseUrl = async () => {
        const savedUrl = await secureStorage.getItem(FIREBASE_URL_KEY);
        if (savedUrl) {
            setFirebaseUrlState(savedUrl);
        } else {
            setFirebaseUrlState(DEFAULT_FIREBASE_URL);
        }
    };

    const loadClients = async () => {
        const savedClients = await secureStorage.getItem(CLIENTS_KEY);
        if (savedClients) {
            const data = JSON.parse(savedClients) as ClientInstance[];
            const loadedClients: ClientInstance[] = data.map((client) => ({
                ...client,
                client: createClient(
                    client.sharedSecret,
                    undefined,
                    firebaseUrl,
                ),
            }));

            setClients(loadedClients);
        }
    };

    const addClient = async (
        sharedSecret: SharedSecret,
        name?: string,
    ): Promise<ClientInstance> => {
        const client = createClient(sharedSecret, undefined, firebaseUrl);
        const newClient: ClientInstance = {
            id: randomUUID(),
            name,
            sharedSecret,
            client,
        };

        const updatedClients = [...clients, newClient];
        setClients(updatedClients);
        await saveClients(updatedClients);

        return newClient;
    };

    const removeClient = async (clientId: string) => {
        const updatedClients = clients.filter(
            (client) => client.id !== clientId,
        );
        setClients(updatedClients);
        await saveClients(updatedClients);
    };

    const setClientName = async (clientId: string, name: string) => {
        const updatedClients = clients.map((client) => {
            if (client.id === clientId) {
                return { ...client, name };
            }
            return client;
        });

        setClients(updatedClients);
        await saveClients(updatedClients);
    };

    const setFirebaseUrl = async (url: string) => {
        //? useEffect automatically reloads clients with new URL
        setFirebaseUrlState(url);
        await secureStorage.setItem(FIREBASE_URL_KEY, url, true);
    };

    return {
        clients,
        firebaseUrl,
        addClient,
        removeClient,
        setClientName,
        setFirebaseUrl,
    };
}
