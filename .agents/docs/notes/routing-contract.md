# Routing contract refinement

> **Hard cutover (2026-10-19):** the old router stores, helpers and compatibility
> adapter are removed. Compatibility sections below preserve implementation
> history; they are not supported workflows. Use the
> [canonical guide](../../../docs/app/navigation.md),
> [current plan](../../plans/routing-api.md) and
> [qualification commands](../navigation-checks.md).

Decision #118 implements the routing plan with familiarity and type safety as
the primary criteria. Preserve named route-file exports; use a typed helper for
programmatic inference, and generate registration for both. A destination is
identified by an absolute pattern, with path params and search kept separate.

```ts
// Target surface; introduced incrementally through the routing refinement.
router.push({ to: '/items/:id', params: { id: 'coat' } })
```

Immutable catalogs contain definitions. Mutable matches, context, attempts,
subscriptions, registry layers, and cleanup belong to an instance/request.
Preparation has no browser/native host dependency; adapters own committing to
history, Frames, and outlets. The ordinary client facade remains convenient.

```text
catalog + instance context -> match/validate/guard/load -> prepared outcome
prepared outcome -> browser/native/server adapter -> host-specific result
```

The internal `routing-core.ts` now snapshots catalog definitions per instance
and prepares strict URLs without a renderer. It validates search before guards,
merges admitted context, suppresses stale work, and returns explicit ready,
redirect, invalid, denied, missing-resource, failed, or cancelled outcomes.
Adapters still need migration to use this engine; a prepared result is not a
browser/native commit or an HTTP response.

```ts
// Internal engine use; application-facing typed facade is introduced separately.
const preparation = createRoutePreparation({ catalog, context: requestContext })
const outcome = await preparation.prepare('/items/coat', { redirects: 'return' })
preparation.dispose()
```

The host supplies a cancellation controller when cooperative abort is available.
Request supersession/disposal still settles promptly and suppresses late results
when a loader ignores cancellation. Independent native flows prepare separately;
linear browser history uses one request scope.

```ts
const preparation = createRoutePreparation({
	catalog,
	history: 'linear',
	createCancellationController: hostCancellationFactory,
})
```

Shared routing grammar lives in `@octane-xplat/lib/route-pattern`, used by the
CLI and UI. Its small emitted JavaScript entry is Node-safe when installed;
the lib root retains its existing authored-source publishing contract.

```ts
import { routePatternPath } from '@octane-xplat/lib/route-pattern'
routePatternPath('items/[id]') // '/items/:id'
```

Presentation and transition are independent. Keep legacy calls as migration
adapters while the new contract lands; do not mark a design requirement as
runtime-qualified until its maintained checks have actually run. The full
[implementation plan](../../plans/routing-api.md) owns feature scope and proof
criteria, including Windows runtime verification being unavailable in this task.

The renderer-free `routing/core` entry now exposes programmatic inference and
preparation. A plain search parser or Standard Schema v1 validator distinguishes
navigation input from validated output. Screen data comes from the loader;
guard additions extend root context. The existing client adapters still need
migration before these preparation callbacks become ordinary navigation hooks.

```ts
import { defineRoute, defineRoutes, createRoutePreparation } from '@octane-xplat/ui/routing/core'

const item = defineRoute({
	path: '/items/:id',
	validateSearch(raw: { page?: unknown }) {
		return { page: Number(raw.page ?? 1) }
	},
	loader: ({ params, search }) => ({ title: params.id, page: search.page }),
}).screen(({ data }) => data.title)
const preparation = createRoutePreparation({ catalog: defineRoutes([item]) })
const result = await preparation.prepare('/items/coat?page=2')
preparation.dispose()
```

Generated augmentation must refer to the same registry symbol as the operation
types. Root barrels now re-export those interfaces from `props.ts`. A separate
consumer compiler fixture checks legacy and complete contracts through package
exports; it runs outside the main TypeScript program to avoid polluting its
ambient registry. Source inference fixtures separately check invalid paths,
params, search values, screen data, stacks, and transition names.

`xplat.routes.json` is the declarative discovery boundary. Its manifest exports
are referenced by type during generation and imported by the generated catalog
at runtime. File routes get generated guard/loader/screen aliases that depend on
their local exports rather than the ambient union, avoiding self-inference
cycles. The generator also supports context and transition export references
and declared stack names; client instance configuration is a separate adapter
step. The maintained guide manifest no longer registers itself or handwrites
augmentation.

```json
{
	"manifests": [{ "module": "./src/guides.tsrx", "export": "guideRoutes" }]
}
```

Generated `routes.gen.catalog.<target>` modules contain reusable definitions;
`routes.gen.<target>` modules register them with the client. This split avoids
default-router mutation when a custom host imports the catalog. It does not
prove every screen/service module is server-safe: that still requires module
graph and runtime qualification.

```ts
// Custom host; ordinary app startup continues importing './routes.gen'.
import { routes } from './routes.gen.catalog.web'
const preparation = createRoutePreparation({ catalog: routes, context: requestContext })
```

Explicit router instances now wrap preparation with a platform host contract.
The host owns history and retained rendering; the instance owns pending work,
subscriptions, cancellation, retry state and root context. There is no implicit
memory fallback: the caller must supply a host. Ordinary default client and
rendering-hook integration remain a subsequent adapter step.

```ts
import { createRouter } from '@octane-xplat/ui/routing/core'

const navigation = createRouter({ catalog, host: createHost(), context: () => requestContext })
const outcome = await navigation.push({ to: '/items/:id', params: { id: 'coat' } })
if (outcome.status === 'committed') await outcome.finished
```

Awaiting navigation establishes host/render commitment; the separate `finished`
promise reports completed, skipped or failed animation. Back at a base uses a
replacement fallback when supplied. Reset returns `unsupported` before loading
on hosts that cannot reset their history. Refresh reloads the current URL without
pushing or replaying its presentation; retry repeats the last failed attempt.

```ts
await navigation.back({ fallback: { to: '/settings' } })
const reset = await navigation.reset({ to: '/settings' })
await navigation.refresh()
await navigation.retry()
```

URL matching remains separate from admission. `resolveUrl` checks structural
matching and URL syntax, while `navigateUrl` also runs search validation, guards
and loading. This gives external inputs a checked runtime entry without casting
an arbitrary string to an application destination. Pending search values remain
untrusted until validation succeeds.

```ts
const matched = navigation.resolveUrl('/items/coat')
const admitted = await navigation.navigateUrl('/items/coat', { replace: true })
```

