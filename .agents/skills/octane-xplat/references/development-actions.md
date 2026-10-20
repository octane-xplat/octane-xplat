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

Web is the qualified transport. iOS/Android/Windows share bridge machinery but
are not runtime-qualified; macOS AppKit and Linux adapters are unavailable.
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
