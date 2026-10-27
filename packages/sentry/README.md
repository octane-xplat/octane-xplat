# `@octane-xplat/sentry`

```sh
pnpm add @octane-xplat/sentry
```

Sentry error and performance reporting — `@nativescript-community/sentry`
(sentry-cocoa + sentry-java) on iOS/Android, `@sentry/browser` on web and
desktop JS hosts. Mirrors `@sentry/react-native`'s surface.

```ts
import { sentry } from '@octane-xplat/sentry'

sentry.init({ dsn: process.env.SENTRY_DSN!, tracesSampleRate: 0.2 })
sentry.setUser({ id: user.id })
sentry.addBreadcrumb({ category: 'checkout', message: 'cart submitted' })
try { pay() } catch (e) { sentry.captureException(e, { orderId }) }
```

Native crash capture is iOS/Android; web/desktop capture JS errors and
breadcrumbs. Source-map/dSYM upload is a build recipe, not this package.