Adapters publish accepted external traversal separately from their own commits.
That cancels pending loading without treating a retained screen as a new load.
Deferred host callbacks check `isCurrent` while waiting, then call
`beginCommit()` immediately before their first irreversible mutation. A successful
claim prevents later supersession from relabeling an accepted navigation as
cancelled. Disposal and external traversal can still abort its remaining work. Attempt order survives completion, preventing an older redirect from
claiming a flow after a newer navigation has already finished there.

```ts
import type { RouterHostChange, RouterHostCommand } from '@octane-xplat/ui/routing/core'

function onBrowserBack(notifyRouter: (change?: RouterHostChange) => void) {
	notifyRouter({ external: true, flow: 'root' })
}
function mayCommit(command: RouterHostCommand) {
	return command.beginCommit()
}
```

Catalog composition now carries complete inferred metadata. Literal registration
order replaces an earlier contract for the same pattern, matching runtime
precedence; unknown array order preserves possible output types rather than
claiming a particular winner. Generated registration contributes the combined
map, so a deliberate override does not intersect incompatible loader data.

```ts
const combined = mergeRouteManifests(fileCatalog, configuredCatalog)
const isolated = createRouter({ catalog: combined, host: createHost() })
isolated.dispose()
navigation.dispose()
```

Construction checks the catalog's required root dependencies separately from
guard output. Guard fields shadow root fields with the actual merged type;
they do not become impossible intersections or requirements on the caller.
Dependency containers are plain objects; service instances may be their values.
Signals use the host's standard type when available, so a loader can pass its
signal directly to `fetch` without a cast. Hosts without a standard signal may
supply the minimal cancellation protocol or omit cooperative cancellation.

```ts
const accountRoute = defineRoute.withContext<{ account: { id: string } }>()({
	path: '/account',
	beforeLoad: ({ context }) => ({ owner: context.account.id }),
	loader: ({ context, signal }) => fetch('/api/account', { signal }).then(() => context.owner),
}).screen(({ data }) => data)
const accountNavigation = createRouter({
	catalog: defineRoutes([accountRoute]),
	host: createHost(),
	context: { account: { id: 'a' } },
})
accountNavigation.dispose()
```

Routing dictionaries contain own entries only. Reserved JavaScript property
names remain valid path/data keys; inherited object members are never screens
or directory layouts. Baked modules decode JSON rather than evaluating it as an
object literal, preserving `__proto__` as data at every depth. The strict codec
and legacy query adapter both retain reserved keys without changing prototypes.

```ts
const reserved = defineRoutes([{ path: '/__proto__', screen: () => null }])
Object.hasOwn(reserved.screens, '__proto__') // true
const data = JSON.parse('{"__proto__":{"title":"Ordinary content"}}')
Object.hasOwn(data, '__proto__') // true
```

Dynamic contributions belong to their router instance. `addRoutes` requires a
stable ID, rejects collisions by default, and returns an idempotent disposer.
Reusing an ID replaces its layer in place; an old handle cannot remove the new
layer. Explicit replacement allows shadowing, and removing that layer restores
previous definitions. Removing a layer keeps already prepared history entries;
new navigation and refresh use the remaining definitions. Pending work is
cancelled conservatively on every registry change, including uncooperative
loaders and navigation started synchronously from their abort callbacks.

```ts
const registration = navigation.addRoutes(pluginRoutes, {
	id: 'guides',
	conflict: 'replace', // deliberate override; omitted means collision error
})
registration.dispose()
```

Runtime registration does not invent compile-time route literals. Generate the
complete contract from configured sources, or validate dynamic URLs at runtime.
A typed layer cannot require root dependencies absent from its router's declared
catalog. Collision diagnostics identify the registration and conflicting pattern,
screen name or directory layout. Removing layers never creates an invalid
registry: already accepted later layers keep precedence over restored definitions.

```ts
const result = await navigation.navigateUrl('/guides/packing')
if (result.status === 'not-found') showMissingGuide()
```

The browser route-store module now defers browser globals, history bookkeeping
and popstate wiring until its first client operation. Importing it without a DOM
is safe; using its mutable default registry on a server throws a diagnostic
directing the caller to an explicit instance. This qualifies that routing module
only. It does not establish SSR safety for every screen, UI barrel or service.

```ts
// Server preparation still imports the host-free entry, never the default client.
import { createRoutePreparation } from '@octane-xplat/ui/routing/core'
const preparation = createRoutePreparation({ catalog })
const prepared = await preparation.prepare('/items/coat')
preparation.dispose()
```

Generated catalogs now select the module graph before evaluation. Separate iOS
and Android leaves exclude the other OS and shadowed shared/mobile modules; the
explicit mobile catalog is the shared subset. Linux has its own catalog with
Linux → web → shared precedence. Variant exclusion follows normalized route or
layout identity, so mixing `.tsx` and `.tsrx` cannot execute a shadowed module.
The configured source directory is passed into derivation, including parent and
hidden directory prefixes; automatic generation honors configuration before
conventional `app`/`src/app` discovery.

```ts
// Source callers retain the familiar platform-neutral import.
export { routes, screens } from './routes.gen'
// Custom iOS hosts may import definitions without default-client registration:
// import { routes } from './routes.gen.catalog.ios'
```

NativeScript 9.1.3 delivers iOS scene URLs on `Application.ios` through
`sceneWillConnect`, `sceneOpenURLContexts`, and `sceneContinueUserActivity`.
The platform adapter normalizes the first connection's URL/activity into the
single-consumption cold URL, then dispatches subsequent scene deliveries to
listeners. Scene notifications are authoritative, avoiding a duplicate if a
custom delegate also forwards an event into the legacy app bus. Legacy
`openUrl`/`continueActivity` compatibility names are not automatic NativeScript
scene events. Register the listener before native application startup and
consume the cold value after the navigation host is ready.

```ts
import { onDeepLink, consumeInitialUrl } from '@octane-xplat/platform'

const pendingUrls: string[] = []
const dispose = onDeepLink((url) => pendingUrls.push(url))
// Once the native navigation host is ready:
const coldUrl = consumeInitialUrl()
// The routing adapter validates/adopts coldUrl, then drains pendingUrls.
// Dispose at the app/window boundary.
```

Source provenance: installed NativeScript 9.1.3 and its
[pinned scene delegate implementation](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/application/application.ios.ts).
Foundation `NSSet.allObjects` may be an NSArray bridge, so event normalization
accepts both an ordinary array and `count`/`objectAtIndex` enumeration. This
adapter is for incoming OS events; it does not create new windows or make a
URL an authorization grant.

### Rendering scopes and inferred hooks

`RouterProvider` binds an explicit instance to a rendering tree; it does not
own disposal. `useRouter`, `useRouterState`, and `useRouteMatch` require that
scope. A supplied instance argument infers isolated contracts and checks runtime
identity; the no-argument form uses generated application contracts. A missing
scope is an error while default client wiring is still being migrated.

