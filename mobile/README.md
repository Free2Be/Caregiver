# Paperwork Explainer: Android app

An Expo (React Native) app. It talks to the server in `../backend`, which holds the API key, so no secret is ever stored on the phone.

## What's in the app

Bottom tabs: **Today · Documents · Medicines · Calendar · More**.

- **Today**
  - Today's medicine doses with **Taken** / **Skip** buttons. Doses past their time are flagged, and the tab shows a badge.
  - Visits this week and to-dos due soon.
  - Quick buttons to explain paperwork, add a medicine, or add a visit.
- **Documents**
  - **Explain new paperwork**: photos (shrunk on the phone) or a PDF, up to 5 pages, plus an optional question.
  - Every explanation is saved on the phone. Pages in progress are kept if you leave the app.
- **Explanation screen**
  - Summary, warnings, and a tickable to-do list with due dates.
  - Costs, doctor questions, plain-English terms, and an appeal letter.
  - **Medicines mentioned**, labelled new, changed, stop, or keep taking, with **Add to my medicines**.
  - **Appointments**, with **Add to my calendar**.
  - Share with family, or delete.
- **Medicines**
  - **Scan a label**: the server reads the pharmacy label and fills in the form to check.
  - Or type a medicine in yourself.
  - Dose times with a daily **reminder notification**.
  - "As needed" medicines, label warnings, and "No longer taking".
- **Calendar**
  - Month view with dots for visits and to-dos due, and the chosen day's list.
  - **Add a visit**, with reminders the evening before and 2 hours before.
- **More**
  - All to-dos, privacy, a medical disclaimer, and **Delete everything**.

**Storage:** everything is stored only on the phone, with no account. Only photos sent to be read go to the server, and the server doesn't keep them.

**Not built:** the app doesn't check drug interactions or suggest doses.

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
