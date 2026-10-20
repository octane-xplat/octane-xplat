# Choose checks for the behavior changed

## Consumer apps

The starter includes managed tests for enabled platforms. Run web tests locally;
phone tests require a selected simulator/device and the native toolchain. Follow
[app testing](../../../../docs/testing/testing.md#add-automated-tests) when adapting
the samples or adding a target.

```sh
pnpm test:web
pnpm test:ios -- --device DEVICE_UDID
pnpm test:android -- --device DEVICE_SERIAL
```

Give meaningful controls and asserted state stable semantic `testID` values.
Use durable item keys, preserve useful spoken labels/roles, and verify forwarding
through composite components. Supported hosts and mappings are listed in the
[test identifiers guide](../../../../docs/testing/test-identifiers.md); a prop in
an inherited interface alone does not prove target support.

```tsx
import { Button } from '@octane-xplat/ui'

export function AddItem() {
	return <Button testID="packing.add-item" label="Add item" accessibilityLabel="Add item" />
}
```

## Framework investigations

Use an isolated probe for a single case. Research probes are temporary;
promote behavior that must remain correct into maintained tests. The runner
supports web, iOS, Android, macOS, and Linux, not Windows. Read
[probing](../../../docs/probing.md) for target-specific prerequisites.

```sh
pnpm probe doctor
pnpm probe run examples/probes/counter.tsrx --target web --watch
```

Choose the narrowest maintained layer that can establish the claim:

| Layer                    | Repository command                                           | Evidence boundary                                                        |
| ------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Package types            | `pnpm exec turbo run typecheck --filter=...@octane-xplat/ui` | Types for the touched package and dependents; no runtime claim           |
| Shared/native unit tests | `pnpm --filter @octane-xplat/ui test:native`                 | Node and compiled object-driver regressions; no OS host/input claim      |
| DOM seam check           | `pnpm check:no-dom`                                          | Forbidden DOM usage in native/shared code                                |
| Web harness smoke        | `pnpm smoke:web`                                             | Browser behavior covered by the local smoke script                       |
| Packed starter           | `pnpm check:consumer --no-build --quick`                     | Prepared tarballs, isolated install, declarations, and compilation       |
| Optional adapters        | `pnpm check:optional-services --types-only`                  | Adapter types; the full command additionally needs browser prerequisites |
| Native probe/device test | Probe runner or maintained `ns test` suite                   | Only the assertions and target actually executed                         |

PR `checks` excludes browser engines, browser-driven suites, and device
emulation. Do not infer their success from green CI. See
[release validation](../../../docs/releases.md) for nightly/stable coverage and
[contributor testing](../../../docs/testing.md) for fixture ownership and commands.

## Input, lifecycle, and runtime evidence

Calling registered gesture observers or `view.notify` establishes handler
behavior; it does not establish coordinate hit-testing or OS input. Assert
rendered content and state rather than render counts. Await the relevant
mount/navigation/attach condition; do not mask lifecycle races with larger fixed
delays. A stale detached view can still accept a synthetic notification.

Use role/name locators for browser controls and qualified IDs for repeated
journeys. A semantic button is not necessarily a DOM `<button>`.

```js
// Playwright test with an established page fixture.
await page.getByRole('button', { name: 'Add', exact: true }).click()
```

Launching a process without fatal logs is a startup check, not release feature
verification. Release checks must assert the behavior being claimed using
observable state/results; debug log disappearance alone is inconclusive.
Report source/build, object-driver, browser, and device evidence separately,
including target and any unavailable checks. Do not claim pixel parity or OS
accessibility from handler dispatch or typechecking.

## End-to-end journeys

Follow the [framework Maestro runbook](../../../docs/maestro.md) and its current
qualification limits for iOS/Android journeys. The managed fixture avoids the
self-driving harness timers. Choose a device explicitly and follow the
[device ownership guidance](../../../docs/testing.md#mobile-end-to-end-tests-with-maestro).

```sh
pnpm test:maestro --target ios --device DEVICE_UDID
pnpm test:maestro --target android --device DEVICE_SERIAL
```

For agent-driven browser/device interaction, use the optional
[Argent checks and qualification record](../../../docs/argent.md) within its qualified scope.
Neither tool establishes untested targets, physical devices, or arbitrary input
behavior by implication. Only capture or inspect visual artifacts when the task
and project instructions authorize that evidence.
