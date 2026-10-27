# `@octane-xplat/posthog`

```sh
pnpm add @octane-xplat/posthog
```

PostHog product analytics and feature flags — `posthog-js-lite` (the
isomorphic core posthog-react-native wraps) on native with
`ApplicationSettings` persistence, `posthog-js` on web.

```ts
import { posthog } from '@octane-xplat/posthog'

posthog.init({ apiKey: POSTHOG_KEY, host: 'https://us.i.posthog.com' })
posthog.identify(user.id, { plan: 'pro' })
posthog.capture('checkout_started', { items: 3 })
if (posthog.isFeatureEnabled('new-paywall')) showV2()
await posthog.flush() // before backgrounding
```

Web gains posthog-js's autocapture/replay; native is capture + flags (session
replay is unsupported upstream).
