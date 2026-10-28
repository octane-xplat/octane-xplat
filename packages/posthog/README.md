# @octane-xplat/posthog

Send product events and read feature flags through PostHog. Native apps use
`posthog-js-lite`; web uses `posthog-js`. Native session replay is unavailable.

## Record a test event

Install in an existing Xplat app:

```sh
pnpm add @octane-xplat/posthog
```

Copy the project API key and host from your PostHog project settings. Pass them
to this startup function once; use a test project while checking integration:

```ts
import { posthog } from '@octane-xplat/posthog'

export async function initializeAnalytics(apiKey: string, host: string) {
	if (!posthog.supported) return
	posthog.init({ apiKey, host })
	posthog.capture('packing_list_opened', { source: 'documentation-example' })
	await posthog.flush()
}
```

Check the project's event view for `packing_list_opened`. A resolved flush is
not proof that a dashboard has received or displayed it; check project, host,
network, and collection settings if the event is absent.

Keep identifiers and event properties appropriate for your app's data policy.
See the [public contract](https://github.com/octane-xplat/octane-xplat/blob/main/packages/posthog/src/types.ts)
for identity, feature flags, and collection controls, and
[device feature guidance](https://octane-xplat.goddardai.org/platform-services)
for availability checks.
