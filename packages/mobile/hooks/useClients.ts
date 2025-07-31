import * as SecureStore from 'expo-secure-store';
import { createClient, Client, SharedSecret } from "@tlock/shared";
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

export function useClients() {
    const [clients, setClients] = useState<ClientInstance[]>([]);

    useEffect(() => {
        const initializeApp = async () => {
            await loadClients();
        }
        void initializeApp();
    }, []);

    const saveClients = async (clientsToSave: ClientInstance[] = clients) => {
        const savedClients: SavedClient[] = clientsToSave.map(client => ({
            id: client.id,
            name: client.name,
            sharedSecret: client.sharedSecret,
        }));

        await SecureStore.setItemAsync(CLIENTS_KEY, JSON.stringify(savedClients));
    }

    const loadClients = async () => {
        const savedClients = await SecureStore.getItemAsync(CLIENTS_KEY);
        if (savedClients) {
            const data = JSON.parse(savedClients) as ClientInstance[];
            const loadedClients: ClientInstance[] = data.map(client => ({
                ...client,
                client: createClient(client.sharedSecret),
            }));

            setClients(loadedClients);
        }
    }

    const addClient = async (sharedSecret: SharedSecret, name?: string): Promise<ClientInstance> => {
        const client = createClient(sharedSecret);
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
    }

    const removeClient = async (clientId: string) => {
        const updatedClients = clients.filter(client => client.id !== clientId);
        setClients(updatedClients);
        await saveClients(updatedClients);
    }

    const setClientName = async (clientId: string, name: string) => {
        const updatedClients = clients.map(client => {
            if (client.id === clientId) {
                return { ...client, name };
            }
            return client;
        });

        setClients(updatedClients);
        await saveClients(updatedClients);
    }

    return {
        clients,
        addClient,
        removeClient,
        setClientName,
    }
}