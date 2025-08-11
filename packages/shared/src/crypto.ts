import { sha256 } from 'viem';

export type SharedSecret = number[];

export const SHARED_SECRET_LENGTH = 32;
export const ROOM_ID_LENGTH = 32;
export const ROOM_ID_PATTERN = /^[0-9A-F]{32}$/;

export function generateSharedSecret(): SharedSecret {
    const sharedSecret = generateSecureRandom(SHARED_SECRET_LENGTH);
    return Array.from(sharedSecret);
}

export function isValidSharedSecret(sharedSecret: SharedSecret): boolean {
    return (
        Array.isArray(sharedSecret) &&
        sharedSecret.length === SHARED_SECRET_LENGTH &&
        sharedSecret.every((num) => Number.isInteger(num))
    );
}

export function deriveRoomId(sharedSecret: SharedSecret): string {
    const secretBytes = new Uint8Array(sharedSecret);

    const hash = sha256(secretBytes);
    return hash.substring(2, 34).toUpperCase();
}

export function encryptMessage<T>(
    message: T,
    _sharedSecret: SharedSecret,
): string {
    // TODO: Implement actual encryption logic
    return JSON.stringify(message);
}

export function decryptMessage<T>(
    encryptedMessage: string,
    _sharedSecret: SharedSecret,
): T {
    // TODO: Implement actual decryption logic
    return JSON.parse(encryptedMessage) as T;
}

function generateSecureRandom(length: number): number[] {
    const bytes = new Uint32Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes);
}
