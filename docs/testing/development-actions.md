# Declare development actions

> Let a connected agent put your dev app into useful states — a test login, a fixture dataset, a prepared performance scenario — through named, typed actions your app owns.

Development actions are small functions your app registers in development
mode. The framework announces them to a connected MCP server automatically:
no per-action wiring, no separate registry file. An agent lists the live
registry, reads each action's contract, and invokes it against your exact
running app instance.

## Declare an action

Call `registerDevAction` from `@octane-xplat/platform/dev-actions`, behind
your bundler's development gate so the handler — and any test credentials —
never ship in a production build:

```ts
import { registerDevAction } from '@octane-xplat/platform/dev-actions'

if (import.meta.env.DEV) {
	registerDevAction({
		id: 'auth.login-as-test-admin',
		title: 'Log in as test admin',
		description: 'Signs in the seeded admin test account. Use before admin-screen checks.',
		input: {},
		result: { fields: { role: { type: 'string' } } },
		effects: { summary: 'changes the active session', auth: true },
		run: async () => {
			await testAuth.signIn('admin-fixture')
			return { role: 'admin' }
		},
	})
}
```

Every action declares:

- a **stable id** (`auth.login-as-test-admin`), title, and description —
  what it does and what success means
- an **input contract**: named typed fields (`string`, `number`, `integer`,
  `boolean`, `object`, `array`) with defaults and constraints
- a **result contract**: the structured output the agent checks
- **effects**: what changes — auth, navigation, app state, test data, or
  `externalEffects` (outside the app; the server requires an explicit
  `external-effects` grant for those)
- **availability**: platforms it applies to and a live `ready` probe when
  availability depends on a test service
- **execution policy**: `serialized` (default — one at a time per app
  instance) or `overlap`, plus `cancellable` and `retryable` flags

Registration returns a handle — `dispose()` removes the action (for example
from a component that owns it). Duplicate ids throw immediately.

## Expose the registry

Two pieces connect the app to the MCP server:

1. The **dev-server bridge**: the `xplatDevBridge` vite plugin hosts the
   channel at `/__xplat_dev__/`. It is already inside the `xplatNative`
   preset (iOS/Android/Windows); web configs add it once:

   ```ts
   plugins: [...octane(), xplatBoundary('web'), xplatDevBridge()],
   ```

   The plugin is dev-server-only — nothing in `vite build` output.

2. **Starting the bridge in the app**: call `startDevActionBridge()` once in
   dev mode (for example near your app entry, inside the same `DEV` gate).
   It announces the registry and keeps announcing on every change — the MCP
   server discovers it automatically for the selected workspace.

From there the agent does the rest: `xplat_dev_actions` lists the live
registry; `xplat_dev_action_invoke` validates input against your contract
and runs the action, reporting succeeded/failed/cancelled with any partial
effects your handler disclosed through `context.reportPartialEffect(...)`.

## Honest limits

- Actions are development/test surfaces. Keep privileged behavior behind
  your own test-only fixtures — an action must never become a route to
  production access or return secrets.
- A completed action means the setup ran — it does not prove the screen or
  feature works. Verify behavior separately.
- Web is the qualified transport today. iOS/Android/Windows dev servers use
  the same bridge machinery but are not yet runtime-qualified; macOS AppKit
  and Linux need their own adapters and report unavailable.
