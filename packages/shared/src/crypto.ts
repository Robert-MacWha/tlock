import { randomBytes } from '@noble/hashes/utils';
import { sha256 } from '@noble/hashes/sha2';

export type SharedSecret = number[];

export const SHARED_SECRET_LENGTH = 32;
export const ROOM_ID_LENGTH = 32;
export const ROOM_ID_PATTERN = /^[0-9A-F]{32}$/;

export function generateSharedSecret(): SharedSecret {
    const sharedSecret = generateSecureRandom(SHARED_SECRET_LENGTH);
    return Array.from(sharedSecret);
}

export function isValidSharedSecret(sharedSecret: SharedSecret): boolean {
    return Array.isArray(sharedSecret) &&
        sharedSecret.length === SHARED_SECRET_LENGTH &&
        sharedSecret.every(num => Number.isInteger(num) && num >= 0 && num <= 255);
}

export function deriveRoomId(sharedSecret: SharedSecret): string {
    const secretBytes = new Uint8Array(sharedSecret);

    const hash = sha256(secretBytes);
    const hexHash = Array.from(hash, byte =>
        byte.toString(16).padStart(2, '0')
    ).join('');

    return hexHash.substring(0, 32).toUpperCase();
}

export function encryptMessage<T>(message: T, sharedSecret: SharedSecret): string {
    // TODO: Implement actual encryption logic
    return JSON.stringify(message);
}

export function decryptMessage<T>(encryptedMessage: string, sharedSecret: SharedSecret): T {
    // TODO: Implement actual decryption logic
    return JSON.parse(encryptedMessage);
}

function generateSecureRandom(length: number): number[] {
    const bytes = randomBytes(length);
    return Array.from(bytes);
}