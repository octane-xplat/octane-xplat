# Android emulator lab log

Internal host setup and verification record. Use [single-case probing](../../docs/probing.md)
for the runner contract; this note supplies the local Android setup it expects.

## Host inventory (2026-10-02)

- macOS arm64. `ANDROID_HOME` and `ANDROID_SDK_ROOT` point to
  `$HOME/Library/Android/sdk`.
- SDK command-line tools 22.0, emulator 37.1.11, platform-tools 37.0.1.
  `sdkmanager` and `avdmanager` are in `cmdline-tools/latest/bin`;
  the emulator exists in `emulator/` but was absent from PATH.
- Platforms 34–37 and build-tools 34–36.1 are installed. The only installed
  system image is `system-images;android-35;google_apis;arm64-v8a` (revision 9).
  API 34 has a platform package, but no emulator system image.
- JDK 21.0.12.1 (Temurin) is installed in the user Library. JDK 25 is also
  installed; the runner selects JDK 21 on macOS.
- Both `avdmanager list avd` and `emulator -list-avds` initially returned no
  AVDs. The former `tiptap-verify` AVD was absent. Created
  `octane-prime-larkspur` with the installed API 35 arm64 image.
- adb servers already listen on 5037 and 5039. A physical phone was also
  listed on 5037, so choosing that server alone does **not** isolate devices.
  All device operations below select `emulator-5556`. Port 5039 was untouched.

## Working recipe

Run from the repository root. An AVD is an Android Virtual Device: its own
emulated phone and persistent data. Give each worktree a distinct AVD and
choose an unused even console port (5556 here; adb uses the next port).
Do not reuse an AVD already running for another task.

1. Prepare this shell and inspect installed tools/devices:

   ```sh
   export ANDROID_HOME="$HOME/Library/Android/sdk"
   export ANDROID_SDK_ROOT="$ANDROID_HOME"
   export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
   export JAVA_HOME="$(/usr/libexec/java_home -v 21)"
   export ANDROID_ADB_SERVER_PORT=5037
   export ADB_SERVER_SOCKET=tcp:localhost:5037
   sdkmanager --list_installed
   avdmanager list avd
   emulator -list-avds
   adb devices -l
   ```

2. If your own AVD does not exist, create it using the installed image:

   ```sh
   printf 'no\n' | avdmanager create avd --name octane-prime-larkspur \
     --package 'system-images;android-35;google_apis;arm64-v8a'
   ```

   Substitute your worktree's AVD name in creation and boot commands. Do not
   use `--force` to overwrite an existing AVD. If the image, JDK, SDK packages,
   or accepted licenses are missing, report that setup blocker rather than
   silently installing system components or accepting licenses.

3. Boot in a separate terminal with the same shell environment, after checking
   that console port 5556 and adb port 5557 are free:

   ```sh
   emulator -avd octane-prime-larkspur -port 5556 \
     -no-window -no-audio -no-snapshot -gpu swiftshader
   ```

   This headless run needs no screenshots. Check readiness in the first terminal:

   ```sh
   adb -s emulator-5556 wait-for-device
   adb -s emulator-5556 shell getprop sys.boot_completed
   ```

   Wait until the property prints `1`; `device` alone does not mean boot finished.

4. Initialize pinned vendor sources, install the workspace, and run the doctor
   and maintained cases:

   ```sh
   git submodule update --init
   pnpm install --frozen-lockfile
   pnpm probe doctor
   pnpm probe run examples/probes/signals.ts --target android --device emulator-5556 --verbose
   pnpm probe run examples/probes/counter.tsrx --target android --device emulator-5556 --verbose
   ```

   Success is exit 0 and JSON with `target: "android"`,
   `device: "emulator-5556"`, `status: "pass"`, passing assertions, and no
   errors. The result includes the native host and interaction mechanism.
   For iteration add `--watch`; Ctrl-C stops the runner's session.

5. When finished, stop only your emulator:

   ```sh
   adb -s emulator-5556 emu kill
   ```

   Keep the AVD for future runs. Do not kill adb servers or stop other devices.

## Build and session pitfalls

