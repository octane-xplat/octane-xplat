# Maintained checks and scope

For pinned CLI/MCP setup and app-owned journeys, use the [public Argent guide](../../docs/testing/argent.md). This reference owns the maintained regressions and target evidence.

From this repository's root, run the maintained DOM regression or its optional
pinned Argent journey. The latter launches isolated headless Chromium on CDP
port 19329, saves text/JSON locally, and closes its browser/server.

```sh
bun run --cwd apps/web node scripts/test-id.mjs
bun run --cwd apps/web node scripts/test-id.mjs --argent
bun run --cwd packages/ui vitest run --config vitest.native.config.mts src/test-id.mobile.test.tsrx
```

The maintained fixture is [TestID.tsrx](../../packages/ui/tests/fixtures/TestID.tsrx);
platform flows are [iOS](../../examples/automation/test-id-ios.yaml),
[Android](../../examples/automation/test-id-android.yaml), and
[Chromium](../../examples/automation/test-id-web.yaml). The mobile flows name
the isolated qualification app, `org.nativescript.xplat.laurencetestid`;
render the fixture in a buildable test shell with a NativeScript `RootLayout`
for overlays, or change the launch ID to your own test shell.

Qualification on 2026-10-08: iOS 27.0 simulator with NativeScript core 9.1.3
passed **28/28** Argent steps. UIKit inspection confirmed actual identifiers
and preserved labels. Chromium 153 passed **27/27** steps, including numeric typing and DOM-id
precedence; Android is not runtime-qualified in this run because build/device resource
admission was unavailable; NativeScript mapping source alone is not an OS pass. The journey covers
parent/child names, numeric input, counter and switch actions, retained-control
ID rebind/removal, and overlay close/reopen. Row, scroll-container and anchor
forwarding have source coverage; this journey does not exercise every host
variant. A maintained object-driver regression also checks item-key identity
and uniqueness through VirtualList recycling; this is renderer evidence, not
an OS recycling journey.

Physical devices, AppKit, IME composition, arbitrary alphabetic typing,
navigation journeys, permissions, and visual parity are unverified here.
Maestro qualification is separate; see [the Maestro guide](../../docs/testing/maestro.md).

## Test identifier mapping evidence

| Target                                            | Mapping                                              | Qualification                                                                                          |
| ------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| iOS simulator, NativeScript core 9.1.3            | UIKit `accessibilityIdentifier`                      | Actual UIKit hierarchy and Argent 0.27.0 ID replay/input passed                                        |
| Android emulator, NativeScript core 9.1.3         | Automation identifier in accessibility `resource-id` | Not runtime-qualified in this run: build/device admission unavailable; mapping is source evidence only |
| Chromium                                          | DOM `data-testid`; existing DOM `id` preserved       | DOM lifecycle regression and Argent 0.27.0 ID replay/input passed                                      |
| AppKit, other desktop renderers, physical devices | No qualification here                                | Do not assume support                                                                                  |
