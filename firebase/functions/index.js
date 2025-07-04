const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Simple rate limiting
const rateLimitStore = new Map();

function checkRateLimit(roomId, maxRequests = 5, windowMs = 1000) {
    const now = Date.now();
    const data = rateLimitStore.get(roomId) || { count: 0, lastReset: now };

    if (now - data.lastReset > windowMs) {
        data.count = 1;
        data.lastReset = now;
    } else if (data.count >= maxRequests) {
        return false;
    } else {
        data.count++;
    }

    rateLimitStore.set(roomId, data);
    return true;
}

// sends a push notification to the device registered for the room
exports.sendNotification = functions.https.onCall(async (data, context) => {
    const { roomId, requestId } = data;

    // Basic validation
    if (!roomId || !/^[A-F0-9]{32}$/.test(roomId)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid room ID');
    }

    if (!requestId) {
        throw new functions.https.HttpsError('invalid-argument', 'Request ID required');
    }

    // Rate limiting
    if (!checkRateLimit(roomId)) {
        throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded');
    }

    try {
        // Get FCM token for room
        const regSnapshot = await admin.database().ref(`registrations/${roomId}`).once('value');
        if (!regSnapshot.exists()) {
            throw new functions.https.HttpsError('not-found', 'Device not registered');
        }

        const { fcmToken } = regSnapshot.val();

        // Send notification
        const message = {
            token: fcmToken,
            notification: {
                title: 'Transaction Approval Required',
                body: 'Tap to review and approve'
            },
            data: { roomId, requestId },
            android: { priority: 'high' }
        };

        const response = await admin.messaging().send(message);
        return { success: true, messageId: response };

    } catch (error) {
        console.error('Notification error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send notification');
    }
});

// Cleanup old data every 12 hours
// exports.cleanup = functions.pubsub.schedule('every 12 hours').onRun(async () => {
//     console.log('Running cleanup function');

//     const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
//     const updates = {};

//     // Clean old requests
//     const requestsSnapshot = await admin.database().ref('requests').once('value');
//     if (!requestsSnapshot.exists()) {
//         return;
//     }

//     requestsSnapshot.forEach(roomSnapshot => {
//         roomSnapshot.forEach(requestSnapshot => {
//             const request = requestSnapshot.val();
//             if (request?.status !== 'pending' && request?.created < cutoff) {
//                 updates[`requests/${roomSnapshot.key}/${requestSnapshot.key}`] = null;
//             }
//         });
//     });

//     if (Object.keys(updates).length == 0) {
//         console.log('No old requests to clean up');
//         return;
//     }

//     await admin.database().ref().update(updates);
//     console.log(`Cleaned up ${Object.keys(updates).length} old requests`);
// });