import {
    createQrCode,
    generateSharedSecret,
    createClient,
    PairRequest,
    type Client,
    type SharedSecret,
} from '@tlock/shared';
import qrcode from 'qrcode';
import { updateState } from './state';
import { POLL_INTERVAL, ERROR_CODES } from './constants';
import { throwError } from './errors';

export interface PairingQrData {
    qrData: string;
    qrSrc: string;
    requestId: string;
    sharedSecret: SharedSecret;
}

export class PairingService {
    private client?: Client | undefined;

    constructor(client?: Client) {
        this.client = client;
    }

    async startPairing(): Promise<PairingQrData> {
        try {
            const sharedSecret = generateSharedSecret();
            const client = this.client ?? createClient(sharedSecret);

            const requestId = await client.submitRequest('pair', {
                status: 'pending',
                fcmToken: '',
                deviceName: '',
            });

            await updateState({
                sharedSecret,
            });

            const qrData = createQrCode(sharedSecret, requestId);
            const qrSrc = await qrcode.toString(qrData);

            return {
                qrData,
                qrSrc,
                requestId,
                sharedSecret,
            };
        } catch (error: unknown) {
            const err = error as Error;
            throwError(
                ERROR_CODES.PAIRING_FAILED,
                'Error generating pairing data',
                err,
            );
        }
    }

    async waitForPairing(
        requestId: string,
        client: Client,
        sharedSecret: SharedSecret,
        timeoutSeconds = 300,
    ): Promise<PairRequest> {
        try {
            const response = await client.pollUntil(
                requestId,
                'pair',
                POLL_INTERVAL,
                timeoutSeconds,
                (resp) => {
                    return resp.status !== 'pending';
                },
            );

            // If pairing was successful, save the pairing data
            if (response.status === 'approved') {
                await updateState({
                    sharedSecret,
                    fcmToken: response.fcmToken,
                    deviceName: response.deviceName,
                });
            }

            return response;
        } catch (error: unknown) {
            const err = error as Error;
            throwError(
                ERROR_CODES.PAIRING_FAILED,
                'Pairing timed out or failed',
                err,
            );
        }
    }
}
