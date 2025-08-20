import { sha256 } from 'viem';
import { z } from 'zod';
import * as nacl from 'tweetnacl';

export type SharedSecret = number[];

export const SHARED_SECRET_LENGTH = 32;
export const ROOM_ID_LENGTH = 32;
export const ROOM_ID_PATTERN = /^[0-9A-F]{32}$/;

function getRandomBytes(length: number): Uint8Array {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
}

export function generateSharedSecret(): SharedSecret {
    const sharedSecret = getRandomBytes(SHARED_SECRET_LENGTH);
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
    sharedSecret: SharedSecret,
): string {
    const messageString = JSON.stringify(message);
    const messageBytes = new TextEncoder().encode(messageString);
    const nonce = getRandomBytes(24);
    const key = new Uint8Array(sharedSecret.slice(0, 32));

    const encrypted = nacl.secretbox(messageBytes, nonce, key);

    const result = new Uint8Array(nonce.length + encrypted.length);
    result.set(nonce);
    result.set(encrypted, nonce.length);

    return btoa(String.fromCharCode(...result));
}

export function decryptMessage<T>(
    encryptedMessage: string,
    sharedSecret: SharedSecret,
    validationSchema?: z.ZodTypeAny,
): T {
    try {
        const data = new Uint8Array(
            atob(encryptedMessage)
                .split('')
                .map((char) => char.charCodeAt(0)),
        );

        const nonce = data.slice(0, 24);
        const encrypted = data.slice(24);
        const key = new Uint8Array(sharedSecret.slice(0, 32));

        const decryptedBytes = nacl.secretbox.open(encrypted, nonce, key);
        if (!decryptedBytes) {
            throw new Error('Failed to decrypt message');
        }

        const decryptedText = new TextDecoder().decode(decryptedBytes);
        const decrypted = JSON.parse(decryptedText) as T;

        if (validationSchema) {
            const result = validationSchema.safeParse(decrypted);
            if (!result.success) {
                const errorDetails = result.error.issues
                    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
                    .join(', ');
                throw new Error(
                    `Decrypted message validation failed: ${errorDetails}`,
                );
            }
            return result.data as T;
        }

        return decrypted;
    } catch (error) {
        throw new Error(
            `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
}
