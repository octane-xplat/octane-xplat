# Declare development actions

> Put your running dev app into a known state so an agent can repeat a check reliably.

Development actions are named functions your app owns. An agent uses `xplat`
to discover their input, result, and effects, then invokes one against an exact
running app instance. They are useful for fixture data, test logins, and prepared
scenarios. Here, an action sets a counter and the agent checks its rendered value.

## Declare an action

Create `src/counter-state.ts` with the following code. The development gate keeps
the registration and handler out of production builds. Registration automatically
starts the app-side connection; keep the returned handle so hot reload can remove
the old registration before registering the same ID again.

```ts
import { registerDevAction } from '@octane-xplat/platform/dev-actions'
import { createStore } from '@octane-xplat/ui/data'

export const counterState = createStore(0)

if (import.meta.env.DEV) {
	const action = registerDevAction({
		id: 'fixtures.set-counter',
		title: 'Set counter',
		description: 'Set a known count before checking the counter screen.',
		input: {
			fields: { count: { type: 'integer', minimum: 0, default: 0 } },
		},
		result: { fields: { count: { type: 'integer' } } },
		effects: { summary: 'Replaces the current counter value', appState: true },
		execution: { concurrency: 'serialized', retryable: true },
		run(input) {
			const count = Number(input.count)
			counterState.set(count)

			return { count }
		},
	})
	import.meta.hot?.dispose(() => action.dispose())
}
```

