<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/13ALt32fZbTwyEWR5pw2ZBoHK_os_BcXF

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Use [.env.example](.env.example) as the reference for local environment variables
3. Set `GEMINI_API_KEY` or `VITE_GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
4. Add your Firebase web app config in [.env.local](.env.local) and enable Google as a Firebase Authentication sign-in provider
5. Run the app:
   `npm run dev`

The app uses a local Tailwind CSS/PostCSS build. Do not add the Tailwind CDN script back into `index.html`; production builds generate the CSS bundle automatically.
