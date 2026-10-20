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
once per owner, not during rendering; duplicate IDs throw. Component-owned
registrations should dispose their handles when their owner is removed.

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

## Connect the running app

Web is the qualified action transport today. iOS/Android/Windows dev servers
share the bridge machinery but are not runtime-qualified; macOS AppKit and Linux
need their own adapters and report unavailable.

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

## Keep the boundary clear

Actions prepare state and expose app-defined operations. They do not prove
coordinate hit-testing, OS input, or that a user can complete the same journey.
Use separate interaction tests for those claims.

Keep privileged fixture imports inside the development-only path, never return
secrets, and check that fixture declarations and handlers are absent from
production artifacts. The bridge being unavailable in production is not evidence
that fixture code was removed.

MCP clients can use the same services through `xplat_dev_actions`,
`xplat_dev_action_invoke`, and `xplat_dev_action_status`. For optional availability,
cancellation, and partial-effect contracts, consult the installed
`@octane-xplat/platform/dev-actions` declarations.
