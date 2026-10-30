# Probes and regression tests

Paths in code spans refer to the repository root. Read this reference when its
subject applies to your task; [AGENTS.md](../../AGENTS.md) is the entry point.

Use [single-case probing](probing.md) for platform investigations:
`pnpm probe doctor` and `pnpm probe run <case> --target <target> --watch`.
For Android emulator setup, device isolation, and verified host commands, use the
[Android lab log](android-lab.md).

Prefer an isolated case over editing the harness or running a full sweep just
to answer one question. Windows is excluded from this runner.

On shared test hosts, follow the [temporary-file convention](host-artifacts.md):
one disposable scratch tree per task, with implementation work and retained
evidence outside it.

## AppKit component tests

The UI's native test task has separate mobile and AppKit Vitest modes. Select
AppKit explicitly so unsuffixed imports use macOS leaves and `macos` package
conditions. The default mobile mode excludes the AppKit test patterns; those
cases remain owned by the AppKit command, not silently treated as passing.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/input-number.macos.mobile.test.tsrx
```

The existing Node-test prelude still runs. Turbo may prepare dependency builds
and generated declarations; the target variable is declared in the UI task's
environment hash. Vitest cases use the object driver and cannot establish OS
input, AppKit layout, VoiceOver or packaged behavior. Omit the variable (or set
it to `mobile`) for the existing mobile Vitest suite. The configuration rejects
other values.

## Web browser end-to-end tests

The UI's web unit suite uses jsdom and runs in the normal `pnpm test` and PR
checks. Run it alone through Turbo; the task prepares its declarations first.
These checks do not launch a browser or establish layout and OS input behavior.

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui
```

Fast CI runs web builds, typechecks, unit tests, package integrity checks, and
one packed web consumer smoke without launching desktop browsers. Stable CI
adds the exhaustive non-browser packed consumers and full app/library starter
journey on the `release/lockstep` pull request. See [release gates](releases.md)
for their evidence requirements.
The longer Playwright coverage runs locally across
Chromium, Firefox, and WebKit with:

```sh
pnpm test:e2e
```

The command installs Playwright's browser binaries when needed, then runs the
web input/accessibility, SQLite worker, platform sheet, app smoke, optional
service, and packed-consumer browser checks. It does not install operating
system libraries; install Playwright's host dependencies if a local browser
cannot launch. CI release evidence covers the `checks` job and native builds;
it no longer implies that this local-only browser suite passed.

Probes are temporary by default; keep task-specific cases in gitignored
`research/`. The runner and `examples/probes/` are maintained tooling fixtures.
Retain another probe only when it has an ongoing diagnostic purpose and a clear
owner. A retained probe is not automatically regression coverage.

When a probe establishes behavior we need to preserve, promote it into a
maintained test: focused unit/component tests for logic and component behavior,
targeted harness tests for platform integration and lifecycle behavior, and
harness sweeps for broad cross-platform coverage. Record the targets actually
run; handler dispatch does not prove OS input or hit-testing.

## Mobile end-to-end tests with Maestro

Recommend Maestro for Android/iOS journeys that must exercise OS input and
hit-testing. Use the [official guide](../../docs/testing/maestro.md) and maintained
`.maestro/counter.yaml` flow. A NativeScript Maestro plugin is not required.
Keep object-driver unit tests and synthesized probe dispatch for their own
contracts; they do not establish a Maestro pass.

```sh
pnpm test:maestro --target ios --device DEVICE_ID
pnpm test:maestro --target android --device DEVICE_ID
```

- Reserve host resources before native builds/device use when a broker is
  available. Acquire the full set once around the runner: native build slot
  plus the selected device's exclusive key and resident-device slot. Use
  already-running devices only when you own or are authorized to use them.
  The runner's repository target lock complements the host reservation.
- Use unique visible text first. Do not assume `ViewProps.id` maps to Maestro
  IDs on either OS. Shared `testID` is qualified separately from Maestro in
  [stable test names](../../docs/testing/test-identifiers.md).
  Preserve useful spoken accessibility labels.
