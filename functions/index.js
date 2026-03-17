const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Callable: setUserPassword
 * Lets an admin set another user's password (for forgotten-password help).
 * Caller must be authenticated and have role 'admin' in Firestore userRoles.
 * No emails are sent; admin assigns the new password from the website.
 *
 * data: { targetUserEmail: string, newPassword: string }
 */
exports.setUserPassword = functions.region('asia-southeast1').https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }
  const callerEmail = (context.auth.token.email || '').toLowerCase();
  const targetUserEmail = (data && data.targetUserEmail || '').toLowerCase().trim();
  const newPassword = typeof (data && data.newPassword) === 'string' ? data.newPassword : '';

  if (!targetUserEmail || !newPassword) {
    throw new functions.https.HttpsError('invalid-argument', 'targetUserEmail and newPassword are required.');
  }
  if (newPassword.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters.');
  }

  const db = admin.firestore();
  const roleSnap = await db.collection('userRoles').doc(callerEmail).get();
  const role = roleSnap.exists ? (roleSnap.data() || {}).role : '';
  if (role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set another user\'s password.');
  }

  const targetRoleSnap = await db.collection('userRoles').doc(targetUserEmail).get();
  const targetRole = targetRoleSnap.exists ? (targetRoleSnap.data() || {}).role : '';
  if (targetRole === 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Cannot set an admin\'s password from this tool.');
  }

  try {
    const userRecord = await admin.auth().getUserByEmail(targetUserEmail);
    await admin.auth().updateUser(userRecord.uid, { password: newPassword });
    return { success: true };
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      throw new functions.https.HttpsError('not-found', 'User not found.');
    }
    throw new functions.https.HttpsError('internal', err.message || 'Failed to update password.');
  }
});
