export interface HttpClient {
    get<T>(url: string, path: string): Promise<T | null>;
    put(url: string, path: string, data: unknown): Promise<void>;
    delete(url: string, path: string): Promise<void>;
}

export class FirebaseHttpClient implements HttpClient {
    async get<T>(url: string, path: string): Promise<T | null> {
        const response = await fetch(`${url}${path}.json`);

        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`GET ${path} failed: ${response.status}`);
        }

        return response.json() as Promise<T>;
    }

    async put(url: string, path: string, data: unknown): Promise<void> {
        const response = await fetch(`${url}${path}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `PUT ${path} failed: [${response.status}] ${errorText}`,
            );
        }
    }

    async delete(url: string, path: string): Promise<void> {
        const response = await fetch(`${url}${path}.json`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok && response.status !== 404) {
            throw new Error(`DELETE ${path} failed: ${response.status}`);
        }
    }
}
