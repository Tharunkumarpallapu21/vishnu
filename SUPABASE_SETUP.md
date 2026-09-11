# Supabase + Netlify Free setup

The website uses Netlify Free Functions with the existing Supabase Free PostgreSQL project. Firebase, Firebase Storage, Firestore, Cloud Functions, Netlify Blobs, localStorage, and sessionStorage are not used.

## 1. Run the migration

In Supabase Dashboard → SQL Editor, run [`SUPABASE_MIGRATION.sql`](./SUPABASE_MIGRATION.sql). It alters the existing `public.rolls` table without deleting or recreating it, adds the hashed-session column and partial unique index, creates the atomic `claim_roll` RPC, enables RLS, removes browser table access, and permits only the server-side service role to execute the RPC.

Before testing, run the verification query at the bottom of the migration. It must show 66 total rows. If a previous failed live test left `24F65A0524` claimed, do not clear it casually; inspect it first and decide whether that test roll should remain permanently consumed.

## 2. Configure Netlify

In Netlify → Site configuration → Environment variables, add these variables for the **Production** scope:

```text
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SECRET_KEY=<your-server-only-secret-or-service-role-key>
```

Never put either value in `index.html`, `auth.js`, `script.js`, CSS, Git, or browser-exposed configuration. The Functions read them only through `process.env`.

The project remains compatible with Netlify Free. No Firebase Blaze plan and no Netlify Blobs database are required.

## 3. Deploy

Push the repository’s `main` branch or trigger a production deploy for the existing Netlify site. `netlify.toml` keeps the publish directory as the repository root and functions directory as `netlify/functions`.

## 4. Required live tests

Use a valid unused roll only after verifying the database count. A successful claim is permanent.

- POST a valid unused roll: HTTP 200 and `Set-Cookie: m7_session=...; HttpOnly; Secure; SameSite=Lax`.
- Repeat the same roll: HTTP 409.
- Send two simultaneous requests for one other unused roll: exactly one HTTP 200 and one HTTP 409.
- POST an invalid roll: HTTP 400.
- GET check-access with no cookie: HTTP 401.
- GET check-access with the successful cookie: HTTP 200 and `{"authorized":true}`.
- Remove/misconfigure Supabase variables in a deploy preview only: claim must be HTTP 503 and check-access must never return authorized.

Do not treat a single successful request as proof of atomicity. The concurrent test and the database row counts are required.
