import { HttpClient } from "../http";

export class MockHttpClient implements HttpClient {
    private storage = new Map<string, any>();
    private postCalls: Array<{ url: string; data: any }> = [];

    async get<T>(url: string, path: string): Promise<T | null> {
        return this.storage.get(path) || null;
    }

    async put<T>(url: string, path: string, data: any): Promise<void> {
        this.storage.set(path, data);
    }

    async delete(url: string, path: string): Promise<void> {
        this.storage.delete(path);
    }

    async post<T>(url: string, data: any): Promise<T> {
        this.postCalls.push({ url, data });
        return { success: true } as T;
    }

    // Test helpers
    clear(): void {
        this.storage.clear();
        this.postCalls = [];
    }

    getStoredData(path: string): any {
        return this.storage.get(path);
    }

    setStoredData(path: string, data: any): void {
        this.storage.set(path, data);
    }

    getPostCalls(): Array<{ url: string; data: any }> {
        return [...this.postCalls];
    }

    hasPath(path: string): boolean {
        return this.storage.has(path);
    }
}