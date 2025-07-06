import { deriveRoomId, generateSecureRandom, isValidSharedSecret, ROOM_ID_PATTERN, SHARED_SECRET_LENGTH } from "./crypto";

export interface PairingData {
    roomId: string;
    sharedSecret: number[];
}

export interface QrCodeData {
    sharedSecret: number[];
    version: number;
}

// Device registration data sent to firebase during pairing
export interface DeviceRegistration {
    fcmToken: string;
    deviceName: string;
}

export const QR_VERSION = 1;
export const QR_PROTOCOL = "tlock";
export const QR_ACTION = "pair";
export const FIREBASE_URL = "https://tlock-974e6-default-rtdb.firebaseio.com/"
export const CLOUD_FUNCTION_URL = "https://sendnotification-clnhgoo57a-uc.a.run.app";

export async function generatePairingData(): Promise<PairingData> {
    const sharedSecret = generateSecureRandom(SHARED_SECRET_LENGTH);
    const roomId = await deriveRoomId(sharedSecret);

    return {
        roomId,
        sharedSecret: Array.from(sharedSecret)
    };
}

export async function createQrCode(sharedSecret: number[]): Promise<string> {
    const qrData: QrCodeData = {
        sharedSecret,
        version: QR_VERSION
    };

    const encodedData = btoa(JSON.stringify(qrData));
    return `${QR_PROTOCOL}://${QR_ACTION}/${encodedData}`;
}

export async function parseQrCode(qrCode: string): Promise<PairingData> {
    const expectedPrefix = `${QR_PROTOCOL}://${QR_ACTION}/`;

    if (!qrCode.startsWith(expectedPrefix)) {
        throw new Error("Invalid QR code format");
    }

    const encodedData = qrCode.slice(expectedPrefix.length);
    const qrData: QrCodeData = JSON.parse(atob(encodedData));

    if (qrData.version !== QR_VERSION) {
        throw new Error("Unsupported QR code version");
    }

    if (!isValidSharedSecret(qrData.sharedSecret)) {
        throw new Error("Invalid shared secret in QR code");
    }

    const roomId = await deriveRoomId(new Uint8Array(qrData.sharedSecret));
    if (!ROOM_ID_PATTERN.test(roomId)) {
        throw new Error("Invalid room ID derived from shared secret");
    }

    return {
        roomId,
        sharedSecret: qrData.sharedSecret
    };
}
