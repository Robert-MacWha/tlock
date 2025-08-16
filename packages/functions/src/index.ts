import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.database();

export const cleanupOldRequests = onSchedule('0 2 * * *', async (_event) => {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;

    try {
        const requestsRef = db.ref('requests');

        const snapshot = await requestsRef
            .orderByChild('timestamp')
            .endAt(cutoffTime)
            .once('value');

        const updates: { [key: string]: null } = {};
        snapshot.forEach((child) => {
            updates[child.key] = null;
        });

        await requestsRef.update(updates);

        console.log(`Deleted ${Object.keys(updates).length} old requests`);
    } catch (error) {
        console.error('Cleanup failed:', error);
    }
});

export const sendPushNotification = onCall(async (request) => {
    const { message } = request.data as { message: unknown };

    if (!message || typeof message !== 'object') {
        throw new HttpsError('invalid-argument', 'Message payload is required');
    }

    try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new HttpsError('internal', errorText);
        }

        const result: unknown = await response.json();
        return { success: true, result };
    } catch (error) {
        console.error('Error sending push notification:', error);
        throw new HttpsError('internal', 'Failed to send push notification');
    }
});