```tsx
<RouterProvider router={navigation}>
	<CustomHostContent />
</RouterProvider>
```

`getRouteApi(to, instance?)` checks the rendering match before returning inferred
params/search/data/context. Native retained entries use an internal
`createRouterRenderScope(instance, flow, entryMatchStore)` boundary, keeping
entry data separate from the flow's current navigation state. Both DOM/jsdom
and universal/object-driver cases cover live subscriptions, independent
retained data, flow-bound navigation, identity errors, and caller-owned cleanup;
these are renderer tests, not real platform host qualification.

```ts
const item = getRouteApi('/items/:id', navigation)
const title = item.useLoaderData().title
```

### Browser host commit adapter (internal integration)

The instance now supplies `RouterHostCommand.content` from the same catalog
snapshot that prepared the route. A host receives selected screen/layout/error
components and screen props without reading a shared global registry. Modern
`defineRoute` screens receive separate params/search/context/data; legacy
manifests retain their flat screen props during migration.

```ts
// Inside a platform host's commit(command):
const { route, content, flow } = command
if (!route || !content) throw new Error('Expected prepared render content')
if (!command.beginCommit()) return { status: 'cancelled', reason: 'superseded' }
```

`browser-router-host.web.ts` and `ClientRouteOutlet.web.tsrx` provide the internal
browser integration. The host publishes inside Octane `flushSync` and waits for
`ClientRouteView`'s layout receipt. Render errors reject that receipt and become
commit failures. Browser history contains opaque entry IDs/depth, while prepared
values remain in instance-owned memory. Replaced and abandoned forward entries
are pruned. Back/Forward renew render receipts rather than reusing an already
resolved promise from a previous mount.

```tsx
// Internal fixture setup; not the public default client API yet.
const platform = createBrowserRouterHost()
const navigation = createRouter({ catalog, host: platform.host })
platform.attach(navigation)
<ClientRouteOutlet host={platform}><BaseScreen /></ClientRouteOutlet>
```

A modal owns a separate bound flow. Navigating within it keeps that flow;
Back traverses one entry and dismiss traverses to its presenter. The browser
host explicitly rejects reset and missing presenter history. It blocks commands
without a mounted outlet and cancels pending preparation when that owner leaves.
Owner removal is a distinct host event from external history traversal: it
cancels only that flow's unaccepted work. Accepted root navigation and redirects
can remove their old named outlets without relabeling the commit as cancelled.
Default facade/outlet migration, cold/unknown-location preparation, account
invalidation, scroll/focus, and View Transitions remain outstanding. This
adapter must not be treated as complete browser routing until those boundaries
are integrated.

```ts
const opened = await navigation.push({ to: '/settings', presentation: 'modal' })
// Inside that modal's routed screen:
const modalNavigation = useRouter(navigation)
await modalNavigation.push({ to: '/settings' })
await modalNavigation.dismiss()
```

On 2026-10-19, `pnpm --filter @xplat/web smoke:routing` passed 11 assertions in
headless Chromium from production-built CSR output. Assertions inspect the DOM
immediately after awaited navigation, use browser pointer activation, preserve
DOM/local state through refresh, replace an entry, traverse Back/Forward, and
push/dismiss a multistep modal. No screenshots were taken. DOM/jsdom host tests
also cover render failure and owner-removal cancellation. Universal/object-driver
cases qualify shared entry render/failure receipts, not NativeScript Frames or
AppKit transport timing. View Transitions were not exercised by this pass.

### Named screens and loader inference

A separately declared screen must not force a context-sensitive loader's data
back to the loader-free `undefined` default. Required-loader overloads now use a
permissive default only during inference; the actual return type still wins.
Loader-free overloads retain `undefined`. Source and emitted-consumer fixtures
cover named screens together with guard additions, validated search, asynchronous
loading, unknown data, and rejected invented fields. No application data casts
or explicit loader-data type arguments are needed.

```ts
const withAccount = defineRoute.withContext<{ account: { id: string } }>()
function NamedDetail(_props: { params: { id: string }; data: { title: string } }) {
	return null
}
const detail = withAccount({
	path: '/detail/:id',
	beforeLoad: ({ context }) => ({ owner: context.account.id }),
	loader: ({ params, context }) => ({ title: context.owner + params.id }),
}).screen(NamedDetail)
```

### Native Frame host (internal integration)

The internal native adapter accepts an explicit flow-to-Frame lookup. Each
mounted outlet records its declaring Page and owns its routed roots through
`ContentOwner`. Prepared content renders under that outlet's providers before
native navigation starts. Push, public Frame replacement, clear-history reset,
and Back wait for `Frame.navigatedTo` with the target as `currentPage`; merely
queuing navigation does not count as commitment. Refresh keeps the Page and
component state. Missing callbacks fail within a bounded timeout, without
claiming to undo work already accepted by NativeScript.

```tsx
// Internal native fixture; default client facade migration is still pending.
const platform = createNativeRouterHost({ getFrame: () => frame })
const navigation = createRouter({ catalog, host: platform.host })
platform.attach(navigation)
<ClientRouteOutlet host={platform}><BaseScreen /></ClientRouteOutlet>
```

Owner removal releases routed content and returns the Frame to the declaring
Page, including after reset removed that Page from history. NativeScript Core
9.1.3 on iOS clears a discarded Page's controller in `disposeNativeView`, but
Frame requires the controller before attachment. The iOS-only
`prepare-navigation-page.ios.ts` calls the Page's public `createNativeView` if
its controller is absent before restoration. Android's helper does nothing:
its native view needs the Frame's Android context before creation. Revisit this
local workaround when upgrading Core. Exact upstream source:
[Frame controller requirement](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/ui/frame/index.ios.ts),
[Page controller disposal and recreation](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/ui/page/index.ios.ts).

```ts
// Called only by the iOS host before restoring a discarded declaring Page.
if (!page.ios) page.createNativeView()
```

On 2026-10-19 the maintained isolated navigation harness passed 42 assertions
on an iPhone Air simulator running iOS 27, including cold/warm URL delivery,
typed loader/guard data, rendered-before-result behavior, retained local state,
provider inheritance and provider changes in both hidden and visible Pages,
refresh, Back, replace, reset, and restoration of the declaring source content.
The release consumer build enables `noEmitOnError` and passed without TypeScript
errors. Twelve universal/object-driver tests cover native Frame protocol,
entry receipts, scopes, timeouts, late accepted work, rendering failure, and
readiness-listener disposal. All 50 affected package typecheck tasks passed.
These checks do not establish Android, macOS, or Windows runtime behavior for
this adapter. It currently supports explicit Frames; native modal and rendered
pane integration, public facade migration, and custom transitions remain work
in progress.

