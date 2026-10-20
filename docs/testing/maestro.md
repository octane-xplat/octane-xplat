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
Shared `testID` has [separate Argent qualification](test-identifiers.md);
that evidence does not establish a Maestro pass.
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

## Qualification limits

Xplat's maintained Maestro flow has no recorded Android or iOS runtime pass
yet. Verify your own journey on each target before relying on it. Maestro
also does not replace VoiceOver/TalkBack testing. Framework contributors can
use the [smoke runner and qualification record](../../.agents/docs/maestro.md).

## Ask an agent to maintain a journey

Give the agent an action and expected screen, plus the targets you ship:

```text
Add a Maestro flow that opens my packing list, adds Passport, packs it,
and checks that the remaining count decreases. Run it on Android and an
iOS simulator. Use unique visible text, wait for results, and report the
selected device, build, commands, and assertions. If a target cannot run,
say why and leave its runtime status unverified.
```

Framework contributors should follow the
[internal testing guidance](../../.agents/docs/testing.md#mobile-end-to-end-tests-with-maestro)
for device ownership and resource reservations.
