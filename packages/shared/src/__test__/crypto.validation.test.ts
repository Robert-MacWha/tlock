import {
    decryptMessage,
    encryptMessage,
    generateSharedSecret,
} from '../crypto';
import { PairRequestSchema } from '../validation';

describe('decryptMessage validation', () => {
    const sharedSecret = generateSharedSecret();

    it('should decrypt valid JSON without validation', () => {
        const data = {
            status: 'pending',
            fcmToken: 'token',
            deviceName: 'device',
        };
        const encrypted = encryptMessage(data, sharedSecret);

        const result = decryptMessage(encrypted, sharedSecret);
        expect(result).toEqual(data);
    });

    it('should decrypt and validate with schema', () => {
        const validData = {
            status: 'pending',
            fcmToken: 'token',
            deviceName: 'device',
        };
        const encrypted = encryptMessage(validData, sharedSecret);

        const result = decryptMessage(
            encrypted,
            sharedSecret,
            PairRequestSchema,
        );
        expect(result).toEqual(validData);
    });

    it('should throw validation error for invalid data', () => {
        const invalidData = { status: 'invalid-status' };
        const encrypted = encryptMessage(invalidData, sharedSecret);

        expect(() =>
            decryptMessage(encrypted, sharedSecret, PairRequestSchema),
        ).toThrow('Decrypted message validation failed');
    });

    it('should throw error for invalid encrypted data', () => {
        expect(() =>
            decryptMessage('invalid-encrypted-data', sharedSecret),
        ).toThrow('Decryption failed');
    });
});