### Retained rendered panes (internal integration)

`render-router-host.ts` and `RenderRouteOutlet.tsrx` provide independent,
render-backed histories for tabs and desktop panes that do not use native
Frames. Each flow starts with its declaring content; push retains previous
entries, replace removes only the current entry, reset establishes a new base,
and Back renews the retained entry's visibility receipt. Refresh preserves its
component identity. Accepted commits serialize within a flow while other flows
remain independent. Removing an outlet settles its outstanding receipts and
releases its entries.

```tsx
// Internal fixture composition; public RouteOutlet migration is still pending.
const platform = createRenderRouterHost()
const navigation = createRouter({ catalog, host: platform.host })
platform.attach(navigation)
<RenderRouteOutlet host={platform}><BaseScreen /></RenderRouteOutlet>
```

On 2026-10-19 the maintained iOS release fixture passed 57 assertions, extending
the Frame checks above with actual rendered-pane push, Back, refresh, replace,
reset, independent histories, retained state, live provider updates, and owner
cleanup. Sixteen universal/object-driver tests and all 50 affected typecheck
tasks passed. This is explicit internal adapter qualification, rather than
public Tabs integration or AppKit runtime evidence. The pane host currently
returns an explicit unsupported result for modal presentation and custom
animation; those are separate host integrations still in progress.

### Android launch Intents and native qualification

NativeScript Core 9.1.3 can deliver Android `activityNewIntent` before the
legacy `launch` event. The native deep-link service buffers Intents received
before launch, identifies the cold Intent by native identity when launch
arrives, and keeps that URL for one consumption. Distinct early Intents still
dispatch; resume and new-Intent callbacks for one native Intent do not duplicate
it. Registering after application launch keeps normal warm delivery. Repeated
URLs in distinct Intents remain separate user actions.

```ts
import { onDeepLink, consumeInitialUrl } from '@octane-xplat/platform'
const pendingUrls: string[] = []
const stop = onDeepLink((url) => pendingUrls.push(url))
const initialUrl = consumeInitialUrl() // the cold URL once, then null
```

On 2026-10-19 the signed Android release harness collected a complete passing
61-assertion report, including one cold and two identical warm OS URLs, legacy
named-stack/Back behavior, the new explicit Frame adapter, and retained-pane
histories. This complements the 57-assertion iOS run above. Seven focused native
deep-link tests and all 55 affected package typecheck tasks passed. These are
simulator/emulator runtime checks with no screenshots. Legacy hardware-Back
assertions dispatch the Android event synthetically; they do not establish
physical OS Back or hit-testing. The modern default facade, shared Tabs wiring,
modal flows, custom transitions, and AppKit/Windows runtime qualification are
still incomplete.

The Android harness emits its final report in bounded Unicode-safe chunks;
Android truncates a single long log message. It removes only its own installed
fixture after the run, because a new temporary signing key cannot update the
previous fixture installation. Generated reports and private test data are the
only data owned by that package. Failed cold-delivery and truncated-report
observations remain in Silo; they are not retroactively marked as successful
runs.

### AppKit retained-pane visibility

Mason's `display: none` controls layout geometry but does not set an NSView's
native hidden flag. `RoutePane.macos.tsrx` now sets `NSView.hidden` alongside
Mason display, keeping both retained component state and live providers. The
shared pane composition uses this platform leaf; native Mason and browser CSS
retain their existing visibility behavior.

```tsx
// Inside the internal AppKit pane leaf:
<View
	ref={(view) => {
		if (view) view.hidden = !active
	}}
	style={{ display: active ? 'flex' : 'none', flexGrow: 1 }}
/>
```

The internal AppKit fixture initially passed 20 assertions for native view
identity and visibility, state/provider retention, independent histories,
refresh, replace, reset, Back and cleanup. It builds production JavaScript and
loads the actual JavaScriptCore/AppKit host without screenshots or shared
input. Its strict consumer checks use the same catalog Octane 0.11.0 as the
app: the renderer workspace now declares that development dependency rather
than auto-installing its broad peer minimum 0.6.3, which produced incompatible
universal type identities. Published peer bounds are unchanged; this evidence
qualifies the installed 0.11.0 setup.

```sh
XPLAT_MASON_LIB=/path/to/libxplatmason.dylib pnpm --filter @xplat/macos test:routing
```

Qualification used the repository's ObjC Mason facade, linked locally against
`mason-c` from the installed plugin's source revision
`bcb27d01f89231223e2f527533ff5b8981101e0a`. Its upstream workspace has no lockfile;
a generated lockfile and build outputs were kept in owned temporary directories.
The runner requires an explicit library or a previously built local facade and
fails when it is missing. This does not establish production Mason packaging
or ordinary default-client integration.

