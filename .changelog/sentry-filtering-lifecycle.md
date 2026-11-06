### Filter and control Sentry reporting

`@octane-xplat/sentry` now exposes typed event and breadcrumb filtering plus
collection lifecycle controls on every platform. Return `null` from
`beforeSend` or `beforeBreadcrumb` to drop a report, pass `enabled: false` to
initialize without collecting, and use `setEnabled`, `flush` and `close` for
runtime consent changes. `close` reports whether the queue drained and also
stops native crash capture on iOS and Android.

```ts
import { sentry } from '@octane-xplat/sentry'

sentry.init({
  dsn,
  release: 'app@1.0.0+1',
  beforeSend: (event) => (event.user ? { ...event, user: null } : event),
  beforeBreadcrumb: (crumb) => (crumb.category === 'fetch' ? null : crumb),
})

await sentry.close()
```

On iOS and Android a native crash report invokes `beforeSend` but ignores its
result — use the collection controls to stop crash capture. On Android,
`flush` covers the JavaScript queue only.

See [Diagnose production errors](https://octane-xplat.goddardai.org/production-errors).
