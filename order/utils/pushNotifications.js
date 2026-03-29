import { Expo } from 'expo-server-sdk';

// Create a new Expo SDK client
let expo = new Expo();

/**
 * Sends a push notification using the Expo Server SDK
 * @param {string} pushToken The target device's Expo push token
 * @param {string} title Title of the notification
 * @param {string} body Main text of the notification
 * @param {object} data Optional data payload to send with the notification
 */
const sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.warn(`[Push Notifications] Invalid Expo push token: ${pushToken}`);
    return;
  }

  const messages = [
    {
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
    },
  ];

  try {
    const chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
    console.log(`[Push Notifications] Sent notification to ${pushToken} successfully.`);
  } catch (error) {
    console.error('[Push Notifications] Error sending push notification', error);
  }
};

/**
 * Convenience method to securely fetch a token from the Auth service
 * and dispatch the notification if the token exists.
 */
const fetchTokenAndNotify = async (userId, title, body, options = {}) => {
    try {
        // We use the auth service port (3001) as configured earlier.
        const res = await fetch(`http://localhost:3001/api/auth/internal/token/${userId}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.token) {
            await sendPushNotification(data.token, title, body, options);
        } else {
            console.log(`[Push Notifications] No token registered for user: ${userId}`);
        }
    } catch (e) {
        console.error(`[Push Notifications] Could not fetch token for ${userId}:`, e.message);
    }
};

export { sendPushNotification, fetchTokenAndNotify };