Octane 0.11.0's `Activity` was also tested as a retained-visibility primitive.
NativeScript 0.2.5's compiler registry does not advertise the required visibility
capability, so it fails compilation there even though the installed local driver
patch implements visibility commands. An Activity integration would additionally
need compiler metadata and lifecycle qualification. The pane leaf uses existing
host visibility APIs and preserves the live-provider behavior checked on the
other targets. Source:
[Octane compiler capability requirement](https://github.com/octanejs/octane/blob/8c2e38a76477a9568cd56ec8377dc47cf042be59/packages/octane/src/compiler/compile-universal.js),
[NativeScript registry](https://github.com/nativescript-community/octane/blob/e8d9fd7b11b6d2cbce6f6621126ccda22541bef6/packages/octane/src/config.ts).

### Stable identity across owned portal removal

Owned portal entries use an explicit keyed TSRX loop on web, native and AppKit.
During modal replacement, removing an earlier root from the previous mapped
children remounted a later root in the universal recording host, losing local
state. Keeping the entry key on the loop preserves that later root and its
live providers. This finding applies to this owned-entry composition on the
installed Octane 0.11.0; it is not a claim about every mapped JSX list.

```tsrx
// Inside the internal owned-content outlet:
@for (const entry of entries; key entry.id) {
	<OwnedEntry entry={entry} />
}
```

Maintained DOM and universal portal regressions cover later-root identity,
state and provider updates after removing an earlier root. The universal test
uses real core portal ownership with a recording driver; it does not emulate
a native window. The iOS release modal replacement check also retained the
new screen exactly once. The AppKit 20-assertion native-view fixture passed
again after this change. Modal host integration is qualified separately below.

### Native modal flows (internal integration)

The internal native modal host decorates the Frame adapter with independent
rendered histories inside source-owned SDK modal surfaces. It waits for the
renderer before starting presentation, then waits for `shownModally` before
reporting commitment. Nested modals present from their parent surface without
creating another Frame. The private release fixture composes it explicitly;
the default public client has not migrated.

```tsx
// Internal fixture composition; catalog and getFrame are fixture dependencies.
const platform = createNativeModalRouterHost({ getFrame })
const navigation = createRouter({ catalog, host: platform.host })
platform.attach(navigation)
<ClientRouteOutlet host={platform}><BaseScreen /></ClientRouteOutlet>
```

Back at a modal's first step returns `at-base`; it does not dismiss the surface.
Dismissal closes descendants before their parent and waits for `closedModally`.
Closed flow IDs are never reused, and captured navigators cancel before
running loaders, including an explicit escape to root. Independent root and
modal histories keep their own state and live providers.

```ts
// `modal` is the owner-bound navigator read inside the modal screen.
const back = await modal.back() // at-base at the first step
const dismissed = await modal.dismiss() // closes the whole modal flow
const ended = await modal.back() // cancelled: disposed
```

Missing native lifecycle events fail with bounded errors. Owner removal during
accepted presentation settles navigation promptly, while native teardown waits
for confirmation. A late shown event still closes its surface. This does not
claim SDK transaction rollback. Modal transition `none` returns skipped/disabled;
SDK default animation completes at the shown receipt; other transition names
currently return skipped/unsupported rather than claiming a custom animation.

```ts
const result = await navigation.push({
	to: '/refined/:id',
	params: { id: 'coat' },
	presentation: 'modal',
	transition: 'none',
})
if (result.status === 'committed') await result.finished
```

On 2026-10-19 the maintained release suites passed 83 assertions on iPhone Air
(iOS 27) and 87 on the Android emulator. They include real native shown/closed
receipts, nested presentation, retained count/provider updates, refresh/reset,
root replacement mounting the staged screen once, presenter retention and
closed-flow rejection. Thirty-one universal tests passed across modal, Frame,
pane, entry, hook and owned-content integration; 33 DOM/core tests passed.
Strict native consumer checking and all 53 affected dependent typecheck
tasks passed. The AppKit pane fixture again passed
20 checks; this does not establish an AppKit modal implementation. Modern
OS Back, gesture/blocker policy, named-pane modal composition, custom
transitions, default facade and shared Tabs wiring still require integration.
Windows runtime remains unverified because no VM is available.

The modal adapter relies on Core 9.1.3's native lifecycle events rather than
its earlier close callback. Pinned upstream source distinguishes the callback
from native teardown and closed notification:
[shared modal lifecycle](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/ui/core/view/view-common.ts),
[iOS modal lifecycle](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/ui/core/view/index.ios.ts),
[Android modal lifecycle](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/ui/core/view/index.android.ts).

### Android Back ownership and compatibility

Native routing now shares one Android Back dispatcher with the compatibility
facade. Application interceptors run first, followed by modal and explicit
Frame hosts, then the legacy default. Each modern host checks the Activity;
modal handlers also distinguish their surface from an unrelated SDK dialog.
The dispatcher cancels the SDK default synchronously while routed work awaits
its normal commit receipt. Stable compatibility keys replace HMR callbacks
without installing another listener.

```ts
// Existing application interceptors retain their synchronous consume contract.
import { addBackInterceptor } from '@octane-xplat/ui/routing'
const stop = addBackInterceptor(() => false)
stop()
```

A shell must identify selected named Frames before OS Back can target them.
An explicit instance cannot infer which independent pane its application has
selected. Programmatic Back still targets its bound owner and stops at the
declaring Page even when the native Frame has older unowned entries.

```ts
// Internal host composition; the application's shell owns these dependencies.
const platform = createNativeModalRouterHost({
	getFrame,
	isFlowActive: (flow) => flow === 'root' || flow === selectedPane,
})
```

Android OS Back pops internal modal steps and dismisses the modal at its first
step. Programmatic Back remains `at-base` there; application code explicitly
requests dismissal. During accepted native presentation or teardown, OS Back
is consumed without starting another native transaction. This integration is
not a general navigation blocker or a promise to intercept iOS gestures.

```ts
// Inside an owner-bound modal screen:
await navigation.back() // at-base at its first step
await navigation.dismiss() // close the surface and descendants
```

The maintained Android release fixture passes 94 assertions, including three
real `adb shell input keyevent KEYCODE_BACK` commands after confirmed native
presentation: modal step Back, modal base dismissal, and retained root-Page
Back. No screenshots or physical hardware/predictive gesture claims are made.
The iOS release fixture passed all 83 assertions again with the non-Android
dispatcher leaf. All 50 affected dependent typecheck tasks and the strict
native consumer check passed. Thirty-five universal integration tests and
35 core/dispatcher/compatibility tests passed. Focused regressions cover event priority, HMR, handler replacement/removal, unrelated
Activity/dialog fall-through, missing events, and the declaring-Page boundary.

### Composing Frame and rendered-pane histories

The internal pane host selects native Frame flows explicitly; remaining flows
render inside their declaring outlets. Selection stays fixed while a Frame
becomes ready, so an unavailable Frame cannot silently change the history
mechanism. A pane-only instance uses the same owner-preserving client outlet
on AppKit.

```ts
// Internal native composition; getFrame belongs to the owning app/window.
const platform = createNativeModalRouterHost({
	getFrame,
	frameFlows: ['root'], // named flows use retained rendered panes
})
```

Modal presentation is serialized across the owning window, including requests
from different panes. Nested modals retain their ancestors; a new base-flow
modal replaces the previous modal family. Root navigation closes a pane-owned
modal before taking over the window. Ordinary independent pane commits can
still complete while another flow awaits native presentation.

```tsx
// The same explicit instance owns both outlets and their modal descendants.
<ClientRouteOutlet host={platform}>
	<AppShell />
	<ClientRouteOutlet host={platform} flow="detail-pane">
		<DetailPaneBase />
	</ClientRouteOutlet>
</ClientRouteOutlet>
```

Refreshing a presenter keeps its modal descendants open. A universal-renderer
regression refreshes both a root Page and its modal parent behind a nested
modal without closing either surface. This extends the existing device checks
for ordinary root and modal refresh; it is not another OS-input qualification.

```ts
// Use the source or parent screen's owner-bound navigator.
await navigation.refresh()
```

### Candidate staging before presentation cleanup

Frame and rendered-pane hosts stage a new screen before claiming the commit.
Only a successfully rendered candidate reaches the composition barrier that
closes presenter-owned modals. Failed pane push, replace and reset operations
restore the previous history without unmounting its screen or providers.
One keyed loop preserves the staged component when it becomes visible.

```ts
import type { RouterHostCommand } from '@octane-xplat/ui/routing'

// Internal adapter composition; the base host controls candidate staging.
function withSurfaceCleanup(
	command: RouterHostCommand,
	closeSurfaces: () => Promise<void>,
): RouterHostCommand {
	return {
		...command,
		async beforeMutation() {
			await command.beforeMutation?.()
			await closeSurfaces()
		},
	}
}
```

After an asynchronous barrier, hosts recheck the current attempt and the
exact outlet lifetime before changing history or visibility. An old accepted
request cannot revive inside a newly mounted outlet. Browser commits serialize
across that document's one history, including asynchronous barriers. Browser
push, replace and modal navigation render a hidden candidate before writing
history. A render failure retains the previous DOM, local state, URL and
history entry. Failed browser history writes also leave internal depth
unchanged. Renderer commitment, visibility and animation completion remain
distinct milestones. Refresh and history traversal are separate paths; these
candidate checks do not establish rollback for those operations.

```ts
// Example helper inside an adapter, after host-specific candidate staging.
async function mutateIfCurrent(
	command: RouterHostCommand,
	isOwnerMounted: () => boolean,
	mutate: () => void,
): Promise<boolean> {
	if (!command.beginCommit()) return false
	await command.beforeMutation?.()
	if (!command.isCurrent() || !isOwnerMounted()) return false
	mutate()
	return true
}
```

The 2026-10-19 maintained release fixtures passed 97 assertions on iOS and
108 on Android for this composition. The AppKit native-view fixture passed
20 assertions through the composed client outlet with its explicit local
Mason library. Added checks cover loaded declaring-Page
content, independent root/pane histories, retained local state and live
providers, pane-owned native modals, return to the pane match, and root
takeover. Android's three real OS Back commands now start from a pane-owned
modal. Forty universal integration tests, 46 DOM/core/compatibility
tests, all 50 affected dependent typecheck tasks, and strict native/AppKit
fixture consumers passed. No images were captured. The default public facade,
ordinary Tabs, custom transitions, and desktop modal surfaces remain work in
progress; Windows runtime remains unverified without a VM.

The root-takeover failure case passed in maintained release runs: 101 iOS
assertions and 112 Android assertions, including retention of the presented
modal and current Frame after an intentionally bad candidate screen, then
successful dismissal. AppKit passed 25 native-view assertions, including
failed push/replace/reset, retained NSView identity/visibility, unchanged
current match and candidate removal. The production Chromium CSR fixture
passed its existing 11 assertions. Forty-seven universal and 50 DOM/core tests,
all 50 affected dependent typecheck tasks and strict web/native/AppKit
consumers passed. Native modal timeout tests also verify theme subscription
release before a late shown callback, without double cleanup. These results
do not establish desktop modal presentation, Windows runtime or completion of
the remaining routing plan. Browser push/replace/modal candidate failures are
qualified by the additional checks below.

The browser candidate-staging extension passed 14 production Chromium checks,
including failed push, replace and modal rendering with the current DOM and
history intact. Seventeen focused DOM tests additionally cover rejected
history writes, failed navigation inside a modal, exact outlet lifetime
replacement, state-preserving candidate reveal, and retirement of abandoned
modal navigators before explicit root navigation. These tests exercise CSR
without an SSR host or screenshots. They do not qualify View Transitions,
refresh/traversal render-failure recovery, or the default client migration.

### Explicit-instance stack inference

An explicit router now infers named stacks from its own `stacks` list and always
includes root. Its bound navigators, fallback destinations, href builder,
instance-aware hooks and provider selection retain that union. Generated
application stack names remain available to the default facade and do not leak
into an isolated instance. Provider selection cannot widen the router's names.
The host must still mount the declared flows.

```ts
import { createRouter, defineRoute, defineRoutes } from '@octane-xplat/ui/routing/core'
import type { RouterHost } from '@octane-xplat/ui/routing/core'

export function createPaneNavigation(host: RouterHost) {
	const catalog = defineRoutes([defineRoute({ path: '/help' }).screen(() => null)])
	const navigation = createRouter({ catalog, host, stacks: ['library', 'settings'] })
	return { navigation, library: navigation.forStack('library') }
}
```

The emitted-package consumer fixture checks positive inferred names and negative
unrelated/unknown names through each surface. It also compiles the factory above.
Forty-three browser/core/package tests and strict web, native and AppKit source
consumers and all 50 affected dependent typecheck tasks passed. This is
type-contract qualification; no new native runtime behavior or Windows runtime
verification is claimed.

### Named file preparation matches generated contracts

File-derived metadata now carries the same structured preparation behavior as
programmatic definitions. Search validation runs first, guards accumulate
context, loaders receive that context with params/search/signal, and refined
screens receive separate fields. Function and Standard Schema validators share
one normalizer. Baked files keep using generated data. Legacy metadata remains
available for the default client's unfinished migration; this does not make
legacy params-only callbacks structured automatically.

The following excerpt uses `fileModule` from the maintained
[browser fixture](../../../apps/web/tests/fixtures/routing-contract/fixture.web.tsrx).

```ts
// These named functions are the actual module exports from the route-file glob.
const catalog = deriveRouteManifest({ './app/items/[id].web.tsrx': fileModule }, ['web'])
const preparation = createRoutePreparation({ catalog, context: { account: 'account-a' } })
const result = await preparation.prepare('/items/coat')
preparation.dispose()
```

The maintained browser, mobile and AppKit fixtures now load their primary
route from a module map with named validators, guards and loaders, mirroring
the generated catalog's assembly. Programmatic routes remain exercised by
other flows and runtime replacement. Node checks select each of the six
platform suffixes; that verifies shared preparation, not Linux or Windows host
execution. The generated-file TypeScript fixture independently checks inferred
callback and screen contracts without executing application code during
generation.

The named-file extension passed 101 iOS release assertions, 112 Android release
assertions (including three real OS Back events), 25 AppKit native-view
assertions using the explicit local Mason library, and 15 production Chromium
CSR checks. Strict web/native/AppKit source consumers, 164 DOM/core/legacy
regressions, 44 universal driver tests, six code-generation tests and all 50
affected dependent typecheck tasks passed. The documented loader example was
also compiled against freshly generated contracts. No images were captured.
Linux and Windows host execution remain unverified; selecting their suffixes
in shared preparation tests is not native runtime qualification.

### Lazy default client and owned outlet

The public `router` facade and `configureRouter` now select a client-local
platform host. Configuration snapshots definitions but creates no host until
first use. A configured `RouteOutlet` binds that host beneath the source
providers; nested outlets for the same flow reuse its owner. Native root
navigation uses the registered/root Frame, with named rendered panes and
owner-presented modal flows. AppKit uses retained panes and still returns
`unsupported` for routed modals. The unconfigured outlet preserves the legacy
client while generated registration and compatibility helpers are migrated.

```tsx
// Client.web.tsx; select the target's catalog on native/AppKit.
import { RouteOutlet } from '@octane-xplat/ui'
import { configureRouter } from '@octane-xplat/ui/routing'
import { routes } from './routes.gen.catalog.web'

configureRouter({ catalog: routes })
export function Client() {
	return (
		<RouteOutlet>
			<p>Home</p>
		</RouteOutlet>
	)
}
```

The host attaches the stable facade so `useRouter(router)` and automatically
provided scopes refer to the same instance identity. Private flow binding
forwards through the owned instance; it preserves modal ownership rather than
falling back to root. Reconfiguration replaces only the base registration,
retains plugins and reads current context at each new attempt. Base, stack
names and host callbacks cannot change after first use without a reload.
Server requests continue using explicit instances and host-free preparation.

Published facades need an explicit `RouterInstance` annotation. Inferring the
export from the private runtime materialized the currently empty ambient
registry as `{}` in generated declarations, discarding consumer augmentation.
The emitted-package fixture caught that loss and now checks required params,
generated stack names, unrelated explicit routes, provider/hook identity and
required setup context. The private source web check complements publication
checks; type generation alone does not check private `.ts` function bodies.

```ts
// Keep the generic's application registry deferred in published declarations.
export const router: RouterInstance = defaultRouterRuntime.router
```

The opt-in default fixture passed 16 production Chromium checks, including cold
URL preparation with exactly one load and no added history entry; 111 iOS
release assertions; 122 Android release assertions including three real OS Back
events; and 35 actual AppKit view assertions with an explicit task-owned Mason
library.
No images were captured. The ordinary generated client still registers the
legacy runtime, and legacy helpers/Tabs do not forward to the new instance yet.
View Transitions, desktop modals, Linux host runtime and Windows runtime remain
separate unqualified work.

The 173 DOM/core/package regressions, 46 universal-driver checks and all 50
affected dependent type/type-generation tasks passed. Source consumers passed
for web, NativeScript and AppKit. The affected recipe is `programmatic-routes`
AC7; its documentation covers opt-in default ownership while ordinary generated
registration and remaining plan features are still marked incomplete. Recipe
structure and links pass independently of runtime coverage.

### Generated contributions have module identity

Generated type registration uses a private `unique symbol` key per module for
both legacy params and complete contracts. Two catalogs in one TypeScript
program previously redeclared `fileRoutes`, `programmatic0` and
`generatedRoutes` with different types, producing TS2717 and dropping the
second catalog's destinations. A module-local key eliminates that collision
without deriving identity from absolute paths, package names or runtime state.
The combined value retains each configured manifest's inferred legacy params.

```ts
// Generated-only glue; RouteParams/RouteContracts are inferred above it.
declare const registration: unique symbol
declare module '@octane-xplat/ui' {
	interface AppRoutes {
		[registration]: RouteParams
	}
	interface AppRouteContracts {
		[registration]: RouteContracts
	}
}
```

The maintained CLI fixture generates two catalogs, each with a file route and
a configured programmatic export, then compiles one strict consumer of both.
It checks positive destinations and negative missing/wrong params on canonical
`router.push` and legacy `pushRoute`. Discovery executes neither screen nor
manifest modules. All seven generation tests pass. This is compiler/module
graph evidence; no new native runtime behavior is claimed. Importing a generated
`.types` file still augments the ambient registry; separating pure contract
exports from registration remains part of the plan.
All 53 affected dependent type/type-generation tasks and recipe structure/link
checks passed. The tracked app registration was regenerated with the new keys.

### Local contracts are separate from application registration

Generation now emits `.contracts.ts` for local inferred definitions and
`.types.ts` for application registration. The latter re-exports the former, so
existing annotation imports remain compatible. Reusable target catalogs use
only `.contracts`; ordinary generated client entries explicitly import the
registration. This fixes the compiler-only side effect where importing a
catalog for an isolated instance made its routes available on the unrelated
default `Destination` type.

```ts
// Isolated integration: retains local inference without adding ambient routes.
import { routes } from './routes.gen.catalog.web'
import type { RouteLoaderArgs } from './routes.gen.contracts'
```

An application client deliberately imports the generated registration instead.

```ts
import type {} from './routes.gen.types'
```

Screens use `.contracts` for their own loader/guard/props annotations. A
deliberate `.types` import anywhere in their dependency graph still opts that
graph into application registration; generation does not rewrite application
imports. The opt-in default setup therefore imports `.types` explicitly next
to its reusable catalog, while custom hosts keep local contracts.

The new CLI regression first failed because a catalog-only consumer accepted
an ambient destination. It now compiles local-only and registered consumers in
separate TypeScript programs. Its named file loader and screen infer arguments
and data through `.contracts`; required params and nonexistent loader fields
remain errors. All eight generation tests pass, including the existing
`.types` annotation compatibility fixture and target module-selection builds.
No route, context or configured manifest executes during type discovery.
The regenerated app and all 46 affected type/type-generation tasks passed,
including web, NativeScript, AppKit, Linux and Windows consumers. The production
Chromium CSR fixture retained all 16 passing checks with freshly generated
registration and separate public/private source checking. Recipe structure and
links passed. No new native runtime run is claimed for this type-module change;
the prior default-client native results remain the latest runtime evidence.

### Guard and loader redirects share one preparation path

Guards and loaders now use the same control-outcome handling. A destination
redirect is structurally validated before either being followed or returned to
a host. Following keeps the attempt's original root-context snapshot and
redirect budget, runs the target's validation/guard/loader, and commits only
the final screen. Source guard additions do not leak into the target context.
Ordinary errors keep their guard/loader phase, and cancellation still wins over
late control outcomes. Legacy redirect carriers retain their existing mapping.

```ts
// Host-free preparation outcome; a future HTTP adapter can return its Location.
const result = await preparation.prepare('/old-item', { redirects: 'return' })
if (result.status === 'redirect') {
	const location = preparation.href(result.destination)
}
```

The new regressions first reproduced loader redirects reported as loader
failures, alternating guard/loader loops stopping at a loader error, and
return-mode guards yielding malformed targets without validation. They now
check both phases in return/follow modes, shared context and loop limits, one
committed history entry, and older loader redirects targeting a flow with newer
pending or already committed navigation. The canonical public redirect helper
remains part of the client API migration; the low-level destination carrier is
not a substitute for its eventual generated destination checking.

All 192 DOM/core/package regressions, 46 universal-driver checks and 50 affected
dependent type tasks passed. The production Chromium fixture passed 17 checks,
including cold CSR loader redirection to validated search/data without rendering
the source screen or growing history. Its private source and public generated
consumers also passed. Recipe structure/links passed. This shared-pipeline
change did not add a new native runtime run or Windows runtime qualification.

### Configured shared Tabs owns retained named outlets

Configured `Tabs` now uses the default client's owned outlets instead of
reading and rendering the legacy route store. Every pane mounts once under a
stable tab key; selecting a different tab changes visibility without disposing
its base or routed flow. Native/AppKit pane histories remain independent.
The root browser outlet keeps its shell mounted while a root route covers it,
so pane owners, selected-tab state and base component state survive Back.
Browser routed entries themselves still remount during historical traversal.

```tsx
// Client configured with stacks: ['saved', 'search'] before rendering.
function Saved() {
	return <Text>Saved</Text>
}
function Search() {
	return <Text>Search</Text>
}
const panes = [
	{ key: 'saved', title: 'Saved', stack: 'saved', render: Saved },
	{ key: 'search', title: 'Search', stack: 'search', render: Search },
]
function Library() {
	return <Tabs tabs={panes} />
}
```

Tab selection remains controlled UI state and does not itself navigate. A new
browser entry selects its matching pane for uncontrolled Tabs; controlled
selection stays with its caller. Public configured outlets reject undeclared
stack names, and configured Tabs rejects legacy `resolveScreen` callbacks with
a migration diagnostic instead of silently using a second rendering path.
Unconfigured Tabs retains the existing legacy implementation. Platform-native
tab bars and ordinary generated client registration have not migrated yet.

The maintained production Chromium fixture passes 19 checks. It now uses the
public Tabs component with generated stack registration, real browser pointer
activation, named pane commitment, and shell/base DOM identity and local-state
retention across Back. Focused DOM checks additionally cover controlled
selection, stable-key reordering, provider updates, tab/panel ARIA links and
retained shell visibility. The iOS release passed 117 assertions and Android
128, including pane-owned modals, inactive pane identity/state, named Back and
retained bases. Android still qualifies its three real OS Back events. Native
tab selection uses the controlled API; physical tab hit-testing is not claimed.
The AppKit fixture passed 44 actual NSView assertions, including native hidden
state across tab selection, retained view identity/state and Back to its base.

**Installed compiler constraint (build evidence):** patched Octane 0.11.0's
universal compiler rejected JSX arrows nested inside a module-level tab object
with `unsupported module declaration requires universal plan lowering`. Named
component declarations referenced by the array compiled and ran on the native
fixtures above. The maintained mobile and AppKit fixtures use that workaround;
Xplat carries no new compiler patch for this case. Recheck it on Octane upgrades
and remove the authoring restriction if equivalent module-object lowering is
qualified. A module-level tab array can remain identity-stable without nesting
JSX in its object literals.

All 198 DOM/core/package regressions, 46 universal-driver checks, strict web,
NativeScript and AppKit source consumers, and all 50 affected dependent type
tasks passed. The browser fixture checks the new private Tabs implementation
as well as published types. Recipe structure/links passed; affected coverage is
`programmatic-routes` AC7. UI stack props retain their legacy string shape for
now, with runtime declaration checks on configured outlets; stronger component
stack typing remains part of migration. No images were captured, no shared
desktop input was driven, and Linux/Windows host runtime remains unverified.

### Configured legacy compatibility

Legacy helpers now forward to the configured default instance on browser,
NativeScript and AppKit. Registration lookups read its effective catalog,
pushes split flat path/search inputs and validate them before common
preparation, and route/modal/Back hooks subscribe to the same instance.
Prepared context and data come from the guard/loader pipeline, not caller
injection. Legacy calls retain their existing synchronous shapes; canonical
methods return structured asynchronous results.

```ts
// Existing calls after configureRouter; literal names still come from codegen.
pushRoute({ stack: 'root', name: 'items/:id', params: { id: 'coat' } })
// Use the instance for an awaited, inspectable result:
const result = await router.navigateUrl('/items/hat')
```

Queued legacy contributions are snapshotted on registration and installed when
the real client is constructed, before its first navigation. Installing them
from the first legacy hook was too late: a registry update during candidate
rendering cancelled the first native pane navigation. A direct-first-client
regression now enforces adoption without eager platform-host construction.
Base replacement uses a separate internal registry operation, avoiding collision
with a public plugin ID such as `default-catalog`; existing plugin handles
still remove only their own layers.

```ts
const handle = router.addRoutes(pluginRoutes, { id: 'default-catalog' })
registerRoutes(nextBaseCatalog) // configured base only; plugin survives
handle.dispose()
```

Activation invalidates old navigation requests, prevents queued legacy browser
bootstrap loaders from starting, and detaches that store's active popstate
indirection. The real browser client owns the single history path. Configure
before rendering; this does not transfer an already running legacy DOM/Frame
history. Native `useNativeRouteNavigator` with a captured imperative owner still
requires migration to `useRouter()` beneath an owned outlet.

```tsx
function BackButton() {
	const navigation = useRouter()
	return <Pressable onPress={() => navigation.back()}><Text>Back</Text></Pressable>
}
```

Modal-aware legacy Back first returns within the active modal, then dismisses
it at base. Same-stack `navigateUrl` compares the declared stack with the
modal's declared stack, rather than its private flow ID, so it stays inside
that modal. `pushDeepLink` reports URL recognition synchronously on all three
leaves; success does not establish a later guard/loader/commit result.
Composed catalog brands now also contribute legacy name/params types, while
runtime-generated path families remain outside that static union.

```ts
const accepted = pushDeepLink('xplat://items/coat')
// For completion and refusal details:
const completed = await router.navigateUrl('/items/coat')
```

The maintained 2026-10-19 runs passed 23 production Chromium checks, 124 iOS
release assertions, 135 signed Android release assertions and 51 actual AppKit
NSView assertions. The AppKit run supplied the same task-owned Mason dylib
explicitly. The added native checks cover queued legacy plugin execution,
prepared data, route/modal/Back hook updates and modal dismissal without a
second history. Existing Android OS Back checks still pass. DOM/core/package
tests pass 206 assertions and universal driver tests pass 46; all 50 affected
dependent type tasks, strict platform source consumers and recipe structure
and links pass. The no-DOM import test imports before its synchronous assertions
so cold compiler transformation does not consume the test callback's deadline.

Affected recipe coverage is `programmatic-routes` AC5–AC7 and remains partial
for the complete migration. Ordinary generated startup, native platform tab
bars/captured owners, component stack typing, custom transitions and desktop
modals remain in the routing plan. Linux/Windows host runtime remains unverified;
the Windows and Linux consumer typechecks pass. No images or shared desktop
input were used, and the owned simulator/AVD were stopped after verification.
