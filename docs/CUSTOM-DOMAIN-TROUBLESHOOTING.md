# Custom domain (immosync.felixseeger.de) – troubleshooting

## 1. Check what you see

- **Blank / white page** → Often DNS (wrong server) or JS error; check step 2 and browser console (F12).
- **Old site or “not found”** → DNS still points to kasserver (85.13.135.242); confirm step 2.
- **Vercel “Domain not found” / config error** → Domain not valid in Vercel; check step 3.
- **Site loads but login / password reset fails** → Firebase authorized domains; check step 4.

## 2. DNS: where does the domain point?

The domain must resolve to **Vercel**, not kasserver.

- **Windows (PowerShell):** `nslookup immosync.felixseeger.de`
- **Browser / online:** Use [whatsmydns.net](https://www.whatsmydns.net/#A/immosync.felixseeger.de)

**Expected:** One or more **A** records with value **76.76.21.21**.  
**If you see 85.13.135.242:** DNS still points to kasserver. Wait for propagation or fix the A record for `immosync` (Name: `immosync`, Type: A, Value: `76.76.21.21`).

## 3. Vercel domain status

- Vercel → Project **sitesync** → **Settings** → **Domains**
- **immosync.felixseeger.de** should show **Valid Configuration** (or at least not “Invalid”).
- If it shows **Invalid Configuration**, click the domain → follow the DNS instructions and click **Refresh** after DNS is correct.
- Ensure the domain is assigned to **Production** and (if applicable) to the latest deployment.

## 4. Firebase authorized domains

Login and password reset only work on domains listed in Firebase.

- [Firebase Console](https://console.firebase.google.com/) → Project **sitesync-c3f9a** → **Authentication** → **Settings** → **Authorized domains**
- Add **immosync.felixseeger.de** if it is not already listed.
- Save. No redeploy needed.

## 5. Cache and browser

- Try an **incognito/private** window.
- Try another browser or device.
- If you changed DNS recently, wait 10–30 minutes and retry (or flush DNS: `ipconfig /flushdns` on Windows).

## 6. Confirm app on default URL

- Open **https://sitesync-one.vercel.app** (or your `*.vercel.app` URL).
- If the app and password reset work there but not on immosync.felixseeger.de, the problem is DNS or domain config (steps 2–4), not the app code.
