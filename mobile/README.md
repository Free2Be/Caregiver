# Paperwork Explainer: Android app

An Expo (React Native) app. It talks to the server in `../backend`, which holds the API key, so no secret is ever stored on the phone.

## What's in the app

- **Adding pages:** take photos, choose photos, or choose a PDF, up to 5 pages. Photos are shrunk to JPEG on the phone before upload.
- **Optional question:** an extra question can be sent along with the pages.
- **Results screen:**
  - summary and "Don't miss this" warning
  - tickable to-do list
  - costs, doctor questions, and plain-English terms
  - draft appeal letter with a copy button
- **Share with family:** sends a text version through SMS, WhatsApp, email, or any other app.
- **Look:** follows the phone's light or dark mode.

## Try it on your Android phone

### 1. Put the backend online first

Follow the steps in the main README. You'll get an address like `https://something.vercel.app`.

### 2. Point the app at it

`eas.json` already points to the live backend. Add the backend's `APP_KEY` on expo.dev under the project's **Environment variables** as `EXPO_PUBLIC_APP_KEY`, for the preview and production environments. Don't put it in `eas.json`, because that file is on GitHub.

### 3. Build an installable APK in Expo's cloud

No Android Studio is needed. From this folder:

```bash
npm install
npx eas-cli@latest login            # free Expo account
npx eas-cli@latest build -p android --profile preview
```

After about 10–15 minutes you get a link. Open it on your phone to install the APK.

## Publish to Google Play (later)

1. Create a Google Play developer account (one-time $25 fee).
2. Run `npx eas-cli@latest build -p android --profile production` to build the Play Store bundle (`.aab`).
3. Upload it in the Play Console. Start with the internal testing track.

**Choose the package name first.** Before the first Play upload, decide on the final package name. It is `app.paperworkexplainer` in `app.json` and can never be changed after publishing.

## Develop

```bash
npm install
npm run typecheck
EXPO_PUBLIC_API_URL=http://YOUR-COMPUTER-IP:3000 npx expo start
```

Then scan the QR code with the **Expo Go** app on your Android phone. Run the backend with `npm run dev` in `../backend`.
