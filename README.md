<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/06fbd349-6a49-4e1a-810f-b81f3ef13e19

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Copy [.env.example](.env.example) to `.env.local` and set `VITE_MAPBOX_TOKEN` (and optionally `GEMINI_API_KEY`).
4. Run the app:
   `npm run dev`

## Deploy (Vercel)

For the map to work on the live site, set the Mapbox token in Vercel:

1. Open [Vercel Dashboard](https://vercel.com) → your **sitesync** project → **Settings** → **Environment Variables**.
2. Add **Name:** `VITE_MAPBOX_TOKEN`, **Value:** your [Mapbox access token](https://account.mapbox.com/access-tokens/), and select **Production** (and Preview if you want).
3. **Redeploy** the project (Deployments → ⋮ on latest → Redeploy, or push a new commit) so the token is baked into the build.
