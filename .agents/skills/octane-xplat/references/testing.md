# Testing the harness

For repository investigation, use [single-case probing](../../../../docs/verify/probing.md): `pnpm probe doctor`
and `pnpm probe run examples/probes/counter.tsrx --target web --watch`.

```sh
pnpm probe doctor
pnpm probe run examples/probes/counter.tsrx --target web --watch
```

Keep harness edits and catalog sweeps for broader regression coverage.

## Layers

| Layer     | Command                                                | What it proves                                                                                                                                                          |
| --------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck | `tsrx-tsc --noEmit -p apps/{web,mobile}/tsconfig.json` | .tsrx typechecks per target                                                                                                                                             |
| Unit      | `pnpm test`                                            | vitest — web config (`*.test.*` + `*.web.test.*`, DOM renderer via jsdom) then `packages/ui` `test:native` (`*.mobile.test.*`, universal runtime via the object driver) |
| Seam lint | `node scripts/check-no-dom.mjs`                        | no DOM globals in native/shared                                                                                                                                         |
| Web smoke | `cd apps/web && pnpm smoke`                            | build + Playwright Chromium smoke, 62 assertions; CI also runs the built bundle in Firefox and WebKit                                                                 |
| Packed web consumer | `pnpm check:consumer --no-build --smoke web` | scaffolds and builds against packed artifacts; CI runs the starter smoke in Chromium, Firefox, and WebKit |
| iOS       | build + install + launch → read sim log                | Check the named `[assert]` results emitted by the current harness sweep                                                                                                 |
| Android   | build + install + launch → logcat `I JS`               | Base probes; the nested-Frame sweep is gated                                                                                                                            |

## The probe harness (`apps/mobile/src/index.ts`)

Timer-scheduled probes fire synthesized gestures/notifications at views:

- `fireGesture(view, type, name, args)` — calls registered gesture
  observers directly (tap=1, pan=8, swipe=16...). NOT coordinate taps —
  it exercises the observer path, not hit-testing.
- `view.notify({eventName:'selectedIndexChanged',...})` for property
  events (tab switch, switch toggle, `textChange` on inputs).
- `find(id)` → `thePage.getViewById(id)`; `collect`/`texts` walk view trees.
- Content asserts: `[assert] name: OK|FAIL` — the pass count is the signal.

```ts
// In apps/mobile/src/index.ts: fireGesture is the local probe helper above.
import type { Page, View } from '@nativescript/core'

function probeTap(page: Page) {
	const target = page.getViewById<View>('add-item')
	if (target) fireGesture(target, 1, 'tap', {})
}
```

```ts
// Property-event dispatch on an already mounted native input.
import type { TextField } from '@nativescript/core'

function probeTextChange(input: TextField) {
	input.text = 'Carry-on'
	input.notify({ eventName: 'textChange', object: input })
}
```

**Probes race lifecycle constantly** — the failure mode is always "view
exists but native attach/settle hasn't landed". Fixes are polling, not
bigger timeouts (see the demosweep's `waitFor`).

## The demos sweep (`platform/demosweep.ts`)

Drives the app and proof catalogs: switches to Apps or Test, opens each
entry in its stack, checks rendered content, then goes back. The sweep also
covers a sheet-hosted demo, overlay/popover/toast behavior, controls, and
other primitive seams. The nested-Frame sweep remains gated off Android
because it asserts native `Page`/`Frame` objects — named pushes themselves
work through the swap-pane route store and a focused VirtualList probe
runs there instead; the web twin is a no-op.

## Web smoke (`apps/web/scripts/smoke.mjs`)

`pnpm smoke` = `vite build && node scripts/smoke.mjs` — serves dist via
`vite preview` and drives headless Chromium. The current script has 62
assertions covering mount/state, Pressable role/name and pointer/keyboard
activation, motion retargeting and cancellation, pan
release velocity and cancellation, retained Presence identity, routes and
tabs, sheet and overlay portals, services, proof-stack navigation, and browser
errors. The sheet check asserts the real panel mounts and the backdrop
dismisses it.

**Selectors:** `Pressable` renders `div[role="button"]` — use
`[role="button"]:has-text("X")`, not `button`.

```js
// In a Playwright test with an established page fixture.
await page.getByRole('button', { name: 'Add', exact: true }).click()
```

## Release-build verification

Debug-only signals vanish in release (console.log doesn't reach NSLog on
release iOS). Release verification = process alive + zero fatal exceptions
in the platform log. The one release-only bug we caught:
`RootLayout.open()` unhandled rejection — see overlays.md.

## Universal-renderer unit tests (`vitest.native.config.mts`)

`packages/ui/src/*.mobile.test.*` run the REAL compiled leaves against
octane's host-neutral object driver (`createUniversalRoot` +
`createObjectDriver` from `octane/universal/native`) — no
`@nativescript/core`, no sim. The config compiles under the nativescript
renderer + aliases `octane` AND `@nativescript-community/octane` to
`octane/universal/native` (the driver index isn't node-loadable). Uses the
raw `octane` plugin from `octane/compiler/vite` with `ssr: false` — vitest
transforms through the SSR pipeline and the renderer is
`server:'unsupported'`; the app-level plugin wrapper doesn't forward `ssr`.
Scheduler/retention semantics get pinned there (see `store.mobile.test.ts`).

```ts
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
} from 'octane/universal/native'

const container = createObjectContainer()
const root = createUniversalRoot(container, createObjectDriver())
// Render a compiled component through root.render(Component, props) in a test.
root.unmount()
```

## Adding a probe

1. Give the target view an `id` (probe lookup works by id).
2. Fire the gesture/notify at the view — never assume coordinates.
3. Assert on **view-tree content** (`texts(page)`), not render calls —
   lifecycle ≠ content (the empty-Cell lesson).
4. Poll for async lifecycle (navigatedTo, attach) — fixed timers flake.
