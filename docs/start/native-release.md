# Release an iOS or Android app

> Build a phone app for distribution, test the packaged result, and deliver it to store testers.

You have a working phone app. The next useful result is a build someone can
install without your development server. Start with a test release before
making it available to everyone.

Run commands from your app directory. Finish [phone setup](toolchain.md#run-on-ios-and-android)
and test your main flow on the intended platform first. iOS builds need a Mac
with Xcode. Distribution needs the relevant Apple Developer or Google Play
account, app registration, and signing credentials. A **signature** identifies
who produced the app; the store checks it before accepting an upload.

## Check the app you will release

Run the app's checks and inspect the installed command's options:

```sh
bun run lint
bun run typecheck
bun run test
bun run xplat doctor
bun run xplat build --help
```

Resolve failures before packaging. A passing browser test does not establish
phone behavior. Review [known limits](../testing/known-limits.md) for features
your app uses, and keep the compatible compiler/runtime versions selected by
[the upgrade workflow](toolchain.md#upgrade-framework-packages).

Set the permanent application ID in `nativescript.config.ts`. Edit the existing
configuration; preserve its paths, bundler settings, and platform options:

```ts
// nativescript.config.ts — the phone starter configuration.
import type { NativeScriptConfig } from '@nativescript/core'

export default {
	id: 'com.example.packing',
	appPath: 'src',
	appResourcesPath: 'App_Resources',
	cli: { packageManager: 'bun' },
	android: { v8Flags: '--expose_gc', markingMode: 'none' },
	bundler: 'vite',
	bundlerConfigPath: 'vite.config.native.mts',
} as NativeScriptConfig
```

Replace `com.example.packing` with an ID you control and use that same value in
the store record and native service registrations. The example shows the
starter configuration; change only `id` in an app with existing custom settings. Avoid changing an
ID after distributing an app: it identifies the installed application.

Keep release inputs in the app's source resources:

| Input | Starter location | Before packaging |
| --- | --- | --- |
| iOS display name and version | `App_Resources/iOS/Info.plist` | Set `CFBundleDisplayName`, `CFBundleShortVersionString`, and `CFBundleVersion` |
| Android display name | `App_Resources/Android/src/main/res/values/strings.xml` | Create or edit the strings referenced by the manifest |
| Android version | `App_Resources/Android/app.gradle` | Increment `versionCode`; set the displayed `versionName` |
| Icons and launch appearance | `App_Resources/iOS/Assets.xcassets` and Android `src/main/res` | Supply your own assets at the required sizes |
| Permissions, callbacks and service configuration | iOS resources and Android `src/main/AndroidManifest.xml` | Include only what the app's enabled features need |

The Android starter references `app_name` and `title_activity_kimera`. Create
`App_Resources/Android/src/main/res/values/strings.xml` if it is absent, or edit
those entries in an existing resources file:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
  <string name="app_name">Packing List</string>
  <string name="title_activity_kimera">Packing List</string>
</resources>
```

For example, edit these values inside the existing Android `defaultConfig`
block. The integer identifies a build; the string is the version people see:

```groovy
// App_Resources/Android/app.gradle — inside android.defaultConfig
versionCode 2
versionName "1.0.1"
```

On iOS, edit the corresponding entries in the existing plist dictionary:

```xml
<key>CFBundleDisplayName</key>
<string>Packing List</string>
<key>CFBundleShortVersionString</key>
<string>1.0.1</string>
<key>CFBundleVersion</key>
<string>2</string>
```

Increase the build number before uploading another build. Keep your signing
keys outside the repository and back them up according to your team's release
process. Preserve the same application identity and signing relationship for
updates. Apple's [version/build guidance](https://help.apple.com/xcode/mac/current/en.lproj/devba7f53ad4.html)
explains the two iOS numbers.

## Build one release target

Choose a declared target explicitly so a release job does not build every
platform in the app:

```sh
bun run xplat build --targets android --release
# On a Mac with the iOS toolchain:
bun run xplat build --targets ios --release
```

Xplat regenerates routes and calls NativeScript's release build. Watch the
NativeScript output for its artifact path and signing requirements. **Build
complete** means the build process succeeded; it does not mean a store has
accepted the app or that a device can use every feature.

Store packaging needs additional NativeScript options. Xplat currently has
no artifact-format, signing or output options ([tracked in #68](https://github.com/octane-xplat/octane-xplat/issues/68)).
For the distribution steps below, regenerate routes first, then invoke the
NativeScript CLI installed in the app:

```sh
bun run xplat routes
```

This preserves route generation when you use the more detailed native command.
Do not add unsupported flags to `xplat build` or assume it forwards arguments
following `--`.

## Produce an Android App Bundle

An **App Bundle**, or `.aab`, is the upload artifact from which Google Play
produces device-specific installations. It is not installed directly like an
APK. Create an upload key using Android's [app-signing instructions](https://developer.android.com/studio/publish/app-signing),
or use your existing upload key for an update.

Have these four values available in your local release shell or restricted
build job. They are supplied by your key-management process, not by Xplat:

| Shell variable | Value |
| --- | --- |
| `ANDROID_UPLOAD_KEYSTORE` | Absolute path to your upload keystore |
| `ANDROID_UPLOAD_ALIAS` | Alias of the upload key inside it |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_PASSWORD` | Upload-key password |

For a local macOS shell, enter passwords without displaying them. Each `read`
waits for one password followed by Enter:

```sh
ANDROID_UPLOAD_KEYSTORE="$HOME/keys/packing-upload.jks"
ANDROID_UPLOAD_ALIAS="upload"
read -s ANDROID_KEYSTORE_PASSWORD
read -s ANDROID_KEY_PASSWORD
```

Use your real key path and alias. Run the signed build in that same shell:

```sh
bun run ns build android --release --aab \
  --key-store-path "$ANDROID_UPLOAD_KEYSTORE" \
  --key-store-alias "$ANDROID_UPLOAD_ALIAS" \
  --key-store-password "$ANDROID_KEYSTORE_PASSWORD" \
  --key-store-alias-password "$ANDROID_KEY_PASSWORD" \
  --copy-to dist/packing-release.aab
unset ANDROID_KEYSTORE_PASSWORD ANDROID_KEY_PASSWORD
```

The signing options are process arguments: use a trusted build machine, keep
shell tracing off, and do not copy password-expanded commands into logs. The
artifact should be `dist/packing-release.aab`; a signing or compilation error
must stop the release. See the [NativeScript Android publishing contract](https://docs.nativescript.org/guide/publishing/android-google-play)
for the installed toolchain's full signing/artifact options.

In Play Console, create the app record for this application ID, configure Play
App Signing, and create an **internal testing** release. Upload the AAB, review
its reported identity/version, add your testers, and share the track's opt-in
link. Install through that link and run the checks below. Follow Google's
[current testing-track instructions](https://support.google.com/googleplay/android-developer/answer/9845334)
for account eligibility, review, and progression to production.

## Archive the iOS app

Register the app's Bundle ID in your Apple Developer account and create its App
Store Connect record. Enable the capabilities your app uses, such as Sign in
with Apple or push notifications, and use a matching signing team/profile.
The bundle ID comes from `nativescript.config.ts`.

Prepare the release project from the app directory:

```sh
bun run xplat routes
bun run ns prepare ios --release
```

Open the generated `.xcworkspace` under `platforms/ios/` in Xcode; use the
`.xcodeproj` only when no workspace was generated. Select the application
target, choose your team under **Signing & Capabilities**, and resolve signing
errors. Choose a device distribution destination, then **Product → Archive**.
The archive should appear in Xcode's Organizer. This is the
[NativeScript iOS distribution path](https://docs.nativescript.org/guide/publishing/apple-app-store).

The archive is the result to retain for that release. Use Organizer's validation
and distribution workflow for App Store Connect, including symbols. Keep the
source resource files as the durable configuration: generated `platforms/`
projects can be recreated, so preserve any required signing or entitlement
change in your app's source configuration rather than relying on an untracked
edit to a generated project.

After Apple processes the upload, find the matching version/build in App Store
Connect. Configure a TestFlight tester group and install the distributed build
on an iPhone. Follow Apple's [upload workflow](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/)
and [TestFlight distribution steps](https://help.apple.com/xcode/mac/current/en.lproj/dev2539d985f.html)
for validation, processing, tester access, and review. Retain exported `.ipa`
files when your chosen distribution method produces them; an arbitrary `.app`
from a simulator build is not a store upload.

## Test the distributed build

Use the version installed from the test track, with the development server
stopped. Record the app version, device/OS, and result of each relevant check:

1. Cold-start the app and complete its main task. Check styling, fonts, bundled
   images and navigation; a development-only import must not be required.
2. Deny a requested permission, retry through the app's recovery path, then
   test with permission granted. Confirm the app explains unsupported features.
3. Save data, close and reopen the app, and verify it is still present. Install
   an update over the previous release and check the migration path as well.
4. Test sign-in, sign-out, incoming links and configured backend requests against
   the intended environment. Provider registrations must match the distributed
   app's identity and signing certificate.
5. Trigger a controlled handled error and verify the release can be identified
   in your reporting service. For paid features, complete the store's test flow
   and restore/recovery checks before submitting for production.

Do not remove a person's installed app just to clear a test failure: that can
delete their local data. Use a dedicated test installation/account for checks
that intentionally reset data. See [checking an app](../testing/testing.md)
for the rest of the feedback loop.

## Recover a failed release

| Symptom | Check next |
| --- | --- |
| Target unavailable | Run `xplat doctor`; confirm its native runtime dependency and host toolchain are installed |
| Unknown signing/AAB flag | Use the direct `ns` commands above; Xplat's wrapper currently accepts only target selection and `--release` |
| Signing or provisioning mismatch | Compare app ID, team/profile, capabilities and certificate used by the build |
| Store rejects the version | Increase the build number/version code and select the correct existing app record |
| Login or links work only in development | Check distributed bundle ID/package name, callback registration and Android signing fingerprints |
| App needs the dev server or loses styles | Inspect release bundle/configuration and [known limits](../testing/known-limits.md); reproduce with the packaged artifact |

For the next upload, make the correction in source, increase the build number,
rebuild, and repeat the distributed check. Store requirements change; use the
linked official pages when a portal or upload requirement differs. The commands
and resource paths here are checked against the framework source and CLI;
signed artifacts, provider accounts, and store distribution still require a
release run with your app's credentials.
