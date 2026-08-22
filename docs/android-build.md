# Android build

**Status: set up and building via GitHub Actions.** No Android SDK is
installed on this development machine, so the Capacitor Android project
(`android/`) was scaffolded here but is **built on GitHub's servers**,
not locally — GitHub's `ubuntu-latest` runners ship with the Android SDK
and a JDK preinstalled, so no local Android Studio install was required
to get a working APK pipeline.

## How it works

`capacitor.config.ts` points the Android WebView at the production Vercel
URL (`server.url`), not at bundled local files:

```ts
const config: CapacitorConfig = {
  appId: "com.emf.collections",
  appName: "EMF Collections",
  webDir: "public",
  server: {
    url: "https://finance-route-collector.vercel.app",
    cleartext: false,
  },
};
```

That means the Android app is a thin shell — every screen, every API
call, every database read/write goes through the same Next.js server
actions and the same Neon database as the website. Nothing is stored
locally on the device except what the WebView itself caches. Installing
the APK on 1 phone or 100 phones doesn't create separate data; they all
read and write the same production data through the same backend.

## Building the APK

`.github/workflows/android-build.yml` builds a **debug APK** automatically
whenever `android/**`, `capacitor.config.ts`, or `resources/**` change on
`main`, and can also be triggered manually:

1. GitHub repo → **Actions** tab → **Android APK build** → **Run workflow**.
2. Wait for the run to go green (a few minutes).
3. Open the completed run → **Artifacts** → download `emf-collections-debug-apk`.
4. Unzip it — inside is `app-debug.apk`.

A debug APK is signed with Android's default debug key. It installs and
runs exactly like a normal app; Android will show an "unknown source"
warning on install (expected for anything not from the Play Store) but
nothing else is different. This is what you hand to a client for
sideloaded testing — see [Sending the APK to a client](#sending-the-apk-to-a-client) below.

## Sending the APK to a client

1. Download `app-debug.apk` from the Actions artifact (above).
2. Send the file however's convenient — Google Drive link, WhatsApp,
   email attachment, USB transfer. It's a normal file, no special hosting
   needed.
3. On the client's phone: open the file. Android will prompt to allow
   installs from that source (Settings → apps that can install unknown
   apps, or a one-time prompt depending on Android version) — they accept
   that prompt, then tap **Install**.
4. They open the app and log in with their own EMF account credentials.
   Their data is exactly what's in the production database — the same
   data they'd see logging into the website.

No app store account, no review process, no waiting — this works today.
The tradeoff: the client has to manually accept the "install unknown
apps" prompt, and updates require sending a new APK (no auto-update).
Publishing to Google Play (see below) removes both tradeoffs but takes
longer to set up.

## Local Notifications plugin (section 23–24 of the spec)

Not yet added. When ready:

```bash
npm install @capacitor/local-notifications
npx cap sync android
```

Add the notification permission to `android/app/src/main/AndroidManifest.xml`
per the plugin's docs, and implement the sync routine described in
[notifications.md](./notifications.md) — it must run on app open/resume.

## Signing a release build (needed for Google Play, optional for direct APK sharing)

The debug APK above is fine for sending directly to a client. A **release**
build (needed for Play Store, and generally recommended before wide
distribution) needs its own signing key:

1. Generate a keystore (once, keep it forever, back it up somewhere safe —
   losing it means you can never update the app on Play Store again):
   ```bash
   keytool -genkey -v -keystore emf-release.keystore -alias emf -keyalg RSA -keysize 2048 -validity 10000
   ```
2. **Never commit the keystore or its passwords.** They're covered by
   `.gitignore` (`*.keystore`, `*.jks`, `keystore.properties`).
3. To build release APKs/AABs via the same GitHub Actions pipeline, add
   the keystore (base64-encoded) and its passwords as **GitHub Actions
   secrets**, decode them in a workflow step, and reference them from
   `android/app/build.gradle` via a `keystore.properties` file written at
   build time — never hardcoded in the repo.
4. Once signing is configured, extend `android-build.yml` (or add a
   second workflow) to run `./gradlew assembleRelease` / `bundleRelease`
   instead of `assembleDebug`.

## Building locally instead (optional)

If you later install Android Studio, the same commands work locally:

```bash
cd android
./gradlew assembleDebug      # debug APK
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
the user it's ready. Same rule applies to CI: check the workflow run
actually succeeded and produced the artifact before telling the user it's
ready.

## Google Play publishing

Requires a Google Play Console developer account (one-time $25 fee),
app listing metadata, a privacy policy URL, and screenshots. See
[deployment.md](./deployment.md) for how this fits into the overall release
checklist. Automated publishing (via `fastlane` or the Play Developer API)
needs a Google service-account JSON key — never commit it
(`google-services.json` / `play-store-service-account.json` are already
gitignored).
