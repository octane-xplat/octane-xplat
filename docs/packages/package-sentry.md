# @octane-xplat/sentry

> Sentry error and performance reporting for Octane xplat — @nativescript-community/sentry on iOS/Android, @sentry/browser on web

Report application errors to Sentry. iOS and Android use the NativeScript
Sentry plugin for native crash reporting; browser hosts use the browser adapter for JavaScript errors and breadcrumbs.
Desktop leaves reuse that adapter and require a browser `window`; a bare AppKit
or other non-browser JS host does not become supported merely by importing it.
Follow [Diagnose production errors](https://octane-xplat.goddardai.org/production-errors)
for a complete browser filtering/artifact path and native qualification limits.


[Generated API reference](https://octane-xplat.goddardai.org/api-sentry).

## Send a handled test error

Install in an existing Xplat app:

```sh
bun add @octane-xplat/sentry
```

Use a Sentry test project. Its DSN is the address the SDK uses to send reports.
Pass that configured value at startup; shared code must not assume Node's
`process.env` exists in a browser or native runtime:

```ts
import { sentry } from '@octane-xplat/sentry'

export function initializeErrorReports(dsn: string) {
  if (!sentry.supported) return
  sentry.init({ dsn, environment: 'development' })
  sentry.addBreadcrumb({ category: 'example', message: 'Sending a test report' })
  sentry.captureException(new Error('Xplat documentation test'))
}
```

Look for the handled test error in the selected project. If it is absent,
check the DSN, network, environment filters, and SDK initialization. This
example sends a handled error; it does not test a native crash.

The wrapper exposes typed event/breadcrumb filtering (`beforeSend`,
`beforeBreadcrumb`) and collection lifecycle controls (`enabled`,
`setEnabled`, `flush`, `close`) across platforms. On iOS/Android a native
crash report invokes `beforeSend` but ignores its result — collection
controls, not the filter, stop crash capture. Source maps and native
symbols need separate build/upload configuration to make production traces
readable. The native JavaScript-map pipeline is qualified at build level —
the `native` preset plus `extra.build.sourcemap` emits maps that take
Debug ID injection — while the credentialed upload, installed-artifact
delivery, dSYM/Android symbol uploads and crash/relaunch checks remain
external target steps ([#74](https://github.com/octane-xplat/octane-xplat/issues/74)). See the
[public adapter contract](https://github.com/octane-xplat/octane-xplat/blob/main/packages/sentry/src/types.ts)
and [checking an app](https://octane-xplat.goddardai.org/testing) for the boundary
between this integration check and testing the app itself.
