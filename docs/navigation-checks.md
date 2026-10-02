# Verify release navigation

> Exercise router state and rendered text in release builds without screenshots.

The focused suite uses an isolated native app ID,
`org.nativescript.xplat.navigation`, and the minimal project in
`apps/mobile/navigation-project`. Its dependency links reuse the installed,
patched workspace packages. Optional service plugins, including Firebase, are
excluded from native preparation. The usual harness and its timer-driven probes are
not imported. It does not replace the data, input, list, or accessibility
suites.

## Run the checks

1. Install with `pnpm install --frozen-lockfile`. For native targets, ensure
   the usual NativeScript/Xcode/Android prerequisites are available. Android
   requires Temurin JDK 21; the runner resolves it with
   `/usr/libexec/java_home -v 21`.
2. Build the web harness and check its production assets:

   ```sh
   pnpm --filter @xplat/web exec vite build
   pnpm --filter @xplat/web exec node scripts/navigation.mjs
   ```

   The script serves `dist` on an ephemeral loopback port and drives Chromium.
   It checks named push/pop, cross-route state, guard redirects and history,
   programmatic routes/layouts, modal direct load, baked routes, and malformed
   incoming paths. It captures no images and does not use port 5200.

3. List native targets with `xcrun simctl list devices booted` or
   `adb devices -l`. Run one target at a time, replacing `DEVICE_ID`:

   ```sh
   cd apps/mobile
   python3 scripts/check-navigation.py ios DEVICE_ID
   python3 scripts/check-navigation.py android DEVICE_ID
   ```

   These commands take advisory `flock` locks through Python's `fcntl` at
   `/tmp/octane-xplat-ios.lock` or `/tmp/octane-xplat-android.lock`, held over
   build, install, launch, incoming links, and report collection. Every task
   using a target must honor the same lock. An occupied lock returns a
   blocked result without touching the target. The iOS runner uses
   `simctl install/openurl`, which launches an already installed app, rather
   than `ns run ios`. Android signs the release APK with an ephemeral test
   key; this is not production signing evidence.

Use `build-only` instead of `DEVICE_ID` to verify compilation when hardware
is unavailable. That mode never counts as runtime verification.

The native runner refuses to install over an already running copy of the
isolated app. It stops only the app it launched after collecting its report;
other apps, dev sessions, and their data are untouched. Generated logs and
JSON go to `apps/mobile/navigation-results/<target>/` (gitignored). iOS also
writes the generated report inside that app's Documents directory because
release console output is not a reliable evidence channel.

## What counts as evidence

Each named check must pass and the report must finish with `pass: true`.
A successful build or living process is insufficient. The 2026-09-30 isolated
iOS release built and installed but returned no report; a direct diagnostic
`simctl launch` was denied by `SBMainWorkspace`
(`FBSOpenApplicationServiceErrorDomain`, code 1). Preserve that launch error
as a blocker rather than inferring a JavaScript or router failure. Timeouts and unavailable
signing, hardware, SDKs, or locks are blocked runs, never passes.

Android named stacks are router arrays rendered by `RouteHost`. The suite
checks `routeFor`, `canGoBack`, text, and restored base panes; it does not
expect a named pushed `Page` or `Frame.backStack`. Root navigation still uses
a Frame. Android back checks inject the NativeScript activity-back event,
including newest-first interceptors, modal/root/named ordering, and base
fall-through. This exercises the framework listener; physical hardware-button
and predictive-back dispatch remain separate verification.

The iOS-specific sequence mounts `UITabBar`, reassigns its items and switches
its selection repeatedly,
and verifies item identity and named Frame push/pop bookkeeping. The shared
Tabs sequence verifies retained route entries across tab switches, not local
component state in unmounted panes. Incoming-link checks use real OS commands
for cold launch and two identical warm deliveries.

The historical baseline harness has concurrent fixed timers. A failure there
must be reproduced in isolation before assigning it to a component. Navigation
checks do not establish passes for pressable hit testing, signals, styled
variants, switch, drawer, animation, data, or accessibility. Keep their findings
in the Silo baseline question with target, revision, reproduction and log
references; preserve unresolved reports when native execution is blocked.
