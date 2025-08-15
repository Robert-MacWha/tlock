import { decryptMessage, generateSharedSecret } from '../crypto';
import { PairRequestSchema } from '../validation';

describe('decryptMessage validation', () => {
    const sharedSecret = generateSharedSecret();

    it('should decrypt valid JSON without validation', () => {
        const data = {
            status: 'pending',
            fcmToken: 'token',
            deviceName: 'device',
        };
        const encrypted = JSON.stringify(data);

        const result = decryptMessage(encrypted, sharedSecret);
        expect(result).toEqual(data);
    });

    it('should decrypt and validate with schema', () => {
        const validData = {
            status: 'pending',
            fcmToken: 'token',
            deviceName: 'device',
        };
        const encrypted = JSON.stringify(validData);

        const result = decryptMessage(
            encrypted,
            sharedSecret,
            PairRequestSchema,
        );
        expect(result).toEqual(validData);
    });

    it('should throw validation error for invalid data', () => {
        const invalidData = { status: 'invalid-status' };
        const encrypted = JSON.stringify(invalidData);

        expect(() =>
            decryptMessage(encrypted, sharedSecret, PairRequestSchema),
        ).toThrow('Decrypted message validation failed');
    });

    it('should throw error for invalid JSON', () => {
        expect(() => decryptMessage('{ invalid json }', sharedSecret)).toThrow(
            /JSON at position 2/,
        );
    });
});
