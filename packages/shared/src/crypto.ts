import { randomBytes } from '@noble/hashes/utils';
import { sha256 } from '@noble/hashes/sha2';

export const SHARED_SECRET_LENGTH = 32;
export const ROOM_ID_LENGTH = 32;
export const ROOM_ID_PATTERN = /^[0-9A-F]{32}$/;

export function generateSecureRandom(length: number): number[] {
    const bytes = randomBytes(length);
    return Array.from(bytes);
}


export function deriveRoomId(sharedSecret: number[]): string {
    const secretBytes = new Uint8Array(sharedSecret);

    const hash = sha256(secretBytes);
    const hexHash = Array.from(hash, byte =>
        byte.toString(16).padStart(2, '0')
    ).join('');

    return hexHash.substring(0, 32).toUpperCase();
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