The declaration above validates `count` as a nonnegative integer before execution
and validates the returned count. Setting a known value is safe to repeat, so this
action declares `retryable: true`. Serialized execution is the default. Register
once per owner, not during rendering; duplicate IDs throw. When the handler
needs values that only exist inside a screen, prefer the component hooks in
[Attach actions from components](#attach-actions-from-components) — they attach
and detach with the component for you.

Create `src/CounterStatus.tsx` and mount `CounterStatus` in your app's screen.
Importing the store module also runs its development registration. `useStore`
subscribes the screen to updates, and `testID` gives the agent a stable target.

```tsx
import { Text } from '@octane-xplat/ui'
import { useStore } from '@octane-xplat/ui/data'
import { counterState } from './counter-state'

export function CounterStatus() {
	const count = useStore(counterState)

	return <Text testID="counter.value">{count}</Text>
}
```

## Attach actions from components

Module registration covers actions whose handler knows everything it needs at
import time. When the handler needs values that only exist inside a screen —
form fields, a draft, the current tab — declare the contract once with
`defineDevAction` and let the screen attach the handler with
`useDevActionHandler`. The action is listed while declared, but reports
unavailable until a component attaches a handler, so the agent learns when its
screen is not mounted.

```ts
import { defineDevAction } from '@octane-xplat/platform/dev-actions'

export const saveDraft = defineDevAction({
	id: 'form.save-draft',
	title: 'Save form draft',
	description: 'Persists the checkout form state that only exists in the screen.',
	effects: { summary: 'Writes the form draft', appState: true },
})
```

The hook attaches while the component is mounted and detaches on unmount; the
handler always runs the latest render's closure, so it reads current state.

```tsx
import { useDevActionHandler } from '@octane-xplat/platform/dev-actions'
import { saveDraft } from './dev-actions'

export function CheckoutForm() {
	const draft = useStore(draftState)
	if (import.meta.env.DEV) {
		useDevActionHandler(saveDraft, async () => {
			await persist(draft)

			return {}
		})
	}

	return <CheckoutFields />
}
```

When several components attach handlers to the same action, the most recently
attached one runs — the console warns about the extra handlers at invoke time
— and detaching it restores the previous one.

For an action owned entirely by one component, `useDevAction` declares the
contract inline and attaches the handler together. Two mounted instances with
the same declaration share one entry; the declaration disappears when the last
instance unmounts.

```tsx
if (import.meta.env.DEV) {
	useDevAction({
		id: 'cart.inspect',
		title: 'Inspect cart',
		description: 'Returns the cart contents for a quick sanity check.',
		result: { fields: { items: { type: 'integer' } } },
		effects: { summary: 'Reads local cart state; changes nothing' },
		run: async () => ({ items: cart.items.length }),
	})
}
```

Pass `{ enabled: false }` to detach without unmounting — useful for an
unfocused tab that should stop answering for the action while its screen keeps
its state.

```tsx
useDevActionHandler(saveDraft, async () => ({}), { enabled: isFocusedTab })
```

Dev effects broadcast instead of picking one handler: `defineDevEffect` plus
`useDevEffect` runs every attached handler and reports how many ran
(`handlerCount`). Use it for resets that every mounted screen should react to.

```ts
import { defineDevEffect } from '@octane-xplat/platform/dev-actions'

export const resetUi = defineDevEffect({
	id: 'fixtures.reset-ui',
	title: 'Reset UI state',
	description: 'Every mounted screen returns to its initial state.',
	effects: { summary: 'Resets local UI state', appState: true },
})
```

```tsx
if (import.meta.env.DEV) {
	useDevEffect(resetUi, () => setFilters(initialFilters))
}
```

### When a handler fails

A thrown handler fails the invocation, and the outcome carries one structured
record per failed handler — its position in attach order, name, message, and
stack — so the agent can see which owner failed and why.

```json
{
	"status": "failed",
	"error": {
		"code": "execution_failure",
		"message": "1 of 2 handlers failed: probe failure from FormScreen",
		"failures": [
			{
				"handler": 0,
				"label": "FormScreen",
				"name": "TypeError",
				"message": "probe failure from FormScreen",
				"stack": "TypeError: probe failure from FormScreen\n    at FormScreen... (http://127.0.0.1:50466/@fs/.../FormScreen.tsrx?import:286:11)",
				"sourceStack": "TypeError: probe failure from FormScreen\n    at FormScreen... (src/FormScreen.tsrx:47:10)"
			}
		]
	},
	"partialEffects": ["1 of 2 handlers completed"]
}
```

On web and on Android NativeScript dev sessions, the dev server adds
`sourceStack` — the same stack with frames rewritten to original source
positions (`stack` stays raw for debugging). NativeScript device modules are
matched to source by line text (the runtime shifts lines without a map), so an
occasional frame may stay raw. iOS frames are not yet verified.

Pass `label` so the record names the owning component instead of an anonymous
handler.

```tsx
useDevEffect(resetUi, () => setFilters(initialFilters), { label: 'FilterPanel' })
```

Messages and stacks are returned as-is over the development-only channel, so
keep secrets and credentials out of thrown errors.

## Reach screen-owned actions by route

An action whose handler lives inside a screen is listed as soon as it is
declared, but it stays `unavailable` until that screen mounts and attaches a
handler — an agent has no way to get there on its own. Declare `route` on the
action and the app navigates itself first: on invoke, it pushes the route,
waits for the screen's handler to attach and report ready, then runs it.

```ts
import { defineDevAction } from '@octane-xplat/platform/dev-actions'

export const saveDraft = defineDevAction({
	id: 'form.save-draft',
	title: 'Save form draft',
	description: 'Persists the checkout form state that only exists in the screen.',
	effects: { summary: 'Writes the form draft', appState: true },
	route: '/checkout',
})
```

The URL can also come from the validated input — useful when the destination
depends on an argument, like opening a specific order.

```ts
export const openOrder = defineDevAction({
	id: 'orders.open',
	title: 'Open order',
	description: 'Navigates to the order detail screen for the given order id.',
	input: { fields: { orderId: { type: 'string' } } },
	effects: { summary: 'Shows an order', navigation: true },
	route: (input) => `/orders/${input.orderId}`,
})
```

A listed route looks like `availability.route: { "url": "/checkout" }` (or
`{ "fromInput": true }` for a function) and declares `effects.navigation`. The
agent can invoke the action while it is unavailable; the dispatch still fails
`unavailable` if no router is installed, if the navigation is refused
(`navigation_blocked`/`navigation_failed`), or if nothing attaches before the
deadline — so a wrong route fails honestly instead of hanging. When
`execution.timeoutMs` is set, route-declared actions spend at most half of it
navigating and waiting for the handler, leaving the rest for the run itself.
Automatic navigation does not navigate back afterwards.

The built-in `xplat.navigate` action covers the other direction — an agent
navigating explicitly before calling an action that has no route. Generated
routes register it in development builds; it reports the committed route,
and its failures carry the router's `navigation_blocked`/`navigation_failed`
codes verbatim.

```sh
pnpm exec xplat actions invoke --action xplat.navigate \
  --instance INSTANCE_ID --revision REVISION \
  --input '{"url":"/checkout"}' --json
```

Each listed instance also reports `location` — the app's current route — so
agents can check where the app is before deciding to navigate.

```json
{
	"appInstanceId": "inst_abc123",
	"location": { "route": "/checkout", "modal": false }
}
```

Inline `useDevAction` actions are the exception: they are declared by the
component itself, so nothing is listed until that component mounts — a
`route` on them cannot help because nothing is announced to route toward.
Actions that need navigation should be declared at module scope with
`defineDevAction` and `route`, with the screen attaching the handler through
`useDevActionHandler` as usual.

## Connect the running app

Web is the qualified action transport, and Android was verified on one physical
device through `xplat dev` — the dev server is reached via adb reverse. iOS and
Windows dev servers share the bridge machinery but are not yet runtime-qualified;
macOS AppKit and Linux need their own adapters and report unavailable.

The web starter already includes `xplatDevBridge()` in its Vite plugins, and the
`xplatNative` preset includes it for NativeScript. For an existing web config,
import it from `@octane-xplat/cli/vite` and add it once to the existing plugin
array. This example shows the relevant plugins; retain your app's other settings.

```ts
import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { xplatBoundary, xplatCss, xplatDevBridge } from '@octane-xplat/cli/vite'

export default defineConfig({
	plugins: [xplatCss('web'), ...octane(), xplatBoundary('web'), xplatDevBridge()],
})
```

The plugin provides a token-authenticated, development-only channel at
`/__xplat_dev__/`; it adds no endpoint to a production build. Registration starts
the app-side bridge automatically. A separate startup call is only useful when
you need to announce a live app with an empty registry or set an app label.

```ts
import { startDevActionBridge } from '@octane-xplat/platform/dev-actions'

if (import.meta.env.DEV) {
	startDevActionBridge({ appLabel: 'Counter dev app' })
}
```

## Invoke and assert through the CLI

Run these commands from the intended app directory. If several apps are
available, select one with `--app`. For built-in browser inspection, start an
owned web session. Starting a session and invoking actions require the
`runtime-actions` permission within your task's existing authorization.
Replace `LAUNCH_JOB_ID` with the returned `data.job.jobId` and poll until it
succeeds; keep the returned session ID for inspection and
cleanup. A launch request alone does not establish app readiness.

```sh
pnpm exec xplat session start --platform web --json
pnpm exec xplat job status LAUNCH_JOB_ID --json
```

With the dev app running, inspect the live registry before invoking: it reports
each instance's `appInstanceId`, `revision`, actions,
input contracts, effects, and availability. An empty registry differs from a
disconnected app. Installed help and schemas describe the exact command contract.

```sh
pnpm exec xplat actions list --json
pnpm exec xplat actions invoke --schema
```

Replace `INSTANCE_ID` and `REVISION` below with values from that listing.
Actions declaring effects outside the app also need `external-effects`.
Grants must fit your task's existing authorization. A stale revision is rejected;
list again before retrying.
The response's `data.job.jobId` identifies the accepted job, not a completed action.

```sh
pnpm exec xplat actions invoke \
  --action fixtures.set-counter \
  --instance INSTANCE_ID \
  --revision REVISION \
  --input '{"count":3}' \
  --request-key counter-setup-1 \
  --json
pnpm exec xplat actions status JOB_ID --json
```

Replace `JOB_ID` with the returned job ID and poll until terminal. Require
`data.job.state` to be `succeeded` and check that
`data.job.result.outcome.result.count` equals `3`. Request keys recover live
jobs; they do not deduplicate arbitrary later runs. For an uncertain outcome,
inspect the existing job before submitting another invocation.

Treat the registry as a live view, not a stable snapshot. Apps announce every
five seconds by default. After 15 seconds without an announcement, the bridge
removes that instance from live listings and refuses new work for it. An
outstanding action then fails with `disconnected_runtime`; its outcome may be
unknown, so inspect app state before retrying. A stopped or suspended app can
still appear live during that 15-second window. Run `actions list` immediately
before invoking, using its instance and revision:

```sh
pnpm exec xplat actions list --json
```

An ordinary heartbeat keeps the revision unchanged. Registry changes can make
a previously selected revision stale; rediscover it when an invocation reports
`stale_identity`.

A successful action proves its handler completed. Check the resulting screen
separately. For a supported owned Chromium session, replace `SESSION_ID` with
its CLI session ID and inspect the mounted counter until its text is `3`; fail
the check if it does not reach that state within your test's deadline. Use your
app's tests when CLI inspection is unavailable. End the session you started
after checking; this releases its owned browser and dev server.

```sh
pnpm exec xplat inspect SESSION_ID --testid counter.value --json
pnpm exec xplat session end SESSION_ID --json
```

## Choose what your actions cover

An action runs one of your app's functions — it never delivers input. A
submit action proves your submit handler produces the right result; it says
nothing about the tap, swipe, or keyboard path that reaches that handler in
the real UI. Cover what a handler can reach: prepared fixtures, state reads,
submit/save/dismiss paths, and a way out of every stuck state. Taps, swipes,
pull-to-dismiss gestures, long-presses, and IME suggestions exercise the input
layer itself — those need real-input tooling such as `adb input`, `simctl`,
or browser automation, plus separate interaction tests. A complete action list
is not UI coverage.

### Stay on the fixture side of your data

Actions run inside the app with its privileges, and anything connected to the
dev channel can invoke every listed action. Never let an action accept real
credentials, mutate remote or account data, or cause OS side effects. A
practical pattern scopes destructive actions to fixture entities and refuses
fixture writes while a real backend session exists — this action deletes only
`dev-`-prefixed notes, and only while the app points at its fixture backend.

```ts
import { registerDevAction } from '@octane-xplat/platform/dev-actions'
import { createStore } from '@octane-xplat/ui/data'

// True only while the app is pointed at the fixture backend.
export const fixtureSession = createStore(false)

export const notes = createStore<Record<string, string>>({})

if (import.meta.env.DEV) {
	const action = registerDevAction({
		id: 'fixtures.delete-note',
		title: 'Delete a fixture note',
		description: 'Removes a dev-fixture note so a fresh-list check starts empty.',
		input: { fields: { noteId: { type: 'string' } } },
		effects: { summary: 'Deletes a fixture note', appState: true, testData: true },
		run(input) {
			if (!fixtureSession.getSnapshot()) {
				throw new Error('fixture actions are off while a real account is signed in')
			}
			const noteId = String(input.noteId)
			if (!noteId.startsWith('dev-')) {
				throw new Error(`"${noteId}" is not a dev- fixture id`)
			}
			notes.update((all) => {
				const next = { ...all }
				delete next[noteId]

				return next
			})

			return {}
		},
	})
	import.meta.hot?.dispose(() => action.dispose())
}
```

### Register actions where their state lives

A composer, sheet, or capture panel that is only sometimes mounted should
attach its own actions while it is open — save draft, submit, dismiss —
through the component hooks in
[Attach actions from components](#attach-actions-from-components). The actions
appear in the registry exactly when the state they operate on exists, and they
disappear with that state instead of running a stale closure. Reserve
module-level `registerDevAction` for what is always relevant: global state
reads, navigation, and escape hatches.

```tsx
import { useDevAction } from '@octane-xplat/platform/dev-actions'

export function Composer() {
	if (import.meta.env.DEV) {
		useDevAction({
			id: 'composer.discard-draft',
			title: 'Discard the open draft',
			description: 'Closes the composer without sending; listed only while it is open.',
			effects: { summary: 'Discards the composer draft', appState: true },
			run: () => {
				draftState.set(emptyDraft)

				return {}
			},
		})
	}

	return <ComposerFields />
}
```

### Keep an escape hatch

`availability.ready` gates an action on live app state: a probe that reports
whether the action is safe to run right now, so an agent sees `unavailable`
instead of a handler failing mid-operation. Gates compose into a trap when one
app state can lock all of them at once — a capture screen that starts
recording the moment it opens flips `recording: true`, every action gated on
"app is idle" goes unavailable, and until an ungated stop or dismiss action
exists the only recovery is force-stopping the app. Keep at least one action
that can leave or reset the blocking state deliberately ungated, or gate it on
the blocking state itself like this stop action that is ready *because* a
capture is running.

```ts
import { registerDevAction } from '@octane-xplat/platform/dev-actions'
import { createStore } from '@octane-xplat/ui/data'
import { counterState } from './counter-state'

const recording = createStore(false)

if (import.meta.env.DEV) {
	// Most fixture actions gate on the app being idle.
	const reset = registerDevAction({
		id: 'fixtures.reset-counter',
		title: 'Reset counter',
		description: 'Sets the counter to zero while the app is idle.',
		input: {},
		result: { fields: { count: { type: 'integer' } } },
		effects: { summary: 'Resets the counter', appState: true },
		availability: {
			ready: () =>
				recording.getSnapshot()
					? { ready: false, reason: 'a capture is in progress' }
					: { ready: true },
		},
		run() {
			counterState.set(0)

			return { count: 0 }
		},
	})

	// The escape hatch is ready because a capture is running, so the blocking
	// state always has a way out.
	const stop = registerDevAction({
		id: 'capture.stop',
		title: 'Stop capture',
		description: 'Stops an in-progress capture so idle-gated actions answer again.',
		effects: { summary: 'Stops the current capture', appState: true },
		availability: { ready: () => recording.getSnapshot() },
		run() {
			recording.set(false)

			return {}
		},
	})
	import.meta.hot?.dispose(() => {
		reset.dispose()
		stop.dispose()
	})
}
```

## Keep the boundary clear

Actions prepare state and expose app-defined operations; they do not prove
coordinate hit-testing, OS input, or that a user can complete the same
journey — [Choose what your actions cover](#choose-what-your-actions-cover)
shows where each kind of check belongs.

Keep privileged fixture imports inside the development-only path, never return
secrets, and check that fixture declarations and handlers are absent from
production artifacts. The bridge being unavailable in production is not evidence
that fixture code was removed.

MCP clients can use the same services through `xplat_dev_actions`,
`xplat_dev_action_invoke`, and `xplat_dev_action_status`. For optional availability,
cancellation, and partial-effect contracts, consult the installed
`@octane-xplat/platform/dev-actions` declarations.
