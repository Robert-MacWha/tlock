export const SHARED_SECRET_LENGTH = 32;
export const ROOM_ID_LENGTH = 32;
export const ROOM_ID_PATTERN = /^[0-9A-F]{32}$/;

export function generateSecureRandom(length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
}

export async function deriveRoomId(sharedSecret: Uint8Array): Promise<string> {
    const hash = await crypto.subtle.digest('SHA-256', sharedSecret);
    const roomIdBytes = new Uint8Array(hash.slice(0, 16)); // 128 bits

    return Array.from(roomIdBytes, byte =>
        byte.toString(16).padStart(2, '0')
    ).join('').toUpperCase();
}

export function isValidRoomId(roomId: string): boolean {
    return ROOM_ID_PATTERN.test(roomId);
}

export function isValidSharedSecret(sharedSecret: number[]): boolean {
    return Array.isArray(sharedSecret) &&
        sharedSecret.length === SHARED_SECRET_LENGTH &&
        sharedSecret.every(num => Number.isInteger(num) && num >= 0 && num <= 255);
}

export function encryptMessage<T>(message: T, sharedSecret: number[]): string {
    // TODO: Implement actual encryption logic
    return JSON.stringify(message);
}

export function decryptMessage<T>(encryptedMessage: string, sharedSecret: number[]): T {
    // TODO: Implement actual decryption logic
    return JSON.parse(encryptedMessage);
}