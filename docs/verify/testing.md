# Checking an Xplat app

> Try the actions your app supports, then use code checks to catch problems
> you might miss while using it.

After a change, open the app and try it. For a packing list, add an item,
mark it packed, and remove it. Check that the remaining count changes and
that the empty list still offers a way to add another item.

A coding agent can help run checks and fix failures. Ask it to tell you
which commands passed and where it ran the app. A successful browser check
is useful; you still need to try a phone feature on a phone or simulator.

> Treat your agent's report as a claim to verify: catch shared-code mistakes
> quickly, then prove the behavior on the targets you ship.

An agent will call a task done on the strength of a typecheck and a passing
browser. For an app you intend to ship, require the evidence below — and
repeat the important flows yourself, because the agent's environment is not
your user's.

## The short feedback loop

From your app's folder, run these commands one at a time, or ask your agent
to run them:

| Command          | What it checks                                              |
| ---------------- | ----------------------------------------------------------- |
| `pnpm lint`      | Looks for code patterns that can cause mistakes.            |
| `pnpm typecheck` | Checks that values and options match what the code expects. |
| `pnpm build`     | Checks that the browser app can be prepared for release.    |

Each command should finish without errors. If one fails, copy the error
into your agent and ask it to fix the cause, then run the check again.
These commands don't click buttons or fill in forms, so try those actions
in the running app too.

As your app grows, add **automated tests**: code that performs checks for
you, such as verifying that packing one of two items leaves one remaining.
Phone scaffolds already include an on-device test lane — keep reading for
how to use it. There is no browser test runner yet; ask your agent to help
configure one when you need to repeat those checks automatically.

## Test components on a device

Every scaffolded iOS/Android app carries an on-device test lane: Vitest runs
on your computer and sends each spec to your app on a simulator, where it
runs inside the real native runtime — the same renderer, native views, and
services your app uses. A component that misbehaves only on a phone gets
caught here, not after release.

```sh
xcrun simctl boot DEVICE_UDID    # start a simulator once
pnpm test:ios -- --device DEVICE_UDID
```

A spec mounts a component, acts through the same gesture handlers as real
touches, and reads what rendered:

```tsrx
import { expect, it } from 'vitest'
import {
	findByTestId,
	mountXplat,
	tap,
	viewText,
	waitUntil,
} from '@octane-xplat/platform/testing'
import { App } from './App.tsrx'

it('increments the counter', async () => {
	const { view } = await mountXplat(App)

	await tap(findByTestId(view, 'counter.increment')!)
	await waitUntil(() => viewText(view).includes('1'))
})
```

`mountXplat` accepts the component and its props; `App` here is the starter
component in `src/App.tsrx`, but any exported component mounts the same way.

`mountXplat` unmounts the component when the test finishes, so one spec
cannot leak subscriptions or timers into the next. The starter spec
`src/app.spec.tsrx` exercises a counter, a controlled text input, a
conditional subtree, and async loading/error states — copy its shape for
your own components. New specs go anywhere under `src/` named
`*.spec.tsrx` (or `.spec.ts`); `src/test.ts` bundles each one and
`vitest.config.mts` lists the same pattern.

Assert on what a person could see or do — rendered text, `testID` targets,
mounted and unmounted content — not on internal view classes.

**Know the limits.** `tap()` and friends dispatch through gesture
observers: they prove your handlers are wired, not that the OS would
deliver the touch — that stays in [Maestro's lane](#automate-phone-journeys).
The lane is qualified on iOS simulators; Android uses the same setup but is
not verified yet. Apps scaffolded before this lane existed can
[add it by hand](#add-the-test-lane-to-an-older-app).

### Add the test lane to an older app

Current scaffolds set all of this up; an app created earlier adds the same
pieces once:

1. Install the runner and its bridge:

   ```sh
   pnpm add -D @nativescript/unit-test-runner vitest
   pnpm add @valor/nativescript-websockets
   ```

2. Create `src/test.ts` — the entry `ns test` boots instead of your app —
   and `vitest.config.mts` beside your Vite config. Copy both from the
   current scaffold template or ask your agent to add them; the scaffold's
   `src/app.spec.tsrx` is a good first spec.
3. iOS only: allow the test WebSocket on the loopback address in
   `App_Resources/iOS/Info.plist`:

   ```xml
   <key>NSAppTransportSecurity</key>
   <dict>
     <key>NSAllowsLocalNetworking</key>
     <true/>
   </dict>
   ```

4. Add the scripts: `"test:ios": "ns test ios"` and
   `"test:android": "ns test android"`.

## Automate phone journeys

We recommend [Maestro](maestro.md) for end-to-end testing of Octane Xplat
Android and iOS apps. Follow the guide to write a short flow, run it on a
selected device, and check the resulting screen. No NativeScript plugin is
needed. Keep code checks and browser tests alongside these mobile journeys.

```sh
maestro --device DEVICE_ID test .maestro/counter.yaml
```

## Test behavior, not renderer markup

The browser and phones use different underlying views to display a screen.
A test should check what someone can do with it: pressing a button updates
the list, opening a link shows the right screen, and closing a dialog
returns to the previous screen.

For example, a packing-list test can add “Passport,” mark it packed, and
check that the remaining count decreases. It can then remove the item and
check the empty-list message. The code that drives the test can differ
between web and phone; the expected result stays the same.

When reporting a problem to an agent, include the action and what happened:
“After packing Passport, the remaining count still says two; it should say
one.” That gives it a specific result to work toward.

## Verify before you ship

Before releasing an app for other people to use:

1. Try the important actions on each platform you plan to release for. A
   simulator or emulator helps during development; device features also need
   checks on a real device.
2. Try what happens when something goes wrong: decline camera access,
   cancel a file picker, or load data without a network connection. The app
   should explain the problem and offer a useful next action.
3. Build the release version with `pnpm xplat build --release` from the app
   folder. This prepares the web app and uses NativeScript release builds
   for configured phone targets. Phone signing must already be set up;
   uploading to an app store is a separate step.
4. Try that release build too. It is prepared differently from the app you
   run while editing. [Known limits](known-limits.md#same-edge-on-every-target)
   lists current release issues. Rows marked `desk` describe behavior checked
   by reading source code; try any of those features your app depends on.

For code-level tests, keep calculations such as “how many items remain”
separate from screen code so a test can call them directly. Use device
checks for focus, gestures, element size, and permission dialogs.

If you are working on the framework itself, [single-case probing](probing.md)
explains how to run one small investigation. The [testing notes](../notes/testing-notes.md)
cover the framework's test tools and automation.

## Stable targets and optional agent control

Give meaningful controls [stable test names](test-identifiers.md) when tests
need targets independent of translated labels. For optional AI-agent device
and Chromium control through MCP, follow the [qualified Argent recipe](argent.md).
It keeps the pinned tooling, platform scope, and discovery/replay prerequisites
separate from your app runtime.
