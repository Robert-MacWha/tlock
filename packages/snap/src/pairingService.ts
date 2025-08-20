import {
    createQrCode,
    generateSharedSecret,
    createClient,
    PairRequest,
    type Client,
    type SharedSecret,
} from '@lodgelock/shared';
import qrcode from 'qrcode';
import { updateState, getState } from './state';
import { POLL_INTERVAL } from './constants';

export interface PairingQrData {
    qrData: string;
    qrSrc: string;
    requestId: string;
    sharedSecret: SharedSecret;
}

export class PairingService {
    async start(): Promise<PairingQrData> {
        const sharedSecret = generateSharedSecret();
        const state = await getState();
        const client = createClient(
            sharedSecret,
            undefined,
            state?.firebaseUrl,
        );

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
    }

    async waitForPairing(
        requestId: string,
        client: Client,
        sharedSecret: SharedSecret,
        timeoutSeconds = 300,
    ): Promise<PairRequest> {
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
    }
}
