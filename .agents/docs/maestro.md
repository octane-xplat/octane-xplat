# Framework smoke runner

For CLI installation and app-owned flows, use the [public Maestro guide](../../docs/testing/maestro.md). This reference covers the repository fixture and its qualification limits.

Contributors can use the maintained counter app in `apps/maestro` and flow
in `.maestro/counter.yaml`. It has a separate app ID,
`org.nativescript.xplat.maestro`, and no timed harness self-tests.
From the repository root, install dependencies and choose an already-running
device. Replace `DEVICE_ID` in either command:

```sh
pnpm install
pnpm test:maestro --target ios --device DEVICE_ID
pnpm test:maestro --target android --device DEVICE_ID
```

The runner builds without HMR, installs the app on the selected device,
and runs the flow. It serializes native work through the repository target
lock. It does not start or shut down devices. Android builds on macOS need
JDK 21; iOS builds need Xcode and the NativeScript iOS prerequisites.
The flow expects fresh in-memory counter state after launch and stops the
app on success. A failed flow may leave the test app running.

For an existing build, pass an iOS simulator `.app` directory or an Android
`.apk` file. Paths are resolved from your current folder:

```sh
pnpm test:maestro --target android --device DEVICE_ID --artifact /tmp/counter.apk
pnpm test:maestro --help
```

For another app, supply its artifact, app ID, and flow together. The runner
installs or replaces that app, so select an app and device reserved for tests:

```sh
pnpm test:maestro --target android --device DEVICE_ID \
  --artifact /tmp/myapp.apk --app-id org.example.myapp \
  --flow .maestro/myapp.yaml
```

By default, JUnit results and Maestro debug artifacts go into a timestamped
folder under gitignored `research/maestro/<target>/`. Debug files can contain
screenshots and app data; keep them local unless you have permission to share.
The runner propagates build, install, and test failures as a nonzero exit.
For CI, provision the device and Maestro first, run the same command, and
collect the chosen output folder even when a test fails:

```sh
pnpm test:maestro --target android --device DEVICE_ID --output research/maestro/ci-android
```

**Qualification status:** the maintained flow and runner are a starting
point for mobile qualification. Android and iOS Maestro runtime passes
have not yet been recorded. A docs build or runner test does not establish
native UI compatibility. This smoke flow covers counter taps and updates;
forms, navigation, overlays, permissions, and release builds need their own
flows. Maestro also does not replace VoiceOver/TalkBack testing.
