import { generateSharedSecret } from "../crypto";
import { createQrCode, parseQrCode } from "../pairing";

describe('pairing', () => {
    it('should generated a valid pairing code', async () => {
        const sharedSecret = generateSharedSecret();
        const qrCode = await createQrCode(sharedSecret);
        const parsedSecret = await parseQrCode(qrCode);
        expect(parsedSecret).toEqual(sharedSecret);
    })
});