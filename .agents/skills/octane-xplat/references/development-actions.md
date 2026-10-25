# Add app actions for deterministic verification

Use app-declared development actions to prepare known app states or expose
bounded diagnostics in a running dev app. Reuse the app's state and services so
the screen observes the same changes as ordinary app code. For the complete
register → invoke → assert example, read the
[development actions guide](../../../../docs/testing/development-actions.md).

## Register with the app

Put registrations in an imported app module, behind `import.meta.env.DEV`.
Declare stable IDs, effects, and runtime-validatable input/result fields;
`run` receives a record, not an inferred input type. Retain the registration
handle for owner cleanup or hot reload: duplicate IDs throw. This standalone
module resets a store that the UI can read with `useStore`.

```ts
import { registerDevAction } from '@octane-xplat/platform/dev-actions'
import { createStore } from '@octane-xplat/ui/data'

export const counterState = createStore(0)

if (import.meta.env.DEV) {
	const action = registerDevAction({
		id: 'fixtures.reset-counter',
		title: 'Reset counter',
		description: 'Set the counter to zero before checking the screen.',
		input: {},
		result: { fields: { count: { type: 'integer' } } },
		effects: { summary: 'Resets the counter', appState: true },
		execution: { retryable: true },
		run() {
			counterState.set(0)
			return { count: 0 }
		},
	})
	import.meta.hot?.dispose(() => action.dispose())
}
```

Keep fixture imports and privileged handlers inside the development-only path
and check production artifacts for their absence. An absent bridge endpoint
does not itself remove handlers from a bundle. Never return credentials.

## Choose the ownership model

Use `registerDevAction` when the handler is self-contained in a module (stores,
fixtures, services). Use the component hooks when the handler reads UI state:

- `defineDevAction` + `useDevActionHandler` — shared contract, screen-owned
  handler. Declared actions announce `ready: false` until a handler attaches,
  so absence of the screen is visible to the agent instead of a silent no-op.
- `useDevAction` — contract and handler inline in one component; multiple
  mounted instances share one declaration, removed when the last unmounts.
- `defineDevEffect` + `useDevEffect` — broadcast: every attached handler runs;
  the result is `{ handlerCount }` and one failing handler fails the outcome
  while the rest still run.

When several components attach to the same action, only the most recently
attached handler runs (a console warning reports this at invoke time);
detaching it restores the previous one. All hooks take `{ enabled }` to detach
without unmounting — use it for unfocused tabs.

```tsx
if (import.meta.env.DEV) {
	useDevActionHandler(saveDraft, async () => ({ note: draft.title }), {
		enabled: isFocusedTab,
		label: 'CheckoutForm',
	})
}
```

Pass `label` so a failed outcome's `context.failures` records identify the
owning component; each record carries `handler` (attach-order index), `name`,
`message`, and `stack`. Prefer `sourceStack` over `stack` when present — the
dev server resolved it to source positions (web and Android NativeScript dev
sessions; NativeScript frames match by line text, so an occasional frame may
stay raw). Keep secrets out
of thrown errors — they cross the dev channel verbatim.

## Choose what to cover

Actions invoke handlers; they never deliver input. Cover reachable behaviors
and escape hatches — fixture setup, state reads, submit/dismiss paths, a way
out of every stuck state — and leave taps, swipes, pull-to-dismiss,
long-presses, and IME/keyboard paths to real-input tooling (`adb input`,
`simctl`, browser automation). Action coverage is not UI coverage; the guide's
[coverage contract](../../../../docs/testing/development-actions.md#choose-what-your-actions-cover)
carries the full rationale and examples.

- Keep a real-data boundary: no real credentials as input, no remote/account
  mutation, no OS side effects. Scope destructive actions to fixture entities
  (`dev-`-prefixed ids) and refuse fixture writes while a real backend session
  exists.
- Register where the state lives: a sometimes-mounted composer or panel
  attaches its own draft/submit/dismiss actions while open, so they are listed
  exactly when their state exists. Reserve module-level registration for
  always-relevant reads, navigation, and escape hatches.
- `availability.ready` gates are contracts; deadlock is a real failure mode.
  If one app state can lock every gated action — a capture screen that
  auto-starts a recording blocks every idle-gated action behind
  `recording: true` — ship an escape action that is deliberately not gated on
  that state.
- The registry is a live view, not a snapshot: after 15 seconds without an
  announcement, an instance leaves live listings and rejects new work.
  In-flight jobs fail with `disconnected_runtime` and may have unknown effects;
  inspect app state before retrying. A stopped or suspended app can still
  appear live during that lease. Heartbeats preserve the registry revision;
  declaration changes can make it stale. Rediscover the instance and revision
  before each invoke.

## Reaching screen-owned actions

Prefer actions that declare `route`: the app navigates to that URL itself when
the handler's screen is not mounted, waits for attach + readiness, then runs.
Check the listing's `location` first to see where the app is. If the needed
action has no `availability.route`, fall back to invoking `xplat.navigate`
(registered in dev builds by generated routes) with `{ "url": "/path" }`
before the target action — and remember it never navigates back. Its
failures reuse the router's `navigation_blocked`/`navigation_failed` codes.

## Connect and verify

Registration automatically starts the app-side bridge; a separate startup call
is unnecessary for registered actions. The dev server still needs
`xplatDevBridge` from `@octane-xplat/cli/vite`: the web starter includes it, and
the NativeScript preset includes it. Follow the guide's
[bridge setup](../../../../docs/testing/development-actions.md#connect-the-running-app)
when configuring an existing app.

```ts
import { defineConfig } from 'vite'
import { xplatDevBridge } from '@octane-xplat/cli/vite'

// Merge into the existing config, preserving its other plugins and settings.
export default defineConfig({ plugins: [xplatDevBridge()] })
```

Web is the qualified transport; Android was verified on one physical device
through `xplat dev` (dev server reached via adb reverse). iOS/Windows share
bridge machinery but are not runtime-qualified; macOS AppKit and Linux adapters
are unavailable.
Declaring an action's platforms does not establish transport support.

Use the [CLI action workflow](cli.md#inspect-and-assert-supported-behavior) to
discover the exact instance, contract, and revision, invoke within the task's
authorization, and follow the job through completion. Invocation requires
`runtime-actions`; declared external effects also require `external-effects`.
Actions serialize by default. Request keys recover live jobs, not arbitrary
later reruns; inspect an uncertain outcome before retrying. Independently assert
the resulting screen state using supported inspection or app tests.

```sh
pnpm exec xplat actions list --json
# Use identities and contracts from the listing; replace all placeholders.
pnpm exec xplat actions invoke --action ACTION_ID --instance INSTANCE_ID --revision REVISION --input '{}' --request-key fixture-setup-1 --json
pnpm exec xplat actions status JOB_ID --json
```
