# Firebase access-control setup for M7

This repository now contains the frontend access gate, Firebase client integration, atomic callable claim functions, Firestore rules, Storage rules, and a provisioning script. **The security system is not fully active until the steps below are completed in Firebase.**

## Manus integration status

The current Manus session has no built-in Firebase connector or Firebase OAuth deployment flow enabled. The supplied Web App configuration is used by `auth.js`, but it cannot create Firestore data or deploy Functions/rules. The remaining steps can be performed entirely in Chrome using Firebase Console and Google Cloud Shell.

## 1. Open the project

In Chrome, open [Firebase Console](https://console.firebase.google.com/) and select project `birthday-28c6f`.

Enable **Authentication → Sign-in method → Anonymous**. Create a **Cloud Firestore database** in production mode. Enable **Storage**. If Firebase asks to upgrade the project to the Blaze plan for Cloud Functions, review and accept that requirement in the Firebase Console; the backend cannot be deployed without the required billing plan.

## 2. Upload the private reveal photographs

In Firebase Console, open **Storage → Files**, create a folder named `reveal`, and upload the seven files using these exact names:

```text
IMG-20260911-WA0014.jpg
IMG-20260911-WA0038.jpg
IMG-20260911-WA0037.jpg
IMG-20260911-WA0045.jpg
IMG-20260911-WA0050.jpg
IMG-20260911-WA0006.jpg
IMG-20260911-WA0003.jpg
```

The website requests these files only after Firebase authorization. The repository copies remain for migration/reference; they are not used by the protected reveal after deployment.

## 3. Open Cloud Shell

In the Google Cloud Console for `birthday-28c6f`, click the **Activate Cloud Shell** terminal icon. Cloud Shell runs in Chrome, so no local installation or service-account private key is required.

Clone the repository and enter it:

```bash
git clone https://github.com/Tharunkumarpallapu21/vishnu.git
cd vishnu
```

Install and authenticate the Firebase CLI in Cloud Shell:

```bash
npm install -g firebase-tools
firebase login --no-localhost
firebase use birthday-28c6f
```

Complete the browser authorization shown by the command. Then deploy the Functions and rules:

```bash
firebase deploy --only functions,firestore:rules,storage
```

## 4. Provision all 66 roll numbers

In the same Cloud Shell directory, install the provisioning dependency and authenticate Application Default Credentials through the browser:

```bash
cd functions
npm install
cd ..
gcloud auth application-default login
node scripts/provision-members.js
```

The script writes exactly 66 documents to `rollClaims/{sha256(m7-roll:<normalized roll>)}` with:

```text
rollNumber
claimed: false
claimedAt: null
claimedBy: null
provisionedAt
```

The client cannot read or write this collection. Only the callable Functions use the Admin SDK.

## 5. Deploy the updated static website

After deploying the backend, push the repository to GitHub. Netlify should build from the `main` branch and publish the repository root. The frontend uses the Firebase Web App configuration in `auth.js`:

```text
Project: birthday-28c6f
Web App ID: 1:732567269014:web:0152319c0340fdd9cddcb7
```

## Security behavior

Unauthenticated visitors see only the roll-number gate. The reveal is not started until `checkAccess` or `claimRollNumber` succeeds and the protected Storage URLs are retrieved. `claimRollNumber` uses a Firestore transaction, so concurrent attempts for one roll number can have only one winner. Firestore clients cannot read or modify claims. Storage reads require an authenticated UID with an `authorizedUsers/{uid}` record.

A returning authorized browser keeps its Firebase anonymous session and can replay the reveal on every refresh. Clearing browser data or using another device does not create another claim: the backend rejects the already-claimed roll number.

## Verification checklist

After deployment, test in Chrome:

1. Open the Netlify URL in an incognito window: only the access gate appears.
2. Enter a valid unused roll number: access is granted, protected photos load, and the reveal starts.
3. Refresh as the authorized browser: the reveal starts from the beginning.
4. Try the same roll number in another incognito window: access is denied as already used.
5. Enter a random roll number: access is denied without revealing the allowlist.
6. In Firebase Console, verify `rollClaims` contains 66 records and only one record changes to `claimed: true` per successful entry.
7. Attempt to open a Storage object without authentication: the request is denied.
8. Run two simultaneous attempts for the same unused roll number: exactly one callable request succeeds.

## What is still permission-dependent

Until the Firebase Console and Cloud Shell steps are completed, this repository contains the complete implementation artifacts but the live Netlify site does not yet have a deployed callable backend, provisioned allowlist, or protected Storage bucket. It must not be described as fully secured before those deployments and tests succeed.
