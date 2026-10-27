### New package: `@octane-xplat/sentry`

Sentry errors, breadcrumbs, user context, and performance options —
`@nativescript-community/sentry` on iOS/Android, `@sentry/browser` on web.

```ts
sentry.init({ dsn: SENTRY_DSN })
sentry.captureException(error, { orderId })
```
