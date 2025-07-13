import { generateSecureRandom, isValidSharedSecret, SHARED_SECRET_LENGTH } from "./crypto";

export interface QrCodeData {
    sharedSecret: SharedSecret;
    version: number;
}

// Device registration data sent to firebase during pairing
export interface DeviceRegistration {
    fcmToken: string;
    deviceName: string;
}

export type SharedSecret = number[];

export const QR_VERSION = 1;
export const QR_PROTOCOL = "tlock";
export const QR_ACTION = "pair";
export const FIREBASE_URL = "https://tlock-974e6-default-rtdb.firebaseio.com/"
export const CLOUD_FUNCTION_URL = "https://sendnotification-clnhgoo57a-uc.a.run.app";

export async function generateSharedSecret(): Promise<SharedSecret> {
    const sharedSecret = generateSecureRandom(SHARED_SECRET_LENGTH);
    return Array.from(sharedSecret);
}

export async function createQrCode(sharedSecret: SharedSecret): Promise<string> {
    const qrData: QrCodeData = {
        sharedSecret,
        version: QR_VERSION
    };

    const encodedData = btoa(JSON.stringify(qrData));
    return `${QR_PROTOCOL}://${QR_ACTION}/${encodedData}`;
}

export async function parseQrCode(qrCode: string): Promise<SharedSecret> {
    const expectedPrefix = `${QR_PROTOCOL}://${QR_ACTION}/`;

    if (!qrCode.startsWith(expectedPrefix)) {
        throw new Error("Expected QR code to start with " + expectedPrefix + " but got: " + qrCode);
    }

    const encodedData = qrCode.slice(expectedPrefix.length);
    const qrData: QrCodeData = JSON.parse(atob(encodedData));

    if (qrData.version !== QR_VERSION) {
        throw new Error("Unsupported QR code version");
    }

    if (!isValidSharedSecret(qrData.sharedSecret)) {
        throw new Error("Invalid shared secret in QR code");
    }

    return qrData.sharedSecret;
}
