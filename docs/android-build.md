# Android build (deferred)

**Status: not yet started.** The Android SDK / Android Studio is not
installed on this machine, so no `android/` Capacitor project has been
generated yet. This document describes the steps for when it is ready —
do not treat any of this as already done.

## Prerequisites to install first

1. **Android Studio** (includes the Android SDK, platform tools, and an
   emulator) — https://developer.android.com/studio
2. A JDK compatible with the installed Android Gradle Plugin (Android
   Studio bundles one).
3. Accept SDK licenses: `sdkmanager --licenses` (run from inside the SDK's
   `cmdline-tools/latest/bin`).

## First-time Capacitor setup (once the SDK exists)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "EMF Collections" "com.emf.collections" --web-dir=out
```

Because this app uses Next.js Server Actions and API routes (not a static
export), the Android WebView must point at the deployed Vercel URL rather
than bundling static HTML — configure `capacitor.config.ts`:

```ts
const config: CapacitorConfig = {
  appId: "com.emf.collections",
  appName: "EMF Collections",
  server: {
    url: "https://<your-production-domain>",
    cleartext: false,
  },
};
```

Then:

```bash
npx cap add android
npx cap sync android
```

## Local Notifications plugin (section 23–24 of the spec)

```bash
npm install @capacitor/local-notifications
npx cap sync android
```

Add the notification permission to `android/app/src/main/AndroidManifest.xml`
per the plugin's docs, and implement the sync routine described in
[notifications.md](./notifications.md) — it must run on app open/resume.

## Signing

1. Generate a keystore (once, keep it forever, back it up somewhere safe —
   losing it means you can never update the app on Play Store again):
   ```bash
   keytool -genkey -v -keystore emf-release.keystore -alias emf -keyalg RSA -keysize 2048 -validity 10000
   ```
2. **Never commit the keystore or its passwords.** They're covered by
   `.gitignore` (`*.keystore`, `*.jks`, `keystore.properties`). Store the
   keystore file and passwords in a password manager or Vercel/GitHub
   encrypted secrets if you automate builds via CI later.
3. Reference it from `android/app/build.gradle` via a local
   `keystore.properties` file (gitignored) — not hardcoded values.

## Building

```bash
cd android
./gradlew assembleDebug      # debug APK, for local testing
./gradlew assembleRelease    # release APK, needs signing config above
./gradlew bundleRelease      # release AAB, for Play Store upload
```

Output locations (standard Gradle layout):
```
android/app/build/outputs/apk/debug/app-debug.apk
android/app/build/outputs/apk/release/app-release.apk
android/app/build/outputs/bundle/release/app-release.aab
```

**Do not report an APK/AAB as generated unless one of these files actually
exists after a successful Gradle build** — verify with `ls` before telling
the user it's ready.

## Google Play publishing

Requires a Google Play Console developer account (one-time $25 fee),
app listing metadata, a privacy policy URL, and screenshots. See
[deployment.md](./deployment.md) for how this fits into the overall release
checklist. Automated publishing (via `fastlane` or the Play Developer API)
needs a Google service-account JSON key — never commit it
(`google-services.json` / `play-store-service-account.json` are already
gitignored).
