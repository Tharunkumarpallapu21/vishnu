const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const crypto = require('crypto');

initializeApp();
const db = getFirestore();

const ALLOWED_ROLL_NUMBERS = new Set([
  ...Array.from({ length: 60 }, (_, index) => `23F61A05${String.fromCharCode(73 + Math.floor(index / 10))}${index % 10}`),
  '24F65A0519', '24F65A0520', '24F65A0521', '24F65A0522', '24F65A0523', '24F65A0524'
]);
const normalize = (value) => String(value || '').trim().toUpperCase();
const rollId = (rollNumber) => crypto.createHash('sha256').update(`m7-roll:${rollNumber}`).digest('hex');
const requireAuth = (request) => { if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Authentication required.'); return request.auth.uid; };

exports.claimRollNumber = onCall({ region: 'us-central1', enforceAppCheck: false }, async (request) => {
  const uid = requireAuth(request);
  const rollNumber = normalize(request.data?.rollNumber);
  if (!/^[0-9A-Z]{10}$/.test(rollNumber) || !ALLOWED_ROLL_NUMBERS.has(rollNumber)) {
    throw new HttpsError('invalid-argument', 'invalid-roll');
  }
  const id = rollId(rollNumber);
  const claimRef = db.collection('rollClaims').doc(id);
  const userRef = db.collection('authorizedUsers').doc(uid);
  await db.runTransaction(async (transaction) => {
    const claim = await transaction.get(claimRef);
    if (!claim.exists) throw new HttpsError('failed-precondition', 'Member list is not provisioned.');
    if (claim.data().claimed === true) throw new HttpsError('already-exists', 'already-used');
    transaction.update(claimRef, { claimed: true, claimedAt: FieldValue.serverTimestamp(), claimedBy: uid });
    transaction.set(userRef, { authorized: true, rollId: id, authorizedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
  return { authorized: true };
});

exports.checkAccess = onCall({ region: 'us-central1', enforceAppCheck: false }, async (request) => {
  const uid = requireAuth(request);
  const user = await db.collection('authorizedUsers').doc(uid).get();
  return { authorized: user.exists && user.data().authorized === true };
});
