# Diagnose production errors

> Send a controlled error, match it to the deployed build, and recover readable source locations without collecting free-form app data.

Start with one handled error in a Sentry test project. Then build the browser
app, upload its source maps, and repeat the check from that exact build. A
**handled error** is deliberately reported while the app keeps running; a native
crash requires a separate crash-and-relaunch test.

This walkthrough leads with browser Sentry reporting. It uses an app-owned
browser module because Xplat's small Sentry wrapper does not yet expose filtering
and collection lifecycle controls ([#73](https://github.com/octane-xplat/octane-xplat/issues/73)).
Native Sentry, symbol uploads and Crashlytics are covered [below](#report-from-ios-or-android),
with the current integration gaps stated explicitly. Desktop leaves currently reuse the browser adapter; a bare non-browser
JavaScript host is not supported by that availability check. Development console
logs and [development diagnostics](diagnostics.md) are separate from production reports.

## Connect a test project

Create a browser JavaScript project in Sentry and copy its **DSN** from project
settings. The DSN identifies the destination for reports. It is different from
the private upload token used later. From your app directory, install the
versions used by the maintained example:

```sh
bun add @sentry/browser@11.9.0
bun add -D @sentry/cli@3.8.2
```

Copy [reporting.web.ts](../../packages/sentry/examples/reporting.web.ts) into
`src/reporting.web.ts`. Keep browser SDK imports in this web file. Add
`src/reporting-config.ts` and replace the DSN with your test project's value:

```ts
export const reportingConfig = {
  dsn: 'https://PUBLIC_KEY@YOUR_SENTRY_HOST/PROJECT_ID',
  release: 'packing@0.1.0+1',
  dist: 'web-1',
  environment: 'staging',
}
```

The **release** identifies app source/version; **dist** distinguishes the exact
build within it. Assign new build identity when the artifact changes. The
**environment** separates staging from production in the same project. These
values are public app metadata, not upload credentials.

Add `src/ReportingScreen.web.tsx` for the initial check:

```tsx
import { useState } from 'octane'
import { Pressable, Text, VStack } from '@octane-xplat/ui'
import { reportingConfig } from './reporting-config'
import { reportDeliveryCheck, startReporting, stopReporting } from './reporting.web'

export function ReportingScreen() {
  const [status, setStatus] = useState('Reporting disabled.')
  const [stopping, setStopping] = useState(false)
  return <VStack>
    <Text>{status}</Text>
    <Pressable disabled={stopping} onPress={() => {
      try {
        startReporting(reportingConfig)
        setStatus('Reporting enabled for this test.')
      } catch {
        setStatus('Could not initialize reporting. Check the test configuration.')
      }
    }}><Text>Enable reporting</Text></Pressable>
    <Pressable disabled={stopping} onPress={() => {
      const eventId = reportDeliveryCheck()
      setStatus(eventId ? `Queued event ${eventId}; find it in Sentry.` : 'Enable reporting first.')
    }}><Text>Send handled check</Text></Pressable>
    <Pressable disabled={stopping} onPress={async () => {
      setStopping(true)
      try {
        await stopReporting()
        setStatus('New reporting stopped.')
      } catch {
        setStatus('New reporting stopped; draining queued reports failed.')
      } finally {
        setStopping(false)
      }
    }}><Text>Stop reporting</Text></Pressable>
  </VStack>
}
```

For this browser check, render the screen from `src/main.web.tsrx`, keeping the
starter's style imports. The complete test entry is:

```tsx
/** @jsxImportSource @octane-xplat/jsx/dom */
import { createRoot } from 'octane'
import { ReportingScreen } from './ReportingScreen.web'
import '@octane-xplat/ui/theme/tokens.css'
import './style.css'

createRoot(document.getElementById('root')!).render(<ReportingScreen />)
```

Run your browser app, press **Enable reporting**, then **Send handled check**.
Find the event ID in the intended Sentry project and confirm release, dist and
staging environment. A queued ID confirms SDK acceptance, not delivery. The
example masks exception messages as **Application error**; its allowed breadcrumb
is `report-delivery-check`. Keep the app open while checking delivery.

## Own filtering and collection

Initialize reporting once in the app's browser owner after its collection
preference allows it. The test screen makes that choice explicit; a real app
can read its saved preference at startup. Stop reporting when that choice is
withdrawn, and await closure before enabling again:

```ts
import { reportingConfig } from './reporting-config'
import { startReporting, stopReporting } from './reporting.web'

export async function changeReportingPreference(enabled: boolean) {
  if (enabled) startReporting(reportingConfig)
  else await stopReporting()
}
```

The copied module uses the installed SDK's `dataCollection` controls, drops
unapproved breadcrumbs, and returns an allowlist of event fields. It removes
user/request/context/extra data and free-form error messages while retaining
stack positions, Debug IDs and build identity. This trades detailed messages
for less application data. Review the outgoing event for your app; source paths,
function names and build metadata must also be appropriate to disclose.
The app-owned filter can be checked directly with controlled input:

```ts
import { filterError } from './reporting.web'

const safe = filterError({
  type: undefined,
  message: 'Private text that must not be sent',
  extra: { token: 'DO_NOT_SEND' },
})
console.log(safe.message) // Application error
console.log(safe.extra) // undefined
```

Follow Sentry's [filtering guidance](https://docs.sentry.io/platforms/javascript/configuration/filtering/)
when adapting the filter. Stopping prevents new reports through the module and
its hooks; a request already in flight cannot be recalled. The module closes
the SDK after allowing already-queued delivery to drain. It does not implement
a preference UI or a policy for your product. Do not initialize this SDK and the
Xplat browser wrapper as two reporting owners in the same app.

## Build and upload the matching browser artifacts

A **source map** connects a compressed JavaScript position to the original
TypeScript source. A **Debug ID** binds the deployed bundle to its matching map.
Add `build: { sourcemap: 'hidden' }` to the object returned by your existing
`vite.config.ts`. Preserve its Octane/Xplat plugins and platform resolution:

```ts
import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { xplatCss, xplatBoundary, xplatDevBridge, xplatNodeEnvDefine } from '@octane-xplat/cli/vite'

// The web build. For native (iOS/Android), the same source runs through
// @nativescript-community/vite-octane with `conditions: ['native']`, the
// .ios/.android/.mobile suffix chain, and the unsuffixed native default — see
// the octane-xplat repo's apps/mobile/vite.config.mts.
export default defineConfig(({ mode }) => ({
	plugins: [xplatCss('web'), ...octane(), xplatBoundary('web'), xplatDevBridge()],
	define: xplatNodeEnvDefine(mode),
	build: { sourcemap: 'hidden' },
	server: { port: 5200 },
	resolve: {
		conditions: ['web'],
		// Suffix chain (first match wins): .web → shared → fallback.
		extensions: [
			'.web.tsrx',
			'.tsrx',
			'.web.tsx',
			'.tsx',
			'.web.ts',
			'.mjs',
			'.mts',
			'.ts',
			'.jsx',
			'.js',
			'.json',
		],
	},
}))
```

This matches the starter's browser config with source maps enabled. Preserve
any app-specific additions when applying it. Hidden maps are still emitted to the output directory, so exclude them from
public deployment after uploading. Sentry's [CLI upload workflow](https://docs.sentry.io/platforms/javascript/sourcemaps/uploading/cli/)
explains the artifact matching.

Set `SENTRY_ORG` and `SENTRY_PROJECT` to your project slugs. Supply
`SENTRY_AUTH_TOKEN` as a build/CI secret with permission to upload artifacts;
never put it in a `VITE_*` variable, runtime configuration or source file.
Use exactly the release/dist from `reporting-config.ts`:

```sh
export SENTRY_ORG=YOUR_ORG_SLUG
export SENTRY_PROJECT=YOUR_PROJECT_SLUG
export SENTRY_RELEASE='packing@0.1.0+1'
export SENTRY_DIST='web-1'
bun run vite build
bun run sentry-cli sourcemaps inject dist
bun run sentry-cli sourcemaps upload --release "$SENTRY_RELEASE" --dist "$SENTRY_DIST" dist
```

Run these in the app directory with the private upload token already supplied
by your build environment. Upload the final bundles/maps and deploy **that same
injected output**. Rebuilding afterward creates a different artifact. Perform
injection before computing deployment integrity hashes or compression.

Confirm the artifact bundle appears in the project's Source Maps settings.
Remove only generated maps from this fresh output before deployment:

```sh
find dist -type f -name '*.map' -delete
bun run vite preview
```

Open the preview, enable reporting and send another handled check. Find its ID
in Sentry. The event must have the intended release/dist and resolve its stack
to `reportDeliveryCheck` in your copied TypeScript file, with a readable source
line. Then repeat from the deployed build. A successful upload command alone
does not establish readable reporting.

## Report from iOS or Android

The Xplat native wrapper uses `@nativescript-community/sentry`. Install it in a
phone app and initialize once at native startup, before work you want to report:

```sh
bun add @octane-xplat/sentry
```

The wrapper supports explicit build identity, handled errors and breadcrumbs.
For an isolated native test project, call this initializer with its DSN:

```ts
import { sentry } from '@octane-xplat/sentry'

export function startNativeReporting(dsn: string) {
  if (!sentry.supported) return
  sentry.init({
    dsn, release: 'packing@0.1.0+1', dist: 'ios-1', environment: 'staging',
    sampleRate: 1, tracesSampleRate: 0,
  })
  sentry.addBreadcrumb({ category: 'test', message: 'Native reporting check' })
  sentry.captureException(new Error('Xplat native handled check'))
}
```

Use the correct target/build dist for Android. The wrapper's current contract
cannot express the browser module's filtering or collection controls; do not
pass untyped options and assume native parity. Track [#73](https://github.com/octane-xplat/octane-xplat/issues/73)
when choosing this integration for production.

For readable native reports, preserve the exact installed release artifact:

- **JavaScript maps:** the installed NativeScript plugin documents a Webpack
  workflow. The starter uses Vite; the framework's native Vite map/release
  pipeline remains unqualified in [#74](https://github.com/octane-xplat/octane-xplat/issues/74).
  Do not paste a Webpack plugin into `vite.config.native.mts` or assume browser
  artifact injection qualifies the native stack format.
- **iOS symbols:** retain the `.xcarchive` and its `dSYMs` directory from the
  [native release workflow](../start/native-release.md). Upload those exact
  symbols using [Sentry's dSYM instructions](https://docs.sentry.io/platforms/apple/dsym/).
  A typical explicit upload, with your archive path substituted, is below.
- **Android symbols:** retain the release's R8/ProGuard mapping when shrinking
  is enabled and native debug symbols when native code requires them. Inspect
  the generated Gradle output and the installed Sentry plugin's build tasks;
  do not substitute JavaScript maps for Java/Kotlin or native symbols.

```sh
bun run sentry-cli debug-files upload ./Packing.xcarchive/dSYMs
```

Use build-only upload credentials and the intended project. Symbols must match
the crashing binary; re-archiving the same source can produce different symbols.
Native readable-stack delivery and native crash/relaunch must each pass from
an installed build before claiming qualification. Browser symbolication does
not close those native gates.

## Use Crashlytics as a native alternative

Crashlytics is an iOS/Android alternative; its Xplat web and desktop leaves are
unsupported. Complete [NativeScript Firebase setup](https://firebase.nativescript.org/)
with the matching app's `GoogleService-Info.plist`/`google-services.json`, app
initialization and symbol-upload configuration. The current wrapper misses the
plugin's JS registration import ([#75](https://github.com/octane-xplat/octane-xplat/issues/75)).
Until corrected, declare the plugin directly and load it at native bootstrap:

```sh
bun add @octane-xplat/firebase-crashlytics @nativescript/firebase-crashlytics@5.0.2
```

This import belongs in a native entry, before using the configured service:

```ts
import '@nativescript/firebase-crashlytics'
import { crashlytics } from '@octane-xplat/firebase-crashlytics'

export async function reportNativeHandledCheck() {
  if (!crashlytics.supported) return
  await crashlytics.setCrashlyticsCollectionEnabled(true)
  crashlytics.log('Controlled reporting check')
  crashlytics.recordError(new Error('Xplat Crashlytics handled check'))
}
```

Firebase app initialization remains required before that function. Use the
service's collection and unsent-report methods according to your app's choice;
a handled check does not prove fatal-crash delivery. Follow Firebase's
[current setup and crash-test instructions](https://firebase.google.com/docs/crashlytics/get-started)
for the native build and symbol requirements. Perform deliberate crashes only
in an owned test build, then relaunch and inspect the correctly identified report.

## Recover missing or unreadable reports

| Symptom | Check |
| --- | --- |
| Queued ID, no event in the expected project | DSN, network/content blocking, project/environment filters, SDK initialization and sampling |
| Event has the wrong build | SDK release/dist versus uploaded artifacts and the installed/deployed file; do not reuse build identity |
| Browser stack stays compressed | Upload includes the actual injected bundle and matching map; verify Debug IDs and use the exact deployed output |
| Native stack is unreadable | Separate JavaScript maps, iOS dSYMs, Android shrinker mapping and native symbols; check #74 rather than assuming the browser pipeline applies |
| Crashlytics says unavailable | Firebase app configuration/initialization and the explicit registration workaround in #75 |
| Stop reporting seems ineffective | Ensure only one SDK owner exists; distinguish new reports from a request already in flight |

The maintained checks exercise the browser filter and collection lifecycle with
controlled SDK calls. The artifact check builds the example, injects Debug IDs
and confirms the map retains its original TypeScript. They make no credentialed
upload and establish no project delivery, deployed source resolution, native
symbol upload or crash/relaunch result. Run the external checks above for your
own test project and record each target separately.
