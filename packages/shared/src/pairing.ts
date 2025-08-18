import { SharedSecret } from './crypto';
import { QrCodeDataSchema } from './validation';

export interface QrCodeData {
    version: number;
    sharedSecret: SharedSecret;
    pairRequestId: string;
}

export const QR_VERSION = 1;
export const QR_PROTOCOL = 'lodgelock';
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
            `Invalid QR code format: Expected '${expectedPrefix}' prefix but got: ${qrCode.substring(0, 50)}...`,
        );
    }

    const encodedData = qrCode.slice(expectedPrefix.length);

    let rawData: unknown;
    try {
        rawData = JSON.parse(atob(encodedData));
    } catch (_error) {
        throw new Error(
            'Invalid QR code: Unable to decode or parse QR code data',
        );
    }

    // Validate using zod schema
    const parseResult = QrCodeDataSchema.safeParse(rawData);
    if (!parseResult.success) {
        const errorDetails = parseResult.error.issues
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join(', ');
        throw new Error(`Invalid QR code data: ${errorDetails}`);
    }

    const qrData = parseResult.data;

    if (qrData.version !== QR_VERSION) {
        throw new Error(
            `Unsupported QR code version: ${qrData.version} (expected ${QR_VERSION})`,
        );
    }

    return qrData;
}
