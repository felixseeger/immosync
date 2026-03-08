# Custom domain: https://immosync.felixseeger.de/

If the app does not work on the custom domain, check the following.

## 1. Firebase Authorized domains (required for login & password reset)

Firebase Auth only allows sign-in and password reset from domains you explicitly allow.

1. Open [Firebase Console](https://console.firebase.google.com/) → your project (**sitesync-c3f9a**).
2. Go to **Authentication** → **Settings** (or **Sign-in method** tab) → **Authorized domains**.
3. Click **Add domain** and add:
   - `immosync.felixseeger.de`
4. Save.

Without this, visiting https://immosync.felixseeger.de/ may load the app, but **sign in and password reset will fail** (often with `auth/unauthorized-domain` or a generic error).

## 2. Hosting & DNS (if the site does not load at all)

- **Vercel**: Project Settings → Domains → add `immosync.felixseeger.de` and follow the DNS instructions (usually a CNAME to `cname.vercel-dns.com` or similar).
- **Netlify / other**: Add the custom domain in the host’s dashboard and set the DNS record they provide (CNAME or A).

After DNS propagates and the host is linked, the site should load. Auth will work only after adding the domain in Firebase (step 1).
