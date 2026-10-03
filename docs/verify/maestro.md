# Test phone journeys with Maestro

> Repeat a tap-and-check journey on Android and iOS, and save the result so
> you can catch regressions after changing your app.

**We recommend Maestro for end-to-end tests of Octane Xplat phone apps.**
An end-to-end test opens the installed app, performs actions a person would
perform, and checks the resulting screen. Maestro works through the native
UI and accessibility layers; you do not need a NativeScript plugin or an
Octane Xplat runtime dependency. NativeScript also recommends it in its
[testing guide](https://docs.nativescript.org/guide/testing).

Use Maestro for repeatable mobile journeys alongside your code checks.
Keep browser tests in your browser test runner. Maestro supports Android
emulators and physical devices, and iOS simulators; this guide does not
claim support for physical iPhones or Xplat desktop targets.
See [Maestro's supported platforms](https://docs.maestro.dev/get-started/supported-platform).

## Run your first flow

A **flow** is a YAML file: a readable list of actions and expected results.
Start with a counter so you can see whether the tap changes the screen.

1. Install the [Maestro CLI](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli)
   using its current platform instructions. Confirm it is available in your
   terminal:

   ```sh
   maestro --version
   ```

2. Build and install your phone app, then leave its simulator, emulator, or
   Android device running. Use the phone setup from [the toolchain guide](../start/toolchain.md).
   Choose a test device and test account: flows can change the app's data.
   Find the selected device's ID:

   ```sh
   maestro list-devices
   ```

3. In your app folder, create `.maestro/counter.yaml`. This example expects
   a screen with an “Increment” button and a counter initially showing
   “Count: 0.” Replace `org.example.myapp` with the `id` from your
   `nativescript.config.ts`, and adapt the text to your actual screen.

   ```yaml
   appId: org.example.myapp
   ---
   - launchApp
   - assertVisible: 'Count: 0'
   - tapOn: 'Increment'
   - assertVisible: 'Count: 1'
   - stopApp
   ```

4. Replace `DEVICE_ID` with the ID from step 2, and run the flow from your
   app folder:

   ```sh
   maestro --device DEVICE_ID test .maestro/counter.yaml
   ```

   Success means every action and assertion passes and the command exits
   with status 0. Run the same journey separately on Android and iOS.
   A passing run on one platform does not establish the other.

## Choose reliable checks

Start with unique visible text. Maestro text selectors are regular
expressions; escape punctuation when you need a literal match. Assert the
result of an action, rather than only checking that the target was tapped.

```yaml
- tapOn: 'Increment'
- assertVisible: 'Count: 1'
```

Assertions wait for their expected text. For a genuinely slow operation,
use a bounded condition wait instead of a fixed sleep:

```yaml
- extendedWaitUntil:
    visible: 'Saved'
    timeout: 15000
```

An Xplat view's `id` is useful for framework probes, but its mapping to
Maestro's native ID selector has not been qualified on both mobile targets.
Do not assume a web ID or NativeScript view ID is a Maestro identifier.
Before using IDs for icon controls or translated screens, verify the actual
native accessibility identifier on each target. Keep spoken accessibility
labels meaningful to people; do not replace them with testing strings.
See [Maestro selectors](https://docs.maestro.dev/maestro-flows/flow-control-and-logic/how-to-use-selectors).

```yaml
# Use only after verifying this identifier in the target's native tree.
- tapOn:
    id: 'save-action'
```

Keep flows independent. Arrange known test data, launch the app, perform a
short journey, and assert the final result. Launching the app does not
reset persisted data. Avoid clearing a person's app data as a shortcut;
use dedicated test accounts or an isolated test app.

```yaml
appId: ${APP_ID}
---
- launchApp
- assertVisible: 'Count: 0'
- tapOn: 'Increment'
- assertVisible: 'Count: 1'
- stopApp
```

## Framework smoke runner

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

## Ask an agent to maintain a journey

Give the agent an action and expected screen, plus the targets you ship:

```text
Add a Maestro flow that opens my packing list, adds Passport, packs it,
and checks that the remaining count decreases. Run it on Android and an
iOS simulator. Use unique visible text, wait for results, and report the
selected device, build, commands, and assertions. If a target cannot run,
say why and leave its runtime status unverified.
```

Agents working in the framework should follow the
[testing guidance](testing.md). Device ownership and
resource reservations apply to Maestro just as they apply to other native
runs. Inspect textual hierarchy and logs first; image inspection still
requires the user's approval when their task instructions require it.
