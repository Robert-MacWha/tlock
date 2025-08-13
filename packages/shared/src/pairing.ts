import { SharedSecret, isValidSharedSecret } from './crypto';

export interface QrCodeData {
    version: number;
    sharedSecret: SharedSecret;
    pairRequestId: string;
}

export const QR_VERSION = 1;
export const QR_PROTOCOL = 'tlock';
export const QR_ACTION = 'pair';

export function createQrCode(
    sharedSecret: SharedSecret,
    pairRequestId: string,
): string {
    const qrData: QrCodeData = {
        version: QR_VERSION,
        sharedSecret,
        pairRequestId,
    };

    const encodedData = btoa(JSON.stringify(qrData));
    return `${QR_PROTOCOL}://${QR_ACTION}/${encodedData}`;
}

export function parseQrCode(qrCode: string): QrCodeData {
    const expectedPrefix = `${QR_PROTOCOL}://${QR_ACTION}/`;

    if (!qrCode.startsWith(expectedPrefix)) {
        throw new Error(
            'Expected QR code to start with ' +
            expectedPrefix +
            ' but got: ' +
            qrCode,
        );
    }

    const encodedData = qrCode.slice(expectedPrefix.length);
    const qrData = JSON.parse(atob(encodedData)) as QrCodeData;

    if (qrData.version !== QR_VERSION) {
        throw new Error('Unsupported QR code version');
    }

    if (!isValidSharedSecret(qrData.sharedSecret)) {
        throw new Error(
            `Invalid shared secret in QR code: ${qrData.sharedSecret.toString()}`,
        );
    }

    return qrData;
}
