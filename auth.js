import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';

const firebaseConfig = {
  apiKey: 'AIzaSyArytXLynnCa83TRlWqhuzqkbvZKBGXz3w',
  authDomain: 'birthday-28cf.firebaseapp.com',
  projectId: 'birthday-28cf',
  messagingSenderId: '732567269014',
  appId: '1:732567269014:web:0152319c0340fdd9cddcb7'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app, 'us-central1');
const claimRollNumber = httpsCallable(functions, 'claimRollNumber');
const checkAccess = httpsCallable(functions, 'checkAccess');
const gate = document.querySelector('#accessGate');
const form = document.querySelector('#accessForm');
const input = document.querySelector('#rollNumber');
const submit = document.querySelector('#accessSubmit');
const status = document.querySelector('#accessStatus');

const setStatus = (message, kind = '') => { status.textContent = message; status.dataset.kind = kind; };
const revealPhotoPaths = ['./reveal-images/IMG-20260911-WA0014.jpg', './reveal-images/IMG-20260911-WA0038.jpg', './reveal-images/IMG-20260911-WA0037.jpg', './reveal-images/IMG-20260911-WA0045.jpg', './reveal-images/IMG-20260911-WA0050.jpg', './reveal-images/IMG-20260911-WA0006.jpg', './reveal-images/IMG-20260911-WA0003.jpg'];
const loadRevealPhotos = async () => {
  const responses = await Promise.all(revealPhotoPaths.map((path) => fetch(path, { method: 'HEAD', cache: 'no-store' })));
  if (responses.some((response) => !response.ok)) throw new Error('Reveal photo unavailable.');
  return revealPhotoPaths;
};
const grantAccess = async () => {
  const photos = await loadRevealPhotos();
  gate.classList.add('is-authorized');
  document.body.classList.remove('auth-lock');
  window.dispatchEvent(new CustomEvent('access-granted', { detail: { photos } }));
};
const denyAccess = (message) => { gate.classList.remove('is-authorized'); document.body.classList.add('auth-lock'); setStatus(message, 'error'); };
const explainFirebaseError = (error) => {
  const code = error?.code || '';
  const message = error?.message || '';
  if (code.includes('configuration-not-found') || message.includes('CONFIGURATION_NOT_FOUND')) return 'Firebase Anonymous Auth is not enabled yet. Please enable it in Firebase Console.';
  if (code.includes('not-found') || message.includes('NOT_FOUND')) return 'The Firebase claim service is not deployed yet. Please deploy the Cloud Functions.';
  return 'Unable to verify access right now. Please try again.';
};

const verifyExistingUser = async (user) => {
  try {
    const result = await checkAccess();
    if (result.data?.authorized) await grantAccess();
    else denyAccess('Please enter your class roll number to continue.');
  } catch (error) {
    denyAccess(explainFirebaseError(error));
  }
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const rollNumber = input.value.trim().toUpperCase();
  if (!rollNumber) { setStatus('Please enter your roll number.', 'error'); input.focus(); return; }
  submit.disabled = true;
  setStatus('VERIFYING ACCESS…');
  try {
    if (!auth.currentUser) await signInAnonymously(auth);
    const result = await claimRollNumber({ rollNumber });
    if (result.data?.authorized) { setStatus('ACCESS GRANTED. Opening archive…', 'success'); window.setTimeout(() => grantAccess().catch(() => denyAccess('Private archive files are unavailable.')), 420); }
    else denyAccess('This roll number cannot access the archive.');
  } catch (error) {
    const code = error?.details?.code || error?.code || '';
    if (code.includes('already-exists') || error?.message?.includes('already-used')) denyAccess('Looks like this roll number has already entered ❤️');
    else if (code.includes('invalid-argument') || error?.message?.includes('invalid-roll')) denyAccess('Sorry 😅 This surprise is only for our class.');
    else denyAccess(explainFirebaseError(error));
  } finally { submit.disabled = false; }
});

document.body.classList.add('auth-lock');
onAuthStateChanged(auth, (user) => { if (user) verifyExistingUser(user); });
