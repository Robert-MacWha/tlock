import { deriveRoomId, generateSharedSecret, isValidSharedSecret, SharedSecret } from "../crypto"

describe('crypto', () => {
    describe('sharedSecret', () => {
        it('should generate a valid shared secret', () => {
            const secret = generateSharedSecret();
            const isValid = isValidSharedSecret(secret);
            expect(isValid).toBe(true);
        });

        it('should derive a room ID', () => {
            const secret: SharedSecret = [
                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
                17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32
            ];

            const expectedRoomId = 'AE216C2EF5247A3782C135EFA279A3E4';

            const roomId = deriveRoomId(secret);
            expect(roomId).toBe(expectedRoomId);
        });

        it('should encrypt and decrypt data correctly', () => {
            const data = { message: "Hello, World!" };

            const encryptedData = Buffer.from(JSON.stringify(data)).toString('base64');
            const decryptedData: unknown = JSON.parse(Buffer.from(encryptedData, 'base64').toString());

            expect(decryptedData).toEqual(data);
        });
    });
})