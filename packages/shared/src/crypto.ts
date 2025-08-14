import { sha256 } from 'viem';
import { z } from 'zod';

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
    validationSchema?: z.ZodSchema<T>,
): T {
    const decrypted = JSON.parse(encryptedMessage) as T;

    // If validation schema is provided, validate the decrypted data
    if (validationSchema) {
        const result = validationSchema.safeParse(decrypted);
        if (!result.success) {
            const errorDetails = result.error.issues
                .map(issue => `${issue.path.join('.')}: ${issue.message}`)
                .join(', ');
            throw new Error(`Decrypted message validation failed: ${errorDetails}`);
        }
        return result.data;
    }

    return decrypted;
}

function generateSecureRandom(length: number): number[] {
    const bytes = new Uint32Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes);
}
