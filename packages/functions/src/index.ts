import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/scheduler';

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.database();

export const cleanupOldRequests = onSchedule('0 2 * * *', async (_event) => {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);

    try {
        const requestsRef = db.ref('requests');

        const snapshot = await requestsRef
            .orderByChild('timestamp')
            .endAt(cutoffTime)
            .once('value');

        const updates: { [key: string]: null } = {};
        snapshot.forEach(child => {
            updates[child.key] = null;
        });

        await requestsRef.update(updates);

        console.log(`Deleted ${Object.keys(updates).length} old requests`);
    } catch (error) {
        console.error('Cleanup failed:', error);
    }
});