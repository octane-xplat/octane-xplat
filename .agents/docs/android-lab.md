# Android probe host setup

Use [single-case probing](probing.md) for runner behavior and
[Android starter tests](android-starter-tests.md) for packed-consumer checks.
This guide describes an isolated host; inspect current tools and devices rather
than relying on a saved machine inventory.

## Working recipe

Run from the repository root. An AVD is an Android Virtual Device: its own
emulated phone and persistent data. Give each worktree a distinct AVD and
choose an unused even console port (5556 here; adb uses the next port).
Do not reuse an AVD already running for another task.

For an unregistered Homebrew JDK, set its location before the recipe. The
doctor checks its major version; a configured JDK 25 is rejected rather than
silently replaced.

```sh
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
```

1. Prepare this shell and inspect installed tools/devices:

   ```sh
   export ANDROID_HOME="$HOME/Library/Android/sdk"
   export ANDROID_SDK_ROOT="$ANDROID_HOME"
   export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
   export JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home -v 21)}"
   export ANDROID_ADB_SERVER_PORT=5037
   export ADB_SERVER_SOCKET=tcp:localhost:5037
   sdkmanager --list_installed
   avdmanager list avd
   emulator -list-avds
   adb devices -l
   ```

2. If your own AVD does not exist, create it using an installed image (this
   example requires the API 35 Google APIs arm64 image):

   ```sh
   printf 'no\n' | avdmanager create avd --name xplat-probe \
     --package 'system-images;android-35;google_apis;arm64-v8a'
   ```

   Substitute your worktree's AVD name in creation and boot commands. Do not
   use `--force` to overwrite an existing AVD. If the image, JDK, SDK packages,
   or accepted licenses are missing, report that setup blocker rather than
   silently installing system components or accepting licenses.

3. Reserve the owned emulator, then boot it in a terminal with the same shell
   environment after checking that ports 5556 and 5557 are free. In Goddard,
   start a reserved shell and run the remaining boot/probe/shutdown steps there:

   ```sh
   goddard-agent resource run --json '{"resources":{"resident_devices":1,"exclusive":["android:xplat-probe"]},"purpose":"Android probe"}' -- zsh
   emulator -avd xplat-probe -port 5556 \
     -no-window -no-audio -no-snapshot -gpu swiftshader &
   ```

   This headless run needs no screenshots. Check readiness in the reserved shell:

   ```sh
   adb -s emulator-5556 wait-for-device
   adb -s emulator-5556 shell getprop sys.boot_completed
   ```

   Wait until the property prints `1`; `device` alone does not mean boot finished.

4. Initialize pinned vendor sources, install the workspace, and run the doctor
   and maintained cases:

   ```sh
   git submodule update --init
   bun install --frozen-lockfile
   bun run probe doctor
   bun run probe run examples/probes/signals.ts --target android --device emulator-5556 --verbose
   bun run probe run examples/probes/counter.tsrx --target android --device emulator-5556 --verbose
   ```

   Success is exit 0 and JSON with `target: "android"`,
   `device: "emulator-5556"`, `status: "pass"`, passing assertions, and no
   errors. The result includes the native host and interaction mechanism.
   For iteration add `--watch`; Ctrl-C stops the runner's session.

5. When finished, stop only your emulator:

   ```sh
   adb -s emulator-5556 emu kill
   ```

   Keep the AVD for future runs. Exit the reserved shell after shutdown. Do not
   kill adb servers or stop other devices. Reserve `native_builds: 1` for a compilation phase when
   needed; release build capacity when compilation ends.


## Build and session pitfalls

- Use JDK 21 and explicit device selection. A connected physical device can share
  an adb server with emulators; a server port does not isolate the target.
- NativeScript's build doctor invokes the emulator executable even for some
  build-only lanes. A build result never establishes runtime behavior or repairs
  missing SDK/JDK components.
- The runner owns target/case locks, app lifetime, and adb reverse mappings.
  Wait for another owner; never delete shared lockfiles. Allow interrupted
  processes to complete cleanup before releasing ownership.
- NativeScript extracts assets on first install. `adb install -r` can preserve
  stale extracted code. Use the runner's fingerprinted disposable app identity.
  A manual clean install may remove only your disposable probe app, with its
  data loss understood; never uninstall a shared app to refresh a fixture.
- Initialize pinned submodules before a frozen install. A focused Android lane
  does not establish that full-workspace postinstall or other platforms pass.

## Consumer test qualification

Use `scripts/verify-consumer.ts --test-android` through its maintained workflow;
`scripts/verify-android-tests.ts` owns target selection, readiness, disposable
identity, and teardown. Qualification requires the complete component/native API
suite, an ordinary deliberately failing assertion returning nonzero, repeated
cleanup, and a suite/app completion result. A build or daemon interruption is
not that result. Report gesture-observer dispatch separately from actual OS
input. Follow the current task's device permissions, not historical lab directives.

## Evidence lookup

Past machine inventories, attempted runs, and setup failures are indexed by Silo
`local_artifacts` key `.agents/docs/android-lab.md`. Follow
[operational evidence](exploration.md#operational-evidence); keep new results in
Silo and local reports.
