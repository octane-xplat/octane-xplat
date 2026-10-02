# Probe one platform case

Use this repository-local runner to investigate a script or component without
editing the harness or running its catalog sweep. It is not part of the
published `xplat` CLI. Windows is excluded.

## Run a maintained case

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm probe doctor
pnpm probe run examples/probes/signals.ts --target web
pnpm probe run examples/probes/counter.tsrx --target macos
pnpm probe run examples/probes/counter.tsrx --targets web,ios,android,macos,linux
```

The doctor reports prerequisites and device IDs. Web needs Playwright Chromium
(`pnpm --dir apps/web exec playwright install chromium`). iOS needs Xcode, a
booted simulator, and Ruby's `xcodeproj` gem. Android needs an authorized device,
the SDK, and a compatible JDK (the runner selects JDK 21 on macOS). Mobile builds
need the NativeScript CLI on PATH. For the local macOS emulator setup, see the
[Android lab log](../../.agents/docs/android-lab.md), including SDK PATH, a distinct
AVD, and explicit adb server/device selection. macOS uses the repository's
Apple Silicon AppKit/JavaScriptCore host. Linux requires an actual Linux host with GJS,
GTK 4, WebKit 6, libadwaita, libsecret, and a graphical session. This command
does not provision machines or substitute macOS WebKit for Linux.

Select a device explicitly when more than one is active:

```sh
pnpm probe run examples/probes/signals.ts --target ios --device SIMULATOR_UDID
pnpm probe run examples/probes/counter.tsrx --target android --device DEVICE_SERIAL
```

For both mobile targets use `--ios-device` and `--android-device`. Boot your
chosen simulator first; the runner does not reset another session's simulator.
Unavailable requested targets return `unavailable` and a nonzero exit status.

## Write a case

A `.ts` case exports `run(ctx)`. A `.tsrx` component case also exports a default
component, which mounts before `run`. Give views stable IDs and poll for the
observable state you need. See the maintained [script](../../examples/probes/signals.ts)
and [counter](../../examples/probes/counter.tsrx).

```ts
import type { ProbeContext } from '../scripts/probe/context'

export async function run(ctx: ProbeContext) {
	ctx.assert('target selected', typeof ctx.target, 'string')
	ctx.record('target', ctx.target)
}
```

Adjust that relative type import for the case's location. The context offers
`mount(Component, props)`, `find(id)`, `press(id)`, `scrub(id, points)`, `setText(id, text)`,
`waitFor(predicate, { timeout, interval }?)`, `inspect(id)`, `assert(name, actual, expected)`,
`record(name, value)`, and `onCleanup(fn)`. Assertions compare with `Object.is`;
recorded values must be JSON serializable. A script has no component signal owner;
use `createScope` and `runWithSignalOwner` for signal reads/writes, as in the script
example. Cleanups run in reverse order.
`ctx.host` and found views expose actual platform objects for targeted probes.
Use platform suffixes for platform-specific imports and maintain matching
exports across variants.

```ts
// Continue inside run(ctx) from the example above, for a mounted counter case.
const button = ctx.find('probe-increment')
ctx.assert('button found', Boolean(button), true)
await ctx.press('probe-increment')
await ctx.waitFor(() => ctx.inspect('probe-count').text === '1', { timeout: 2000, interval: 20 })
ctx.record('count', ctx.inspect('probe-count'))
ctx.onCleanup(() => console.log('Case finished'))
```

`inspect` reports text, value, and host geometry when available. Coordinates
and units belong to the actual host; they are not a cross-platform pixel
comparison. `press` dispatches the DOM click or native action/gesture handler.
Results label that mechanism. A passing handler probe does not prove OS input,
hit-testing, keyboard behavior, or accessibility navigation.

```ts
// Inside run(ctx), after mounting the maintained counter case:
await ctx.press('probe-increment')
ctx.record('host result', ctx.inspect('probe-count'))
```

On iOS and Android, `scrub` dispatches touch observers with a `down` at the
first point, a `move` at each later point, and an `up` at the last point.
Coordinates are relative to the view in NativeScript layout units. For example:

```ts
await ctx.scrub('chart', [
	{ x: 20, y: 40 },
	{ x: 80, y: 40 },
])
```

The view must be loaded and have a touch observer. Empty paths and non-finite
coordinates fail the case. Other targets reject `scrub`. Like `press`, this
exercises handlers; it does not send OS input or test hit-testing.

## Iterate without harness edits

```sh
pnpm probe run examples/probes/counter.tsrx --target web --watch
pnpm probe run examples/probes/counter.tsrx --target macos --watch --fresh-process
```

Watch accepts one target. It watches imported source, reruns after edits, and
creates a fresh component root. Mobile and macOS can keep their host process
warm; module and OS state may persist. Reset script state explicitly or use
`--fresh-process` when that state is part of the experiment. Ctrl-C stops the
runner's own session and releases its locks.

Generated projects live under gitignored `research/probes`. Case/worktree and
native build fingerprints isolate their app IDs and artifacts. Repeated runs
reuse binaries; dependency, native-source, resource, and runner changes produce
a new build identity. The runner does not uninstall existing apps or erase
persistent app data. It refuses a conflicting case/device session rather than
resetting it. A stale case lock requires inspection before manual removal.

Additional packages must already be installed. Pass their names to make them
available in the isolated project:

```sh
pnpm probe run examples/probes/signals.ts --target android --deps @octane-xplat/platform
```

Use `--resources /absolute/path/to/App_Resources` for a case's native resources.
The default comes from `apps/mobile/App_Resources`; Google Services credentials
are excluded. Plugins requiring credentials or custom application/build
configuration need that setup separately; a simple case cannot establish their
integration just by importing them. Dependency changes may require reinstalling
the workspace before probing.

## Read the evidence

Single runs emit one JSON object with a `results` array; watch emits one JSON
result per line. Diagnostics go to stderr. Each completed case identifies the
run ID, case, target, host, device, interaction mechanism, assertions,
measurements, errors, and status. Exit 0 means every requested result passed;
exit 1 includes failure or unavailable targets; interruption exits 130.

A thrown assertion, runtime error, cleanup failure, timeout, closed host, or
missing completion cannot count as a pass. Web host errors with the exact message
`ResizeObserver loop completed with undelivered notifications.` are recorded
with `fatal: false` and do not fail an otherwise passing case. Other errors and
thrown case or cleanup failures remain fatal. `--timeout` bounds case execution
(default 10 seconds); `--startup-timeout` bounds waiting for completion including
startup (default 10 minutes). Use `--verbose` for build/host diagnostics. Report
which targets actually ran, and keep build-only or unavailable evidence separate
from runtime verification. Screenshots are not required.
