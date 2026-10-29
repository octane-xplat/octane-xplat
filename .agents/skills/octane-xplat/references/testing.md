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

## Prepare deterministic app states

Use [development actions](development-actions.md) when verification needs a known
login, fixture dataset, or prepared scenario in a running dev app. That reference
covers app-owned registration, bridge setup, and supported targets; the
[CLI workflow](cli.md#inspect-and-assert-supported-behavior) covers discovery and
invocation. Check rendered state separately after setup; action completion alone
does not establish UI behavior or user input.

## Component workshop

Use the [workshop guide](../../../../docs/testing/component-workshop.md) to develop
one component outside the production app entry. Control edits preserve healthy
state; Reset/source revisions create a fresh owned generation. Register fixture
cleanup promptly, use fresh factories, and restart after failed cleanup. The
browser path is separate from actual-host/OS-input qualification; a target name
or compiled story does not qualify a native workshop.

```sh
pnpm exec xplat workshop doctor
pnpm exec xplat workshop dev --target web --story counter/basic
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
| Shared/native unit tests | `pnpm exec turbo run test:native --filter=@octane-xplat/ui`                 | Node and compiled object-driver regressions; no OS host/input claim      |
| DOM seam check           | `pnpm lint`                                                  | Forbidden DOM usage in native/shared code                                |
| Web harness smoke        | `pnpm smoke:web`                                             | Browser behavior covered by the local smoke script                       |
| Packed starter           | `pnpm check:consumer --no-build --quick`                     | Prepared tarballs, isolated install, declarations, and compilation       |
| Optional adapters        | `pnpm check:optional-services --types-only`                  | Adapter types; `--browser` explicitly adds local browser probes          |
| Native probe/device test | Probe runner or maintained `ns test` suite                   | Only the assertions and target actually executed                         |

When testing asynchronous query updates with Octane 0.14 or newer, allow a host
task to run before asserting the settled value. Its cooperative scheduler may
yield after its time budget, so flushing only promises can leave a query pending.
For universal tests, flush the renderer after that host task.

The iOS/Android probe host includes Mason core because the locally patched
renderer imports it (through its `nativescript-masonkit` specifiers) for
container layout. Keep native host plugins in runtime
`dependencies`: JavaScript resolution from a devDependency does not include the
plugin binaries in `ns prepare`. See the [host integration contract](../../../../.agents/docs/notes/masonkit-layout-evaluation.md#native-host-integration-correction-2026-10-19).

The isolated runner’s `ctx.press(id)` supports loaded core tap observers and
MasonKit’s click listener (its tap alias). It reports `event-handler-dispatch`;
this remains synthesized input, not OS input or hit-testing.

```ts
import { flushUniversalSync } from 'octane/universal/native'

await new Promise<void>((resolve) => setTimeout(resolve, 0))
flushUniversalSync(() => {})
```

When qualifying keyed native components, assert host identity, retained state,
prop updates, and cleanup after reorder/removal. Correct text alone can hide a
remount. Octane 0.14.0 needs Xplat's root-slot key patch for compiled component
maps; see [the ownership evidence](../../../docs/notes/portal-boundaries.md#evidence-and-limits)
and `packages/ui/src/internal/accessibility/keyed-component.mobile.test.tsrx`.

PR `checks` excludes browser engines, browser-driven suites, and device
emulation. Do not infer their success from green CI. See
[release validation](../../../docs/releases.md) for nightly/stable coverage and
[contributor testing](../../../docs/testing.md) for fixture ownership and commands.

## Routing ownership and sign-in

Use the maintained production-browser routing checks for client commits and
account-owner handoff. The auth command typechecks and runs a shared controlled
SDK example through cold/warm links, Back/Forward, account expiry/switching,
modal cancellation/success and return intents. It does not contact an identity
provider. Keep browser engines out of PR checks.

```sh
pnpm --filter @xplat/web smoke:routing
pnpm --filter @xplat/web smoke:routing-auth
```

For separate native Frame/pane/modal commands and measured target limits, use
[the routing qualification guide](../../../docs/navigation-checks.md).
The native release fixtures include a controlled sign-in/owner-replacement
protocol on actual iOS/Android and AppKit hosts, also covered by the native
object driver. These checks use explicit URL requests inside running apps;
real providers and OS authentication dialogs require separate qualification.

```sh
pnpm --filter @octane-xplat/ui test:native
```

The native release fixtures also run `route-retention-example.tsrx` on root
pages and named panes: actual text/scroll controls, Back, refresh, cancelled
loaders and modal dismissal. Use the public `ScrollableAreaHandle` for offset
writes; the Mason peer is not a NativeScript ScrollView. Native focus policy and
OS/assistive input remain separate from these programmatic checks. See
[native retention qualification](../../../docs/navigation-checks.md#native-control-and-viewport-retention)
for the measured targets and portable-handle regressions.

```sh
pnpm --filter @octane-xplat/ui exec vitest run src/scrollable-area-offset.test.ts
pnpm --filter @octane-xplat/ui exec vitest run --config vitest.native.config.mts src/scrollable-area-handle.mobile.test.tsrx
```

The general demo-sweep gates below do not describe the canonical router's
separate native release fixture.

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


### AppKit object-driver test mode

Use `XPLAT_UI_TEST_TARGET=macos` for AppKit component cases. It selects macOS
package conditions/extensions and AppKit test patterns; the default mobile
mode excludes those patterns. The target is part of the UI Turbo task's env
hash. The Node-test prelude and task prerequisites still run. This mode does
not launch an OS app or prove native input/layout/VoiceOver/packaging.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/input-number.macos.mobile.test.tsrx
```

Read [test-layer guidance](../../../docs/testing.md#appkit-component-tests) for
scope and prerequisites. Do not use an AppKit filename with the default mobile
mode and report missing tests as a platform pass.


## AppKit identifiers remain source-only

AppKit raw native hosts now map testID to accessibilityIdentifier, with updates
and clears on the retained host; logical viewless nodes do not get native IDs.
Pressable and Button forward testID and accessible. Preserve the separate CSS
id and spoken label. Do not infer other composites' forwarding, native selector
replay or VoiceOver behavior from this implementation; source cases are authored
but unrun. See [AppKit identifiers](../../../../docs/testing/test-identifiers.md#appkit-source-implementation).

```tsx
import { Button } from '@octane-xplat/ui'

export function Save({ save }: { save(): void }) {
	return <Button id="save-control" testID="draft.save" label="Save changes" clickAction={save} />
}
```
