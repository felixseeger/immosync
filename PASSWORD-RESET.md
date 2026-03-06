# Password reset email not received – checklist

Reset emails are sent by **Firebase Authentication** (not your app server). Use this checklist if a user doesn’t receive the email.

## 1. Confirm the account exists (Email/Password)

- In [Firebase Console](https://console.firebase.google.com/) → **Authentication** → **Users**, check that the email exists.
- Firebase does **not** send an email if there is no user with that address (and the API still returns success for privacy). So “no email” often means **no user with that email**.
- Ensure the user signed up with **Email/Password**. If they only use Google or another provider, there may be no password to reset; they should use “Sign in with Google” (or that provider) instead.

## 2. Authorized domains

- **Authentication** → **Settings** (or **Sign-in method** tab) → **Authorized domains**.
- Add every domain where the app runs, e.g.:
  - `localhost` (for local dev)
  - `sitesync-one.vercel.app`
  - Your production domain if different
- If the domain is missing, the reset **link** in the email may not work when clicked (the email can still be sent).

## 3. Email/Password sign-in method

- **Authentication** → **Sign-in method** → **Email/Password** must be **Enabled**.

## 4. Spam / junk / filters

- Ask the user to check **spam** and **junk**.
- Corporate or strict filters sometimes block Firebase’s default sender (`no-reply@...`). They can whitelist it or use a personal address to test.

## 5. Correct email address

- The user must request the reset using the **exact email** they use to sign in (same casing doesn’t matter; we send lowercase to Firebase).
- If they have multiple addresses, only the one registered in Firebase will receive the email.

## 6. Firebase email template (optional)

- **Authentication** → **Templates** → **Password reset**.
- You can customize the sender name and the email body. Changing the template can help with deliverability or branding; it does not usually fix “no email” if the cause is “no user” or wrong domain.

## 7. Custom SMTP (advanced)

- By default, Firebase sends the email itself. For a custom domain/sender or stricter deliverability, you can configure **Custom SMTP** (e.g. SendGrid, Mailgun) in the Firebase project (may require Blaze plan). This is only needed if deliverability is still an issue after the steps above.

## Summary

| Check | Where |
|-------|--------|
| User exists with that email (Email/Password) | Firebase Console → Authentication → Users |
| App domain in Authorized domains | Authentication → Settings → Authorized domains |
| Email/Password enabled | Authentication → Sign-in method |
| User checked spam and used sign-in email | User side |

After fixing Authorized domains or the sign-in method, have the user request the reset again.
