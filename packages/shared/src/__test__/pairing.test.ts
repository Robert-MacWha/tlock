import { generateSharedSecret } from '../crypto';
import { createQrCode, parseQrCode } from '../pairing';

describe('pairing', () => {
    it('should generated a valid pairing code', async () => {
        const sharedSecret = generateSharedSecret();
        const pairRequestId = 'test-request-id';
        const qrCode = createQrCode(sharedSecret, pairRequestId);
        const qrData = parseQrCode(qrCode);
        expect(qrData).toEqual({
            version: 1,
            sharedSecret,
            pairRequestId,
        });
    });

    it('should throw an error for invalid QR code prefix', () => {
        const invalidQrCode = 'invalid://pair/someData';
        expect(() => parseQrCode(invalidQrCode)).toThrow(
            'Expected QR code to start with tlock://pair/ but got: invalid://pair/someData',
        );
    });

    it('should throw an error for unsupported QR code version', () => {
        const invalidQrCode =
            'tlock://pair/' +
            btoa(
                JSON.stringify({
                    version: 2,
                    sharedSecret: generateSharedSecret(),
                }),
            );
        expect(() => parseQrCode(invalidQrCode)).toThrow(
            'Unsupported QR code version',
        );
    });

    it('should throw an error for invalid shared secret in QR code', () => {
        const invalidQrCode =
            'tlock://pair/' +
            btoa(
                JSON.stringify({
                    version: 1,
                    sharedSecret: 'invalidSharedSecret',
                }),
            );
        expect(() => parseQrCode(invalidQrCode)).toThrow(
            'Invalid shared secret in QR code: invalidSharedSecret',
        );
    });
});
