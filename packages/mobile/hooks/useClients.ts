import * as SecureStore from 'expo-secure-store';
import {
    createClient,
    Client,
    SharedSecret,
    DEFAULT_FIREBASE_URL,
} from '@tlock/shared';
import { useEffect, useState } from 'react';
import { randomUUID } from 'expo-crypto';

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
    const [clients, setClients] = useState<ClientInstance[]>([]);
    const [firebaseUrl, setFirebaseUrlState] =
        useState<string>(DEFAULT_FIREBASE_URL);

    useEffect(() => {
        loadFirebaseUrl();
    }, []);

    useEffect(() => {
        if (firebaseUrl) {
            loadClients();
        }
    }, [firebaseUrl]);

    const saveClients = (clientsToSave: ClientInstance[] = clients) => {
        const savedClients: SavedClient[] = clientsToSave.map((client) => ({
            id: client.id,
            name: client.name,
            sharedSecret: client.sharedSecret,
        }));

        SecureStore.setItem(CLIENTS_KEY, JSON.stringify(savedClients));
    };

    const loadFirebaseUrl = () => {
        const savedUrl = SecureStore.getItem(FIREBASE_URL_KEY);
        if (savedUrl) {
            setFirebaseUrlState(savedUrl);
        } else {
            setFirebaseUrlState(DEFAULT_FIREBASE_URL);
        }
    };

    const loadClients = () => {
        const savedClients = SecureStore.getItem(CLIENTS_KEY);
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

    const addClient = (
        sharedSecret: SharedSecret,
        name?: string,
    ): ClientInstance => {
        const client = createClient(sharedSecret, undefined, firebaseUrl);
        const newClient: ClientInstance = {
            id: randomUUID(),
            name,
            sharedSecret,
            client,
        };

        const updatedClients = [...clients, newClient];
        setClients(updatedClients);
        saveClients(updatedClients);

        return newClient;
    };

    const removeClient = (clientId: string) => {
        const updatedClients = clients.filter(
            (client) => client.id !== clientId,
        );
        setClients(updatedClients);
        saveClients(updatedClients);
    };

    const setClientName = (clientId: string, name: string) => {
        const updatedClients = clients.map((client) => {
            if (client.id === clientId) {
                return { ...client, name };
            }
            return client;
        });

        setClients(updatedClients);
        saveClients(updatedClients);
    };

    const setFirebaseUrl = (url: string) => {
        //? useEffect automatically reloads clients with new URL
        setFirebaseUrlState(url);
        SecureStore.setItem(FIREBASE_URL_KEY, url, {
            requireAuthentication: true,
        });
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
