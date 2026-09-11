# Firebase access-control setup for M7

This repository contains the frontend access gate, Firebase client integration, atomic callable claim Functions, Firestore rules, and the 66-member provisioning script. **The Firebase security system is not fully active until the backend is deployed and provisioned.**

## Architecture without Firebase Storage

The site uses Firebase only for:

- Anonymous Firebase Authentication
- Firestore-backed roll-number claims
- Callable Functions for atomic validation and claiming

The seven reveal photos remain public static Netlify assets in `reveal-images/`. This avoids Firebase Storage and avoids requiring the Blaze billing plan. Because the photos are public assets, Firebase authorization protects access to the reveal experience in the UI, but it cannot cryptographically protect someone who directly discovers a public image URL. Do not describe the photos as private at the file-server level.

## Manus integration status

The current Manus session has no built-in Firebase connector or OAuth deployment flow. The Web App configuration is used by `auth.js`, but backend deployment and Firestore provisioning still require Firebase Console and Google Cloud Shell in Chrome.

## 1. Firebase Console

Open [Firebase Console](https://console.firebase.google.com/) and select `birthday-28c6f`.

Enable **Authentication → Sign-in method → Anonymous**. Create a **Cloud Firestore database** in production mode. Firebase Functions may require the Blaze plan; review that requirement before deployment. **Do not enable or configure Firebase Storage for this implementation.**

## 2. Deploy from Google Cloud Shell

In Google Cloud Console for `birthday-28c6f`, click **Activate Cloud Shell**. Clone the repository:

```bash
git clone https://github.com/Tharunkumarpallapu21/vishnu.git
cd vishnu
```

Authenticate and deploy only Functions and Firestore rules:

```bash
npm install -g firebase-tools
firebase login --no-localhost
firebase use birthday-28c6f
firebase deploy --only functions,firestore:rules
```

There is intentionally no `storage` deploy target or Storage rules file.

## 3. Provision all 66 roll numbers

In Cloud Shell:

```bash
cd functions
npm install
cd ..
gcloud auth application-default login
node scripts/provision-members.js
```

Complete the Google browser authorization when prompted. The script writes exactly 66 records to `rollClaims/{sha256(m7-roll:<normalized roll>)}` with `claimed: false`, `claimedAt: null`, and `claimedBy: null`. The client cannot read or modify those records.

## 4. Static reveal assets

The reveal uses these existing public paths and does not use Firebase Storage:

```text
reveal-images/IMG-20260911-WA0014.jpg
reveal-images/IMG-20260911-WA0038.jpg
reveal-images/IMG-20260911-WA0037.jpg
reveal-images/IMG-20260911-WA0045.jpg
reveal-images/IMG-20260911-WA0050.jpg
reveal-images/IMG-20260911-WA0006.jpg
reveal-images/IMG-20260911-WA0003.jpg
```

## 5. Verification checklist

1. Open the Netlify URL in an incognito window: only the roll-number gate appears.
2. Enter a valid unused roll number: the callable claim succeeds and the reveal starts.
3. Refresh the authorized browser: the reveal restarts from the beginning.
4. Try the same roll number in another browser: it is denied as already used.
5. Enter a random roll number: it is rejected without exposing the allowlist.
6. Verify `rollClaims` contains 66 documents and only successful claims are marked claimed.
7. Run two simultaneous attempts for one unused roll number: exactly one succeeds.
8. Confirm no Firebase Storage SDK, Storage rules, or Storage deployment target is used.

## Current security boundary

Forwarding the URL alone does not grant access to the birthday UI because the access gate waits for Firebase Authentication and the callable claim result. The roll-number allowlist and one-time claim are backend-enforced. The reveal photo files themselves remain public Netlify assets by deliberate choice; removing direct file access would require a paid/private storage or server-delivery layer.

Until Functions are deployed, Firestore is provisioned, and the tests above pass, the live site must not be described as fully secured.
