const { applicationDefault, initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const crypto = require('crypto');

initializeApp({ credential: applicationDefault(), projectId: 'birthday-28c6f' });
const db = getFirestore();
const rolls = [
  ...Array.from({ length: 60 }, (_, i) => `23F61A05${String.fromCharCode(73 + Math.floor(i / 10))}${i % 10}`),
  '24F65A0519','24F65A0520','24F65A0521','24F65A0522','24F65A0523','24F65A0524'
];
const id = (roll) => crypto.createHash('sha256').update(`m7-roll:${roll}`).digest('hex');

(async () => {
  if (rolls.length !== 66) throw new Error(`Expected 66 roll numbers, got ${rolls.length}`);
  const batch = db.batch();
  rolls.forEach((rollNumber) => batch.set(db.collection('rollClaims').doc(id(rollNumber)), {
    rollNumber,
    claimed: false,
    claimedAt: null,
    claimedBy: null,
    provisionedAt: FieldValue.serverTimestamp()
  }, { merge: false }));
  await batch.commit();
  console.log(`Provisioned ${rolls.length} allowed roll numbers.`);
})();
