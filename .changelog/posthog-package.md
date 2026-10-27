### New package: `@octane-xplat/posthog`

PostHog analytics + feature flags — `posthog-js-lite` on iOS/Android
(persisted via `ApplicationSettings`), `posthog-js` on web.

```ts
posthog.init({ apiKey: POSTHOG_KEY })
posthog.capture('checkout_started', { items: 3 })
posthog.isFeatureEnabled('new-paywall')
```
