import { generateSharedSecret } from '../crypto';
import { createQrCode, parseQrCode } from '../pairing';

describe('pairing', () => {
    it('should generated a valid pairing code', async () => {
        const sharedSecret = generateSharedSecret();
        const pairRequestId = 'test-request-id';
        const qrCode = await createQrCode(sharedSecret, pairRequestId);
        const qrData = await parseQrCode(qrCode);
        expect(qrData).toEqual({
            version: 1,
            sharedSecret,
            pairRequestId,
        });
    });

    it('should throw an error for invalid QR code prefix', async () => {
        const invalidQrCode = 'invalid://pair/someData';
        await expect(parseQrCode(invalidQrCode)).rejects.toThrow(
            'Expected QR code to start with tlock://pair/ but got: invalid://pair/someData',
        );
    });

    it('should throw an error for unsupported QR code version', async () => {
        const invalidQrCode =
            'tlock://pair/' +
            btoa(
                JSON.stringify({
                    version: 2,
                    sharedSecret: generateSharedSecret(),
                }),
            );
        await expect(parseQrCode(invalidQrCode)).rejects.toThrow(
            'Unsupported QR code version',
        );
    });

    it('should throw an error for invalid shared secret in QR code', async () => {
        const invalidQrCode =
            'tlock://pair/' +
            btoa(
                JSON.stringify({
                    version: 1,
                    sharedSecret: 'invalidSharedSecret',
                }),
            );
        await expect(parseQrCode(invalidQrCode)).rejects.toThrow(
            'Invalid shared secret in QR code: invalidSharedSecret',
        );
    });
});