- NativeScript's build doctor invokes `$ANDROID_HOME/emulator/emulator -help`.
  An installed emulator that cannot execute can block even a build-only lane.
  `NS_SKIP_ENV_CHECK=1 pnpm exec ns build android` is the supported escape for
  build-only work after prerequisites are checked; it does not boot a device,
  establish runtime evidence, or fix missing SDK/JDK components.
- The runner takes `/tmp/octane-xplat-android.lock` through
  `scripts/with-native-target-lock.py`. iOS has a separate lock. A busy Android
  target must wait for its owner; do not delete shared lockfiles. The runner
  also owns its case lock, app lifetime, and adb reverse mapping.
- NativeScript extracts bundled assets on first install. `adb install -r`
  preserves that extraction and can execute stale code. The isolated runner
  fingerprints native builds into distinct app IDs and installs an absent app;
  it does not automatically uninstall existing apps. For a manually rebuilt
  app with the same ID, uninstall **only your disposable probe app** and perform
  a clean install. Uninstalling deletes its data; never do this to a shared app.
- A fresh checkout's frozen install initially failed because `pnpm-lock.yaml`
  repeated `@octane-xplat/ui` under `packages/files` devDependencies. Removing
  the identical duplicate fixes parsing without dependency resolution changes.
  Postinstall then needed `git submodule update --init` for the pinned SVG and
  Lottie vendor checkouts.
- After submodule initialization, dependency installation completed but the
  repository postinstall still failed in `packages/icons` typegen:
  `TS2875` for `@xplat/macos/renderer/jsx-runtime`, and `TS2786` for the macOS
  `Image` component. This is a remaining full-workspace setup gap; the Android
  lane uses the installed dependencies and does not establish a successful
  clean workspace install.

## Runtime evidence

Evidence type: `lab-experiment`, Android API 35 Google APIs arm64 on
`octane-prime-larkspur` / `emulator-5556`, 2026-10-02. No visual analysis,
physical-device interaction, or iOS run was used for this verification.

The initial `examples/probes/signals.ts` run built, installed, and launched a
fresh APK and returned `status: "pass"`, one passing assertion
(`signal updates in the target runtime`, actual/expected `2`), and no result
errors. NativeScript also logged a CSS error for `cache/probe.css` outside
`files/app`; this was nonfatal and did not prevent the signal assertion.
The probe host now writes CSS into `knownFolders.currentApp()` and loads
`~/probe.css`, satisfying Android's app-root path requirement.

The rebuilt host's signals run passed the same assertion (86 ms) without the
CSS path error in its process log. Successful completion was captured both
in the runner JSON and Android logcat. A network error appeared during
shutdown after the result had arrived; it was not an assertion failure.

Shutdown exposed a separate lock-wrapper problem: Python's `subprocess.call`
received `KeyboardInterrupt`, killed the child before cleanup finished, and
left the owned adb reverse mappings. The wrapper now forwards interruption
signals and waits for the child while holding its lock. A maintained process
regression test verifies that another session cannot acquire the lock during
cleanup and can acquire it afterward.

The maintained counter example initially failed compilation because it still
imported the removed `Column` alias. It now uses the current `VStack` export.

After the fixes, `examples/probes/counter.tsrx` returned `status: "pass"`
(exit 0, 360 ms) with two passing assertions: `initial count` (`"0"`) and
`count after press` (`"1"`), and no result errors. The interaction mechanism
was `gesture-observer-dispatch`. The app process was absent after shutdown,
`adb -s emulator-5556 reverse --list` was empty, and stderr contained no
Python interruption traceback. The two mappings leaked by earlier runs
were explicitly removed only on this task's emulator.

Validation: 12 tests passed across `scripts/probe.test.mjs` and
`scripts/native-target-lock.test.mjs`; focused JavaScript lint, formatting,
`git diff --check`, and `pnpm check:recipes` passed. The affected recipe is
`probe-platform-case` (Android setup, current maintained example, and session
cleanup). Watch edits, extra dependency/resource integrations, other Android
API levels, OS touch input, hit-testing, and visual layout were not verified.
The counter inspection returned zero geometry while confirming text changes;
this is not layout evidence. Full-workspace postinstall remains blocked by
the macOS icon type-generation errors above.