- Arrange deterministic data; assert state before and after each action.
  Use condition waits, not fixed sleeps or optional assertions that hide
  failures. Never clear user-owned app data to make a flow pass.
- Prefer textual hierarchy and logs for debugging. Do not capture/open images
  without visual-analysis authorization when required by the user's rules.
  Maestro may produce failure images automatically; keep them uninspected.
- Report target, device, build artifact, command, assertions and exit status.
  Mark unavailable targets unverified. Source inspection, mock runner tests,
  and docs builds are not mobile runtime evidence. The initial smoke flow
  remains unqualified until Maestro passes on Android and iOS.
- CI can use the same runner with `--output`; collect JUnit/debug artifacts
  only under the project's data-sharing policy. No Cloud upload is needed.

## Optional Argent checks

Use [the pinned nonvisual Argent recipe](../../docs/testing/argent.md) for
optional AI-agent browser/device control through MCP and local CLI replay.
Preserve spoken labels and roles; use shared `testID` only on documented hosts.
Discovery is not replay readiness, and Chromium DOM IDs take precedence.

## On-device unit tests (`ns test`, Vitest)

`apps/mobile` runs `@nativescript/unit-test-runner` — Vitest orchestrates on
the host and a WebSocket bridge executes specs inside the real app runtime
(V8/JSC + native bridge + UI layer). `ns test <platform>` runs
`vitest run` with `NS_PLATFORM`/`NS_DEVICE`; the plugin launches
`ns run <platform> --no-hmr --env.unitTesting`.

```sh
pnpm --filter @xplat/mobile test:ios -- --device DEVICE_UDID
pnpm --filter @xplat/mobile test:android -- --device DEVICE_ID
# or directly: cd apps/mobile && NS_PLATFORM=ios npx vitest run
```

- Specs live in `apps/mobile/src/**/*.spec.{ts,tsx,tsrx}`; the test entry
  `src/test.ts` bundles them via `import.meta.glob` into the device registry.
  Keep the glob and `vitest.config.mts` `include` in sync — a spec the glob
  misses cannot load on device (the host reports "was not bundled").
  Rolldown's glob has no extglob `@(a|b)` support — use brace `{a,b}`.
- The `xplatNative` preset handles `--env.unitTesting`: it swaps the bundle
  entry to `src/test.ts` (the vite counterpart of the upstream webpack
  helper), aliases `vitest` imports to the device-safe shim, and injects
  `__NS_TEST_CONFIG__` (runner port). No per-app wiring is needed.
