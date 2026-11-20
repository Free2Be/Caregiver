# Paperwork Explainer: Android app

An Expo (React Native) app. It talks to the server in `../backend`, which holds the API key, so no secret is ever stored on the phone.

## What's in the app

- **Explain tab**
  - Add pages: take photos, choose photos, or choose a PDF, up to 5 pages. Photos are shrunk to JPEG on the phone before upload.
  - Ask an optional question.
  - Pages you've added and your question are kept if you leave the app.
- **Explanation screen**
  - Summary and "Don't miss this" warning.
  - Tickable to-do list with due dates and **Add to calendar**, which opens the phone's calendar with the event filled in.
  - Costs, doctor questions, and plain-English terms.
  - Draft appeal letter with a copy button.
  - **Share with family**.
  - Delete.
- **Saved tab:** every explanation, saved automatically on the phone only.
- **To-dos tab:** every to-do from every document, soonest due date first, with a badge showing how many are open.
- **About tab:** privacy, a medical disclaimer, and **Delete everything**.
- **Look:** follows the phone's light or dark mode.

## Try it on your Android phone

The app is built on GitHub's machines (`.github/workflows/android.yml`) and points at the live backend, `https://caregiver-flame.vercel.app`.

### One-time setup

1. On GitHub, open the repo's **Settings → Secrets and variables → Actions**.
2. Click **New repository secret**.
3. Name it `APP_KEY` and give it the same value as `APP_KEY` on Vercel. No Expo account is needed.

### Build

1. Open the repo's **Actions** tab, choose **Build Android app**, and click **Run workflow**. A build also runs by itself whenever `mobile/` changes.
2. Wait about 15–25 minutes.
3. Open the repo's **Releases** page, find the newest **Test build**, and tap the `.apk` on your phone to install it.

Android will warn about installing from outside the Play Store. That's expected for a test build.

### Alternative: build with Expo's cloud (EAS)

`eas.json` is also set up. From this folder:

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
