const revealPhotoPaths = ['./reveal-images/IMG-20260911-WA0014.jpg', './reveal-images/IMG-20260911-WA0038.jpg', './reveal-images/IMG-20260911-WA0037.jpg', './reveal-images/IMG-20260911-WA0045.jpg', './reveal-images/IMG-20260911-WA0050.jpg', './reveal-images/IMG-20260911-WA0006.jpg', './reveal-images/IMG-20260911-WA0003.jpg'];
const gate = document.querySelector('#accessGate');
const form = document.querySelector('#accessForm');
const input = document.querySelector('#rollNumber');
const submit = document.querySelector('#accessSubmit');
const status = document.querySelector('#accessStatus');

const setStatus = (message, kind = '') => { status.textContent = message; status.dataset.kind = kind; };
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
const explainError = (error) => error?.message || 'Unable to verify access right now. Please try again.';

const checkExistingAccess = async () => {
  try {
    const response = await fetch('/.netlify/functions/check-access', { credentials: 'include', cache: 'no-store' });
    if (response.ok && (await response.json()).authorized) await grantAccess();
  } catch (_) {
    setStatus('Enter your roll number to begin.');
  }
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const rollNumber = input.value.trim().toUpperCase();
  if (!rollNumber) { setStatus('Please enter your roll number.', 'error'); input.focus(); return; }
  submit.disabled = true;
  setStatus('VERIFYING ACCESS…');
  try {
    const response = await fetch('/.netlify/functions/claim-roll-number', {
      method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rollNumber })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || 'Unable to verify access right now. Please try again.');
    setStatus('ACCESS GRANTED. Opening archive…', 'success');
    window.setTimeout(() => grantAccess().catch(() => denyAccess('Private archive files are unavailable.')), 420);
  } catch (error) {
    denyAccess(explainError(error));
  } finally { submit.disabled = false; }
});

document.body.classList.add('auth-lock');
checkExistingAccess();