- Mount Xplat components with `mountXplat(Component, props?)` from
  `@octane-xplat/platform/testing` — it wraps `renderNativeScriptApp` +
  upstream `mount()`, auto-unmounts at test finish, and unmounts the
  previous root on re-mount (no leaked subscriptions/delayed work). The same
  module re-exports upstream `tap()`/`enterText()`/`waitUntil()` and adds
  `viewText`/`findByTestId` tree queries; dispatch through gesture observers
  proves the observer path, NOT OS hit-testing (that remains Maestro's lane).
- New apps include test setup by default:
  `src/test.ts`, `vitest.config.mts`, a starter `src/app.spec.tsrx`, the
  selected `test:ios`/`test:android` scripts, and runner devDeps from
  `packages/create/template/`. The iOS platform template
  already carries the scoped `NSAllowsLocalNetworking` ATS exception.
  `xplat add ios`/`android` also adds its matching test setup.
  `ns test android` shares the setup but is unverified (lane qualified on iOS
  only). Web testing is separate (`vitest.web.config.mts`, `*.web.test.*`)
  so DOM tests do not enter the device bundle.
- `node scripts/verify-consumer.ts --test-ios` runs the scaffolded suite in
  a packed consumer (boots/selects an iPhone sim, `VERIFY_IOS_DEVICE` pins a
  UDID) — exercises the packed cli overlay, packed platform `/testing`, and
  the consumer's App_Resources.
- `node scripts/verify-consumer.ts --test-android` requires
  `VERIFY_ANDROID_DEVICE` naming an already-booted, owned/authorized host and
  `adb` on PATH. Reserve `native_builds:1`, `resident_devices:1`, and
  `exclusive:["android:<AVD>"]` around the command. It uses a disposable app
  identity, resets only that identity on reuse, and verifies its process stops.
  This is a qualification command; configuration alone does not establish an
  Android pass. The mandatory all-package build/pack gates remain intact.
- Stable CI: on the `release/lockstep` pull request, `native-ios-tests`
  (`stable.yml`, macos-latest) boots an iPhone sim and runs the apps/mobile
  suite inside `with-target-lock ios`. Stable evidence requires it; nightly
  publication does not wait for it.
- `connectTimeout` in `vitest.config.mts` covers `ns run`'s native build on
  first run — cold builds exceed the 120s default.
- Xcode 27 caveat (this repo's CI lane): Simulator.app is gone, so
  `ns run ios` can only target an already-booted simulator — `xcrun simctl
boot <udid>` first, then pass `--device <udid>`. `ios-sim-portable` 4.5.1
  (bundled in global CLI 9.1.1) cannot boot devices itself here.
  `xplat dev` and owned iOS session launches now prepare the selected simulator
  with `simctl boot` and `bootstatus -b` before invoking NativeScript, bypassing
  that upstream GUI dependency. Direct `ns run`/`ns test` still needs the
  manual pre-boot. Evidence: the selected partial Xcode has no Simulator.app;
  `ios-sim-portable`'s `startSimulator` constructs that path and calls `open`.
  The workaround applies only when simctl recognizes the selected device; it
  does not repair missing SDKs, runtimes, or a broken simctl installation.
  Remove it when NativeScript's simulator launcher no longer requires the GUI.
- iOS needs `NSAllowsLocalNetworking` (set in the harness Info.plist) for the
  loopback `ws://127.0.0.1` bridge; Android needs the scoped cleartext
  exception `ns test init` installs.
- Qualified on: unit-test-runner 5.0.0 + vitest 4.1.11 + @nativescript/core
  9.1.3 + @nativescript/vite 8.0.17 + CLI 9.1.1, iOS 27.0 simulator. The
  committed `it.fails` spec pins that failed assertions on device report as
  Vitest failures, not passes.

## NativeScript dev-server module transform (@nativescript/vite)

In HMR dev sessions the runtime fetches modules from `/ns/m/<vite-url>`,
rewritten by `hmr/server/process-code-for-device.js` (verified in
@nativescript/vite 8.0.17): injected preludes (`import.meta.hot`/`env`
assignments, require guard, vendor import rewrites to absolute device URLs)
shift device line numbers non-uniformly relative to Vite's transformed output,
and the served code carries no source map. Two consequences observed on a
physical Android device (OnePlus CPH2551, `xplat dev`):

- Bundler `define` entries arrive as module-scope `const` bindings, not
  `globalThis` properties — `globalThis.__XPLAT_DEV_BRIDGE__` is undefined on
  device even though the define is configured. Local workaround:
  `packages/platform/src/dev-bridge.ts` reads the bare identifier first.
- Dev-action failure stacks report `/ns/m/...` positions that no source map
  can resolve directly. Local workaround: `xplatDevBridge` (cli) fetches the
  device module, matches the frame line to the transformed code by trimmed
  line text (device uses spaces, Vite tabs), then applies Vite's map — an
  occasional ambiguous or short line stays raw. Workspace packages outside the
  app root arrive as `/ns/m/<workspace-relative path>`, so the resolver
  re-anchors them at the nearest ancestor holding the file and transforms the
  `/@fs/<abs>` form.

Revisit if upstream ships device-side source maps or a stable line mapping.

## Focused verification references

- [Release navigation](navigation-checks.md) — isolated web and native release checks.
- [Maestro smoke runner](maestro.md) — fixture, artifacts, and qualification limits.
- [Argent checks](argent.md) — stable-ID lifecycle regressions and dated target evidence.
- [Packed Android starter](android-starter-tests.md) — selected-host consumer test gate.
- [AppKit verification](appkit-verification.md) — layout, overlays, and packed-consumer scope.
