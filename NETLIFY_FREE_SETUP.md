# M7 free-tier access-control setup

## Free services used

This implementation uses only the current Netlify site:

| Service | Use | Billing requirement |
|---|---|---|
| Netlify Free | Static site and serverless Functions | $0 plan; subject to Netlify Free hard usage limits |
| Netlify Blobs | Server-side claim records | No Firebase, no Supabase, no separate database, no Firebase Blaze |

Netlify documents conditional atomic writes through `onlyIfNew`. The claim Function writes a server-side blob only if the claim key does not already exist. Two simultaneous requests for one roll number cannot both create the same blob.

No Firebase SDK, Firebase Authentication, Firestore, Firebase Storage, Cloud Functions, Supabase, localStorage, or sessionStorage is used by this architecture.

The Netlify Free plan has usage limits. Netlify's current pricing page lists a $0 Free plan with a hard monthly credit limit. The site must remain within those limits; this implementation does not configure auto-recharge or a paid plan.

## Security model

The exact 66 roll numbers exist only in the server-side Netlify Function module. They are never shipped to frontend JavaScript. The client submits one normalized roll number to `/.netlify/functions/claim-roll-number`.

The Function validates the roll against the server list and atomically creates a `roll:<sha256>` blob with `onlyIfNew: true`. A second request for the same valid roll receives HTTP 409 and cannot overwrite the first claim.

On success, the Function returns an HttpOnly, Secure, SameSite=Lax cookie containing a random session token. The token is stored only inside the server-side claim blob. The client calls `/.netlify/functions/check-access` on a later refresh; the Function verifies the cookie against server-side claim records. A forwarded URL without the cookie cannot grant access.

The seven photographs remain the existing public Netlify assets. The authorization gate protects the website experience, but public image URLs cannot be made private while they remain public static assets.

## Deployment

The repository is configured with `netlify.toml`:

```toml
[build]
  publish = "."
  functions = "netlify/functions"
```

Connect the `main` branch to the existing Netlify site and trigger a production deploy. Netlify automatically bundles the functions and provides the Netlify Blobs site binding at runtime. No Firebase project configuration or Supabase project is needed.

After deployment, verify these endpoints exist:

```text
https://YOUR-SITE.netlify.app/.netlify/functions/claim-roll-number
https://YOUR-SITE.netlify.app/.netlify/functions/check-access
```

A GET request to the claim endpoint should return HTTP 405, proving the function is deployed. A request to check-access without a cookie should return HTTP 401.

## Live verification procedure

Use a fresh incognito window:

1. Open the Netlify site. Only the access gate should be visible.
2. Submit a valid unused roll number. Expect HTTP 200, an authorization cookie, and the cinematic reveal.
3. Refresh the same browser. The cookie should authorize the session and the reveal should replay.
4. Open another incognito window and submit the same roll. Expect HTTP 409: the roll is permanently used.
5. Submit a random roll. Expect HTTP 400.
6. Open the site in a new browser without the cookie. It must show only the gate.
7. Send two simultaneous POST requests for the same unused roll. Exactly one must receive HTTP 200; the other must receive HTTP 409.

Do not call the system fully verified until these tests pass on the deployed Netlify URL.
