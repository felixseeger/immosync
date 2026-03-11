# Vercel custom domain – DNS setup

Use this to get **immosync.felixseeger.de** (or any custom domain) working with your Vercel project.

---

## 1. Add the domain in Vercel

1. Open **[Vercel Dashboard](https://vercel.com/dashboard)** → select your project (**sitesync**).
2. Go to **Settings** → **Domains**.
3. Click **Add** (or “Add Domain”).
4. Enter your domain, e.g. **`immosync.felixseeger.de`**.
5. Confirm. Vercel will show you **which DNS records to create** and whether the domain is verified.

---

## 2. Configure DNS at your domain provider

Your domain **felixseeger.de** is managed somewhere (e.g. Cloudflare, Namecheap, Google Domains, IONOS, etc.). There you add the records Vercel shows. Below are the usual setups.

### Option A: Subdomain (e.g. `immosync.felixseeger.de`)

**immosync.felixseeger.de** is a **subdomain** of felixseeger.de. Use a **CNAME** record:

| Type  | Name      | Value                     | TTL  |
|-------|-----------|---------------------------|------|
| CNAME | immosync  | cname.vercel-dns.com      | 3600 |

- **Name:** `immosync` (or `immosync.felixseeger.de` if your provider wants the full hostname).
- **Value:** Use the **exact target** Vercel shows in **Settings → Domains** for this domain (often `cname.vercel-dns.com`).

(Optional) To have **www.immosync.felixseeger.de** work as well, add it as a second domain in Vercel and add another CNAME for `www.immosync` → same target.

### Option B: Apex / root domain (e.g. `felixseeger.de`)

If you were using the **root** domain (e.g. `example.com`), you would use an **A** record:

| Type | Name | Value       | TTL  |
|------|------|-------------|------|
| A    | @    | 76.76.21.21 | 3600 |

For **immosync.felixseeger.de** you do **not** use the apex; use the CNAME in Option A.

---

## 3. Where to add the record (at your DNS provider)

1. Log in where **felixseeger.de** is registered or where its DNS is managed.
2. Open the **DNS** / **DNS management** / **Nameservers & DNS** section.
3. Add a **new record**:
   - **Type:** CNAME  
   - **Name/Host:** `immosync` (or whatever Vercel shows).  
   - **Target/Value:** `cname.vercel-dns.com` (or the value from Vercel).  
   - **TTL:** 3600 or “1 hour” is fine.
4. Save.

---

## 4. Wait and check in Vercel

- DNS can take from a few minutes up to **24–48 hours** to propagate.
- In Vercel **Settings → Domains**, the domain status will change to something like **Valid** / **Verified** when it’s correct.
- If it stays invalid, Vercel often shows a short reason (e.g. “CNAME not found” or “Wrong target”).

---

## 5. Optional: Use Vercel nameservers

If your registrar supports **custom nameservers**, you can move DNS to Vercel and then manage everything in Vercel:

1. In Vercel **Settings → Domains**, add the domain and choose the **Nameservers** setup.
2. Vercel will show two nameservers, e.g.:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
3. At your **domain registrar** (where you bought felixseeger.de), set the domain’s **nameservers** to these two.
4. After propagation, you can add and edit DNS records in Vercel for this domain.

---

## 6. SSL (HTTPS)

- After the domain is **Valid** in Vercel, Vercel will issue an SSL certificate automatically.
- If it says “Creating SSL certificate asynchronously”, wait a few minutes and refresh the Domains page.

---

## Quick checklist for immosync.felixseeger.de

1. **Vercel:** Settings → Domains → Add **immosync.felixseeger.de**.
2. **DNS provider:** Add **CNAME** → name **immosync** → target **cname.vercel-dns.com** (or the value Vercel shows).
3. Wait for status in Vercel to turn **Valid** and for SSL to be ready.
4. Open **https://immosync.felixseeger.de** in the browser.

If the domain still doesn’t work, copy the **exact** record type, name, and value from Vercel’s Domains page and double‑check they match what you entered at your DNS provider.
