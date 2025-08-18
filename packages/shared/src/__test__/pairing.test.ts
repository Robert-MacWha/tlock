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
            "Invalid QR code format: Expected 'lodgelock://pair/' prefix but got: invalid://pair/someData...",
        );
    });

    it('should throw an error for unsupported QR code version', () => {
        const invalidQrCode =
            'lodgelock://pair/' +
            btoa(
                JSON.stringify({
                    version: 2,
                    sharedSecret: generateSharedSecret(),
                    pairRequestId: 'test-id',
                }),
            );
        expect(() => parseQrCode(invalidQrCode)).toThrow(
            'Unsupported QR code version: 2 (expected 1)',
        );
    });

    it('should throw an error for invalid shared secret in QR code', () => {
        const invalidQrCode =
            'lodgelock://pair/' +
            btoa(
                JSON.stringify({
                    version: 1,
                    sharedSecret: 'invalidSharedSecret',
                    pairRequestId: 'test-id',
                }),
            );
        expect(() => parseQrCode(invalidQrCode)).toThrow(
            'Invalid QR code data: sharedSecret: Invalid input: expected array, received string, sharedSecret: SharedSecret must be exactly 32 numbers',
        );
    });

    it('should throw an error for malformed base64 in QR code', () => {
        const invalidQrCode = 'lodgelock://pair/invalidBase64!!!';
        expect(() => parseQrCode(invalidQrCode)).toThrow(
            'Invalid QR code: Unable to decode or parse QR code data',
        );
    });

    it('should throw an error for invalid JSON in QR code', () => {
        const invalidQrCode = 'lodgelock://pair/' + btoa('{ invalid json }');
        expect(() => parseQrCode(invalidQrCode)).toThrow(
            'Invalid QR code: Unable to decode or parse QR code data',
        );
    });

    it('should throw an error for missing required fields in QR code', () => {
        const invalidQrCode =
            'lodgelock://pair/' + btoa(JSON.stringify({ version: 1 }));
        expect(() => parseQrCode(invalidQrCode)).toThrow(
            'Invalid QR code data',
        );
    });

    it('should throw an error for invalid shared secret', () => {
        const invalidQrCode =
            'lodgelock://pair/' +
            btoa(
                JSON.stringify({
                    version: 1,
                    sharedSecret: [1, 2, 3], // Too short
                    pairRequestId: 'test-id',
                }),
            );
        expect(() => parseQrCode(invalidQrCode)).toThrow(
            'Invalid QR code data: sharedSecret: SharedSecret must be exactly 32 numbers',
        );
    });
});
