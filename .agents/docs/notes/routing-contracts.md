# Declared and runtime route contracts

The client has one executable catalog and one preparation pipeline. A declared
contract is a promise about the route's inputs and successful data. A runtime
registration cannot change that promise after an instance is constructed.

```ts
const catalog = mergeRouteManifests(fileCatalog, declaredOverrides)
const navigation = createRouter({ catalog, host, context })
const plugin = navigation.addRoutes(runtimeCatalog, { id: 'content', conflict: 'replace' })
```

## Ownership and composition

`defineRoutes` requires finite patterns. `defineRuntimeRoutes` accepts computed
patterns without adding compile-time names; its context dependencies still
participate in instance construction. Startup composition infers later declared
contracts. A runtime catalog cannot shadow a declared contract. At runtime,
replacement applies to runtime contributions, including stable-ID replacement
and restoration when the replacing contribution is disposed.

```ts
const declared = defineRoutes([defineRoute({ path: '/items/:id' }).screen(screen)])
const runtime = defineRuntimeRoutes(paths.map(path => defineRoute({ path }).screen(screen)))
const catalog = mergeRouteManifests(declared, runtime)
```

The factories freeze executable metadata. Private weak sets identify original
definitions/catalogs; snapshotting preserves that evidence deliberately. A
spread object can retain a TypeScript phantom brand while replacing its loader.
It must not establish contract evidence. Public instance construction,
composition, and registration require original catalogs. Reauthor changed
inferred definitions with the builders. The invariant type brand preserves the full map. Broad catalog views are for
inspection; composition, registration and construction reject an erased map.
`ContractsOf` reads that invariant witness, so a view cannot substitute a weaker
map before composition.

```ts
const changed = defineRoute({ path: '/items/:id', loader: loadItem }).screen(screen)
const catalog = defineRoutes([changed])
```

Generated modules install baked data before sealing their file catalog. The
`sealGeneratedRouteCatalog<FileRouteContracts>` call is an internal assertion
backed by generated local contracts, not an author-facing inference helper.
JSON manifests and decoded server payloads cannot establish executable evidence.
A future hydration host must validate transferred DTOs against its own catalog.

```ts
// Generated only:
const files = deriveRouteManifest(modules, ['web'], './app')
files.baked = bakedRouteData
const catalog = sealGeneratedRouteCatalog<FileRouteContracts>(files)
```

## Platform contracts

Generated contract checks compare every file leaf in both directions for
params, search input/output, context and data. The shared registry retains all
contracts for truthful match reads, but its type-only scope marker limits static
destinations to routes present in every generated target. Filtering happens per
distributed destination; rebuilding the full filtered union for every path hit
TypeScript's recursion limit at 1,024 routes.

```ts
// Shared default client: platform-only routes require an instance-owned proof.
const checked = await router.validateDestination({ to: '/camera' })
if (checked.status === 'valid') await router.push(checked.destination)
```

An explicit target catalog has a filtered, unmarked contract map. Runtime
catalogs retain unavailable patterns with availability metadata but no screen
or executable callbacks. Final catalog composition rebuilds specificity order,
so an unavailable static pattern still wins over a less specific fallback.
Availability describes screen selection, not outlet readiness. Discovery only
advertises TSX/TSRX/Markdown screens, matching generated runtime globs.

```ts
// Generated only: missing patterns cannot import another target's screen.
const fileRoutes = sealGeneratedRouteCatalog<FileRouteContracts>(fileDefinitions, metadata)
const catalog = mergeRouteManifests(fileRoutes, configuredRoutes)
```

## Programmatic authoring

Decision #120 separates preparation inference from screen checking. The first
call captures immutable options and returns a builder without a route path;
`.screen(component)` creates an original, frozen definition. A named screen
cannot force a loader DTO or validator output. Loader-free data is undefined,
and selecting added context requires a guard. Reusing a builder creates fresh
definitions with the same captured preparation; changing the input object later
does not replace its functions. Flat screen options are rejected.

```ts
import { defineRoute, type RouteScreenProps } from '@octane-xplat/ui/routing/core'
const route = defineRoute({ path: '/items/:id', loader: ({ params }) => ({ id: params.id }) })
function Item(props: RouteScreenProps<typeof route>) { return props.data.id }
const item = route.screen(Item)
```

Inline callbacks still follow TypeScript's inference order: validator, guard,
loader. Earlier dependent inputs remain conservative; named parser values are
inferred independently of property order. Screen attachment happens after this
phase, avoiding the old `any`/`never` fallback problem. This boundary follows the
documented [TypeScript inference model](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7#improved-function-inference-in-objects-and-methods);
[TanStack Router's order rule](https://tanstack.com/router/latest/docs/eslint/create-route-property-order)
is a familiar precedent for ordering dependent callbacks, rather than evidence
that its component model supplies Xplat's structured props.

```ts
const parseSearch = (raw: { page?: unknown }) => ({ page: Number(raw.page ?? 1) })
const paged = defineRoute({
	path: '/pages',
	loader: ({ search }) => search.page,
	validateSearch: parseSearch,
}).screen(({ data }) => String(data))
```

Resolved guard output excludes thenables: a Promise must resolve to context,
not satisfy the object branch itself. Ordinary named context interfaces remain
accepted. Runtime preparation also rejects non-plain objects and arrays.
Empty validated search is an empty object, so an invented field cannot acquire
the impossible `never` value type of a dictionary with no allowed values.

```ts
interface Owner { id: string }
const owned = defineRoute({
	path: '/owned',
	beforeLoad: async (): Promise<Owner> => ({ id: 'local' }),
	loader: ({ context }) => context.id,
}).screen(({ data }) => data)
```

## Universal compiler component placement

With installed, locally patched Octane 0.11.0, a JSX callback passed directly to
`.screen` compiles in DOM mode but fails universal compilation. Nested component
declarations inside a factory fail too. Module-level named functions and arrow
bindings compile in both modes. The public pane fixture exposed this during an
actual AppKit production build; a smaller five-case probe reproduced the shape
distinction through Octane's public compile API without involving a router host.
This is compiler/build evidence, separate from native runtime qualification.

```tsx
import { Text } from '@octane-xplat/ui'
import { defineRoute, type RouteScreenProps } from '@octane-xplat/ui/routing/core'
const item = defineRoute({ path: '/items/:id', loader: ({ params }) => params.id })
function Item(props: RouteScreenProps<typeof item>) { return <Text>{props.data}</Text> }
export const route = item.screen(Item)
```

The [pinned source](https://github.com/octanejs/octane/blob/8c2e38a76477a9568cd56ec8377dc47cf042be59/packages/octane/src/compiler/compile-universal.js#L4879)
only discovers component shapes among module statements before rejecting residual
templates. Its authored file is byte-identical to the installed compiler
(SHA-256 `acea9083d6e6bda4614c5aa9ff3d23befe190c9fe2e64ec32b5eede129f4f3fa`).
The opensrc cache returned 0.13.8 despite the pinned key, so it was excluded;
the verified 0.11.0 file was fetched from that exact commit. Keep JSX screens
at module scope and pass owner state through props/context. Routing adds no
compiler patch; extending discovery needs closure and HMR qualification.
Revisit the restriction on an Octane upgrade rather than treating typechecking
an inline callback as proof of universal code generation.

Executed probe artifacts are under `research/routing-cutover/`:
`probe-route-jsx-placement.mjs`, `route-jsx-placement-results.json`, and
`rejected-nested-pane-example.tsrx`. The maintained public pane example uses
module-level components in `packages/ui/tests/pane-router-example.tsrx`.

## Search field objects and named interfaces

Search contracts accept an interface without a string index signature.
`RouteSearchRecord` uses an object constraint excluding collection, primitive
coercion, function and RegExp protocols; it does not erase the parser's concrete
return type. `ParsedSearch`, programmatic builders and generated named-export
checks use the same constraint. Standard Schema output takes precedence over
an ordinary callable signature. Async parsers preserve their awaited interface.

```ts
interface Search { page: number }
function validateSearch(raw: { page?: unknown }): Search {
	return { page: Number(raw.page ?? 1) }
}
```

Typing fields cannot prove an object's runtime prototype. Preparation applies
the existing plain-record check to validated search before guards/loaders,
rejecting Date/Map/Set/RegExp/Error/array/function/scalar roots from untyped
callers. Plain and null-prototype bags work. Structural class types may describe
the same fields, so authors should return plain field values. The kernel erases
the named interface to its inspected record view only at the validator adapter;
ordinary screen/loader contracts retain the original shape.

## Search protocol precedence

Standard Schema v1 takes precedence over an ordinary call signature. A schema
can be callable while its Standard Schema validation returns a different value
or reports issues. Both named-file and programmatic definitions must invoke
the protocol, matching `RouteSearchOutput` and `RouteSearchInputOf`; invoking
the callable directly would break the declared search contract. Sync/async
protocol issues stop preparation before guards and loaders. Plain parsers keep
their ordinary call behavior. Programmatic and generated file checks require
object protocol output. The plain-parser branch excludes `~standard` metadata,
so a callable returning an object cannot hide an invalid scalar schema result.
Generated checks still accept annotated required parser inputs; their return
checks do not substitute a broad raw-input signature. This follows the structural
[Standard Schema interface](https://standardschema.dev/schema), without adding
a validation dependency to UI.

```ts
const protocol = validator['~standard']
// For a Standard Schema, use this result even if typeof validator === 'function'.
const result = await protocol.validate(rawSearch)
```

## Reads and the default facade

Malformed named behavior exports fail catalog construction with structured
`route/invalid-export` diagnostics. They must not become warnings that discard
an invalid guard and then run a loader. Generated local `RouteExportChecks`
also constrain actual exported values, including named re-exports, without
executing application modules; the compiler points at the route/source field.
Checks also constrain callback returns: guards return context objects or void,
and parsers return objects, including their async equivalents. Merely being
callable cannot allow a boolean guard result or a scalar search result that
host-free preparation would reject.

```ts
// Invalid: beforeLoad is not a callback. Both generated typing and runtime
// catalog construction reject it rather than silently admitting the route.
export const beforeLoad = 'deny'
```

An aggregate match has a declared branch and a runtime branch. The declared
branch retains the inferred discriminated union. Runtime data stays unknown.
Named accessors perform owner/path/contract checks for their rendering entry.
Ambient accessors and `useRouter()` without an argument belong to the default
facade; explicit providers require their own instance in typed hooks.

```ts
const match = navigation.getSnapshot().route
if (match?.contract === 'declared' && match.to === '/items/:id') {
	const title: string = match.data.title
}
const item = getRouteApi('/items/:id', navigation)
// Inside that screen: item.useLoaderData() returns the inferred DTO.
```

Default setup checks overlapping registered contracts: navigation inputs must
remain accepted, and prepared output must satisfy the registered promise.
Client behavior overrides are excluded from instance options. The host-free
preparation API retains explicit behavior injection and unknown output for
integration work. Generated baked file contracts infer the named/default sibling loader output
through type-only references; Markdown contracts use MdDoc. Uninferred runtime
baked maps remain unknown rather than loader-free undefined data.

```ts
configureRouter({ catalog, context })
// Define validators, guards and loaders on routes, not a client behaviors map.
```

Hot reload can replace executable modules without changing facade identity.
Changes to a contract's data/search/context shape require a full application
reload; retained entries are prepared values, not automatic schema migrations.
The separate account-refresh policy must also decide when retained values are
revalidated. These constraints must not be hidden by casts in routing hooks.

Regression coverage lives in `routing-package.test.ts`, `router-instance.test.ts`,
`route-registry.test.ts`, `define-route.test.ts`, and the shared renderer scope
cases. Platform fixtures exercise generated registration and named reads; the
verification guide records target runs separately from these core/type checks.


## Runtime validation and opaque values

Platform forwarding leaves must import a shared implementation with a distinct
basename. `router-hooks.web` forwarding to `router-hooks` resolved back to
itself with `moduleSuffixes: ['.web', '']`, erasing exported hooks to `any` when
library checking was skipped. Both leaves now forward to `router-hooks.shared`.
The public consumer suite repeats its negative contracts with web conditions
and suffixes enabled; the production fixture checks both declarations and
authored sources. Feedback `76523e5e-a9ec-463b-8735-4ee898348d37` records the
original mismatch. This is a local module-layout error, not an upstream
renderer limitation.

```ts
// Platform leaf: safe even when the consumer prefers a web suffix.
export { getRouteApi, useRouter } from './router-hooks.shared.tsrx'
```

`RouteApi.useUpdateSearch` binds writes to the exact rendering match, using
idempotent internal match projections. Stale or disposed entries return
`cancelled` before application callbacks run. Callbacks are synchronous and
pure; they receive validated output and produce the entire search input.
Omission removes fields, default replacement does not grow history, and an
explicit push creates a Back destination. Guards/loaders rerun, with no
animation, retained fragment and ordinary host scroll behavior. A search edit
never copies a modal's presentation into a new modal or turns its logical
stack name into an escape from the owning flow.

```tsx
const item = getRouteApi('/items/:id', navigation)
function Filter() {
	const updateSearch = item.useUpdateSearch()
	return <Button label="Activity" clickAction={() => {
		void updateSearch(previous => ({ ...previous, tab: 'activity' }))
	}} />
}
```

## Checked object destinations

Client `validateDestination` awaits search validation without reading context,
loading data or claiming pending navigation. It returns an instance-bound
opaque value. Navigation rechecks current definitions, search and guards;
validation is neither authorization nor a prepared-data cache. Unknown/copy/
foreign values fail before commitment. Relative requests and redirects keep
their consuming logical stack, preserving modal ownership.

```ts
const checked = await navigation.validateDestination(value, { signal })
if (checked.status === 'valid') await navigation.navigate(checked.destination)
```

The host-free pipeline separates synchronous `resolveDestination` from async
validation. Core validation returns raw canonical input for hosts; the client
alone creates an opaque identity proof. Independent validation attempts are
cancelled on disposal or registry replacement, without superseding navigation.
Private weak-map entries contain only a small owner identity and frozen URL
input; they retain no router, services, context or prepared DTO.

```ts
const resolved = preparation.resolveDestination(value)
const checked = await preparation.validateDestination(value)
// A client caller uses its navigator to obtain a navigation-capable opaque value.
```

**Lab evidence, Octane 0.11.0 with the repository patch:** a top-level DOM/jsdom
component received ordinary spread fields and rendered its text, but lost an
enumerable symbol marker. The native object-driver equivalent preserved it.
Temporary probe logs are in `research/routing-cutover/runtime-prop-probe-*.log`;
feedback observation `4c003e97-d7ab-4049-bcfe-39159038db85` preserves the original
expectation. This identifies the DOM component-spread seam, not a proven
compiler-internal cause. No visual capture was used. Links therefore accept an
opaque value intact through `to`; no upstream patch or symbol-spread fallback
is introduced. Real DOM/native link fixtures preserve this supported boundary.

```tsx
checked.status === 'valid'
	? <NavLink router={navigation} to={checked.destination}>Open</NavLink>
	: null
```

## Composed navigation boundaries

Navigation chrome uses the same correlated destination union as `NavLink`.
`NavigationTargetProps` permits a checked route request, an opaque original
value, a raw href, or a fieldless action. `NavigationLinkTargetProps` requires a
route or URL. Public component overloads retain contracts; private renderer
rows erase only inputs and never expose caller-selected loader DTO types.
Both the contract and `keyof Contracts` arguments to `DestinationFor` need
`NoInfer`: otherwise a readonly array can infer a partial catalog from its keys
and turn valid route params into `Record<string, never>`.

```ts
import type { DestinationFor } from '@octane-xplat/ui/routing/core'
// Internal type pattern; C is inferred only from an explicit router instance.
type CheckedInputs<C, S extends string, T extends string> =
	DestinationFor<NoInfer<C>, NoInfer<keyof C & string>, NoInfer<S>, NoInfer<T>>
```

Typed literal destinations under a custom provider require that instance as a
prop. Opaque destinations can inherit it because activation verifies the
original object's issuing instance at runtime and exposes no typed data reads.
The shared hook always subscribes through the owning navigator, including
unchanged-prop native rows. URL/action items need no routing provider.

```tsx
import { SideNavItem } from '@octane-xplat/ui'
import type { ValidatedDestination } from '@octane-xplat/ui/routing'
function Suggested(props: { destination: ValidatedDestination }) {
	return <SideNavItem label="Open" to={props.destination} />
}
```

## Navigation feedback does not expose DTOs

`useNavigation()` reads a stable per-attempt `idle` / `pending` / `failed`
snapshot with readonly URL inputs and structured failure outcomes. It can
inherit a custom provider because it returns no route data or navigator whose
destinations claim ambient contracts. In contrast, zero-argument typed
`useRouterState()` and `useRouteMatch()` must reject custom providers, just like
`useRouter()` and named accessors. Shared status/Back UI uses `useNavigation()`
and `useCanGoBack()`; typed route-data UI passes its instance explicitly.

```tsx
import { Text } from '@octane-xplat/ui'
import { useNavigation } from '@octane-xplat/ui/routing'
function Status() {
	return <Text>{useNavigation().status}</Text>
}
```

Feedback captures input before loading and retains no inferred successful DTO.
A failed attempt retains the committed screen. Retry revalidates its captured
input, and `clearFailure()` forgets that target without cancelling another
attempt. External host traversal and owner disposal clear obsolete feedback.
Pending/failure snapshot identity survives unrelated flow changes so local
presentation effects need not restart for another pane's work.

```ts
const state = navigation.getSnapshot().navigation
if (state.status === 'failed') await navigation.retry()
navigation.clearFailure()
```

## Browser root-owner lifetime

The root outlet owns both current and saved browser prepared entries. Teardown
cancels effects and entries, discards their data/context and scroll snapshots,
restores declaring head metadata and clears owned Back availability. Browser
URLs are not deleted. A fresh default root lifetime prepares its current URL
again exactly once; a cancelled queued bootstrap cannot start after teardown.
Named outlet changes inside a live root do not establish a new account/session
boundary by themselves.

```tsx
import { RouteOutlet, Text } from '@octane-xplat/ui'
function OwnedRoutes(props: { visible: boolean }) {
	return props.visible ? <RouteOutlet /> : <Text>Closed</Text>
}
```

## Native owner replacement

A remounted Frame outlet retains its readiness listener until the previous
owner finishes returning the Frame to its declaring Page. Seeing a current
Page alone is insufficient: it can still belong to the owner being removed.
The modal composition layer reports owner disposal immediately, then treats a
delayed base detach as a state update. That second notification must not cancel
navigation belonging to the new owner. Both waits remain cancellable, and the
existing bounded restoration timeout still applies.

```tsx
// A component key gives the entire owned subtree a new lifetime.
function OwnedRoutes(props: { version: number }) {
	return <RouteOutlet key={props.version} />
}
```

The maintained native-object suite exercises immediate new-owner navigation;
the SDK fixture repeats it with fresh account context and an open routed modal.
The AppKit fixture keys a common component around both root and named outlets,
then checks that all old views disappear and new navigation has fresh local
state and owned history. These are ownership and native-object assertions,
not pixel/privacy guarantees for operating-system animation snapshots.


## Baked file contracts and strict transfer

Generated baked file contracts supply `FileRouteContract` with an independently
inferred sibling `RouteBakedLoaderData` type. It selects a named `loader` before
a default export, matching build execution, and unwraps promises. Markdown uses
`MdDoc` from the canonical Markdown subpath. The generator discovers siblings
before emitting contracts, but type-only generation never imports/executes them.
No build loader becomes an executable catalog import.

```ts
import type { RouteProps } from './routes.gen.contracts'
type BakedScreenData = RouteProps<'/changelog'>['data']
```

Build execution validates plain JSON before replacing the data artifact. It
rejects undefined, non-finite numbers, negative zero, holes, extra array fields,
class instances, symbols, functions, accessors, non-enumerable fields and cycles.
Diagnostics identify route, sibling source and field; getters/toJSON never run
during this validation. The Markdown producer omits an absent code language
rather than putting an undefined field in its internal DTO. A failed bake keeps
the previous valid data file. Typechecking preserves that artifact too: it does
not establish that older baked content matches edited loader code. The normal
routes/dev/build workflow rebakes before shipping.

```ts
// A sibling can explicitly project special values to JSON.
export function loader() { return { publishedAt: new Date().toISOString() } }
```


## Account context snapshots

Synchronous object and factory sources copy their top-level dependency record
before the preparation pipeline yields. Awaiting an ordinary factory result
before copying used to let a later assignment change the account of an already
started attempt. Async sources still resolve before their snapshot is taken.
Copies are shallow: retain service identities and supply fresh/immutable nested
account values. Redirects reuse this root snapshot, while guard additions stay
local to the route being prepared.

```ts
const dependencies = { account: 'a' }
// Construct navigation with context: () => dependencies.
const pending = navigation.navigateUrl('/items/coat')
dependencies.account = 'b' // belongs to a subsequent attempt
```

This snapshot is not an automatic invalidation or authorization subscription.
Account/permission changes must end all affected route owners or deliberately
refresh retained values. The login-return protocol uses `navigateUrl` with
replacement, revalidates guards and reads the new context; a resolver's runtime
shape is not cast into a declared destination. Guarded browser restoration and
bounded correction now have production-browser evidence. The controlled native
authentication example also verifies replacement-owner handoff, pending-work
cancellation and retained private-view release on iOS, Android and AppKit.
These checks do not qualify real identity providers or their OS dialogs; see
[the measured scope](../navigation-checks.md#account-changes-and-sign-in-returns).


## Browser history preparation

The host prepares retained locations through `RouterHostCommand.prepare` before
`beginCommit`. Multiple targets in one restoration share one root-context
snapshot while guard additions stay local to each route. The command remains
bound to its original attempt and claims; it cannot prepare after commitment.
External browser traversal enters that same instance machinery through an
internal host callback, avoiding recursive calls into the serialized commit
queue. These helpers are not public application navigation APIs.

```ts
const prepared = await command.prepare(destination, flow)
if (prepared.status !== 'ready') return prepared
if (!command.beginCommit()) return { status: 'cancelled', reason: 'superseded' }
```

Browser-triggered denial keeps the current view and corrects owned history to
its last admitted position. The acknowledgement bypasses guards so refusal
cannot create a loop; it has a five-second deadline. Foreign entries cannot
supply a reliable relative coordinate, so denial replaces the foreign entry
with the admitted URL and rebases ownership. Superseding navigation first
settles correction when it still owns that physical traversal. Retry retains
its host operation and direction. Owner replacement erases DTOs while retaining
only the coordinates needed to reprepare old URLs and correct denial.

```ts
const result = await navigation.back()
if (result.status === 'forbidden') await navigation.retry()
```

## Rendered pane history

Rendered panes prepare their retained Back target through the same attempt
callback. A denied target is never published. Same-route admission replaces the
entry's prepared data under its retained ID, preserving view identity, providers
and local state. A redirect gets a new ID and is staged before replacing the
retained target. Other panes remain independent; supersession settles a pending
guard without mutating history. A cross-stack redirect hands the prepared result
to the receiving host, replacing that stack's current entry without changing the
source history. A modal redirect opens above the admitted source.

```ts
const result = await pane.back()
if (result.status === 'forbidden') await pane.retry()
```

## NativeScript Back notification limitation

Pinned `@nativescript/core` 9.1.3, commit
`45b3b99afd89f19e799da84203aa19d673f7b20a`, exposes Page/Frame navigation
notifications without a cancellation contract. Adding `cancel: true` to those
objects does not veto engine Back. The maintained release fixture qualifies
that behavior in 196 Android and 184 iOS assertions. The iOS fixture also
checks that Page.enableSwipeBackNavigation = false disables the native edge
recognizer. This does not qualify OS touch/gesture delivery or async blocking. Primary source:
[Page lifecycle](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/ui/page/page-common.ts),
[iOS Frame](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/ui/frame/index.ios.ts).
Do not implement async guards by setting an undocumented notification field.
Programmatic Xplat Frame Back and Android activity Back now prepare the
retained target before an engine pop. iOS interactive Back and external native modal
dismissal still need interception; no upstream patch or complete native blocking
guarantee is supplied by this change.

```ts
// Maintained diagnostic only: this field is ignored by NativeScript Back.
page.on('navigatingFrom', event => { Reflect.set(event, 'cancel', true) })
```


## Frame target preparation and redirect staging

Programmatic Frame Back and the claimed Android activity Back path use the same
per-attempt preparation callback as panes. Guard denial leaves the native Page
and Back stack untouched. Admission updates the retained Page's prepared data
while keeping its screen ID and local state. A redirect gets a new screen ID;
its content renders in an independent owned root before adoption into the
retained Page. Failed redirect rendering therefore preserves the previous
screen's state. The engine still owns Back animation reversal.

```ts
const result = await navigation.back()
if (result.status === 'forbidden') await navigation.retry()
```

Frame redirects can hand their prepared result to another stack or a new modal
before the source Frame mutates. iOS interactive Back still bypasses this command
path; it is unfinished rather than established by lifecycle notification or
property tests. Direct Frame/native operations are outside the canonical client
contract.

The initial redirected-target regression reset a retained counter from one to
zero after render failure. Independent candidate roots corrected that mismatch;
see `history-frame-render-before.log` and the maintained native host regression.
This evidence is from the universal native object driver. Device fixture cases
separately check the same failure, preserved local state, Page identity,
providers and fresh context data.


## Prepared host handoff and modal dismissal

A host may return a `handoff` before `beginCommit` using a ready value produced by
that command's `prepare`. The instance checks ownership, limits chains, claims
the receiving flow and passes the same content/data to its host. Foreign values,
repeated values and handoffs after commitment are refused. Preparation alone
does not cancel work in another flow. An explicit redirect stack is retained as
private metadata so root escapes remain distinguishable from inherited scope.

```ts
const prepared = await command.prepare(destination, targetFlow)
if (prepared.status !== 'ready') return prepared
return { status: 'handoff', prepared, action: 'replace' }
```

Canonical native dismissal prepares the presenter in the original attempt. A
refusal leaves the surface open. Admission refreshes its retained screen before
closing the child; a redirect stages a replacement. The receiving host waits for
its render receipt before running the dismissal barrier. `restore` preserves an
existing modal's surface even when its prepared route's presentation is modal.
External engine dismissal is still only reconciled after the fact and has no
async guard interception contract.

```ts
const result = await modal.dismiss()
if (result.status === 'forbidden') await modal.retry()
```


## Programmatic baked map inference

`defineRoutes` carries the supplied baked-map type into each spec contract.
Normalized route names select values, including `index` for root. Missing maps
and erased values remain unknown. Non-baked routes retain loader inference,
extra data keys do not declare destinations, and composition preserves the
selected DTO types. This changes type metadata only; executable baked lookup
and missing-data diagnostics retain their existing behavior.

```ts
const catalog = defineRoutes({
	routes: [{ path: '/help', dataMode: 'baked', screen: Help }],
	baked: { help: { title: 'Help' } },
})
// ContractsOf<typeof catalog>['/help']['data'] is inferred from baked.help.
```


## iOS Frame edge Back

The canonical native host installs a NativeScript pan subscription on each owned
iOS Frame. A completed leading-edge drag requests that Frame flow's ordinary
Back after release. Guard/loader preparation therefore precedes the native pop;
denial keeps the current Page and an admitted retry refreshes retained data.
Short, cancelled, reversed, stale and duplicate drags do not issue another Back.
Eligibility is rechecked after release, and the active descendant Frame with
history takes priority over its ancestor. Ownership teardown removes only this
subscription. Built-in UIKit edge and full-content pops are disabled on owned
Pages. This is release-triggered Back, without an interactive preview; rendered
panes and modal-dismissal gestures are outside this adapter.

```sh
python3 apps/mobile/scripts/check-navigation.py ios DEVICE_ID
# Owned iOS 26+ simulator and idb; the fixture captures no images.
```

The iOS 27 release fixture passed 225 assertions, including real OS swipes on
root and selected-tab Frames, guarded refusal, fresh account data, short-drag
refusal and disabled full-content pop. Ten focused object tests cover reversed,
cancelled and stale gestures, duplicate work, owner isolation and RTL direction.
OS RTL, assistive input and scrolling-control arbitration are not established
by those object tests. The six existing raw SDK delegate checks run after
canonical disposal and remain separate feasibility evidence. The discarded
custom UIKit recognizer passed object tests but received no OS callbacks in the
fixture; the NativeScript observer receives the actual OS gesture. No root cause
for the discarded recognizer was established.

[NativeScript's pinned View event implementation](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/ui/core/view/view-common.ts)
creates gesture observers for `on('pan', callback)` and disconnects matching
subscriptions through `off`. Its pan observer supplies original touch start
coordinates and manages native recognizer lifecycle. Frame's declaration omits
the gesture event overload, so the private adapter narrows that event at this
SDK boundary. Public application navigation types remain inferred.

## UIKit SDK enum aliases and verbatim TypeScript

The generated platform iOS entry aliases NativeScript's ambient const enums as
value exports. Accessing UIKit state/edge/layout-direction enum members with
verbatimModuleSyntax fails with TS2748. This is a local SDK alias/type boundary,
not an upstream UIKit runtime limitation. The adapter uses the public
NativeScript GestureStateTypes runtime values. Its sole UIKit ABI constant is
right-to-left=1, verified against the installed iOS 27 UIInterface header. It
imports native view/recognizer types only and needs no UIKit enum object at
runtime. Revisit this constant when the SDK generator exposes ordinary runtime
constants.

```ts
// Private adapter constant; applications use the canonical router.
const rightToLeft = 1
```

## Native routed modal cancellation policy

Routed native modals remain fullscreen and pass `cancelable: false` to NativeScript.
Canonical dismiss and the claimed Android Back event prepare the presenter before
close. Direct SDK cancellation cannot await that work, so it is disabled rather
than treated as guarded navigation. A forced native close or owner teardown still
reconciles the surface after closing; cleanup cannot be refused by a route guard.
Interactive sheets remain in the separate overlay API.

```ts
import { router } from '@octane-xplat/ui/routing'
const result = await router.dismiss()
if (result.status === 'forbidden') {
	// Keep the modal while the application restores access, then retry.
}
```

Pinned NativeScript 9.1.3 maps this option to `modalInPresentation = true` on iOS.
Its Android implementation uses `Dialog.setCanceledOnTouchOutside(false)`; it does
not make `DialogFragment.isCancelable()` false. Android Back still emits the
activity event, which the canonical owner-scoped dispatcher must claim before
its asynchronous work. This is why passing the option does not replace that
dispatcher or qualify predictive gestures. Source evidence:
[iOS View](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/ui/core/view/index.ios.ts),
[Android View](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/ui/core/view/index.android.ts).

```sh
python3 apps/mobile/scripts/check-navigation.py ios DEVICE_ID
python3 apps/mobile/scripts/check-navigation.py android DEVICE_ID
```

One initial qualification run missed its first edge swipe after earlier fullscreen
modal closure; the cause was not established. A diagnostic run passed. The final
fixture publishes OS-input readiness after two render frames, an attached visible
interactive native target and no current UIKit transition, then acknowledges each
OS action separately. Two runs without callback diagnostics passed 227 assertions
each. This distinguishes input readiness from route commitment; it is not proof
that the cancellation option caused or fixed that earlier missed input.

The Android release fixture passed 224 assertions, including a fifth actual OS
Back press that refuses modal dismissal before loading a denied presenter, then
refreshes it once on admitted retry. The 28 native modal tests, 10 gesture tests,
50-task dependent type gate and UI pack check passed. AppKit and browser routing
implementations are unchanged by this NativeScript-only policy; their current
refinement evidence is source/types, not a fresh runtime run. Windows has no VM.

## Entry-owned navigation confirmation

The canonical client exposes `useNavigationBlocker({ when })` with idle, blocked
and proceeding states. Only a blocked snapshot contains its token-bound proceed
and reset controls. Several active declarations approve in reverse registration
order; retained entries compare the cached public match identity, including
identical hrefs, before participating. The hook can inherit custom providers
because it exposes no inferred DTOs. Input search remains unknown; Back/dismiss
may have no known destination before the host selects it.

```tsx
import { Button } from '@octane-xplat/ui'
import { useNavigationBlocker } from '@octane-xplat/ui/routing'
function Confirmation(props: { dirty: boolean }) {
	const blocker = useNavigationBlocker({ when: props.dirty })
	return blocker.status === 'blocked'
		? <Button label="Keep editing" clickAction={blocker.reset} />
		: null
}
```

An active source blocker defers the one preparation batch until approval, so
context is current at that boundary. Unblocked calls preserve the existing
synchronous snapshot. Approval is once per initiating flow attempt; redirects
continue it. Refresh does not leave. This hook cannot veto parent-owner teardown
or raw host operations. Clearing a condition/unmounting a blocked declaration
refuses its pending attempt; obsolete controls cannot approve another attempt.
If saving should continue navigation, persist first, proceed, then clear dirty.

```ts
// The blocked branch in the editor, after its persistence succeeds:
blocker.proceed()
setDirty(false)
```

Browser traversal moves the URL before the client attempt. Refusal marks the
command non-current while letting its host callback correct URL position before
normal settlement. Supersession/disposal still use ordinary cancellation. This
also protects Back to a declaring base, where no retained target needs loading.
The scope itself registers/disconnects blockers; instance or owner lifetime
cleanup releases their held work. Document unload and OS exit remain separate.

```sh
node apps/web/scripts/routing-contract.mjs
python3 apps/mobile/scripts/check-navigation.py ios DEVICE_ID
python3 apps/mobile/scripts/check-navigation.py android DEVICE_ID
node apps/macos/test/verify-routing.mjs
```

Executed runtime checks passed 88 production Chromium assertions, 238 iOS and
235 Android release assertions, and 142 AppKit native-view checks. Browser
confirmation buttons used actual pointer input. iOS/Android used actual OS Back
input, then programmatic confirmation controls; those checks do not establish
native confirmation-button hit-testing. The source/type gate passed 50 tasks;
Linux WebKitGTK passed 16 handler-driven production checks, including the shared
[Test → Unsaved edits screen](../../../packages/app/src/app/navigation-blocking.tsrx).
This is actual WebView execution, not OS input or GTK/GJS renderer qualification.
No Windows VM is available. A new
browser test originally assumed native-style target counter retention; browser
route restoration remounts that target, while refusal must retain the source's
local state. The corrected case checks that distinction explicitly.

## AppKit routed modal surfaces

The default AppKit client decorates its pane host with the shared modal host.
A routed modal uses the existing renderer's fullscreen, in-window presentation
surface. It creates a declaring-tree content root before presentation, keeping
providers, data and modal history scoped to the original owner and window.
The renderer stages that surface hidden; showing it preserves the prepared
content and takes focus only at the admitted commit.

```ts
import { router } from '@octane-xplat/ui/routing'
await router.push({ to: '/items/:id', params: { id: 'coat' }, presentation: 'modal', transition: 'none' })
```

Back at the first modal screen returns `at-base`. Dismiss prepares its presenter
and closes the modal family; nested dismissal returns to its parent. Escape and
outside callbacks request canonical dismissal and return a synchronous veto to
the raw surface. Guard denial or entry-owned confirmation therefore holds the
surface open. Raw host closure, window closure and owner removal release the
owned roots and flows after closure; those are cleanup rather than admission.
AppKit modal animations return an explicit skipped result.

```tsx
import { Button } from '@octane-xplat/ui'
import { useRouter } from '@octane-xplat/ui/routing'
function ModalClose() {
	const navigation = useRouter()
	return <Button label="Close" clickAction={() => { void navigation.dismiss() }} />
}
```

The attached-window fixture passed 171 assertions, including deferred hidden
state, preserved focus while staging, inherited context, multi-step retention,
nested modals, denied Escape callback, confirmation refusal, raw closure and
owner-family cleanup. This is real AppKit rendering and native-view metadata;
Escape/outside callbacks and confirmation controls were invoked programmatically.
OS keyboard/pointer input and assistive-technology behavior remain unqualified.
The renderer's 285 tests and the existing 28 native modal protocol cases pass.

```sh
node apps/macos/test/verify-routing.mjs
node --test packages/macos-renderer/test/*.test.ts
pnpm --filter @octane-xplat/ui exec vitest run --config vitest.native.config.mts src/native-modal-router-host.mobile.test.tsrx
```

Attaching the previously unattached routing fixture to an NSWindow exposed
same-view reentry during `MasonLayoutView`'s native base layout call. Without a
guard the host aborted with a maximum call-stack exception. A per-view WeakSet
now keeps the outer layout pass in charge and is released in `finally`, including
on failure. A focused regression verifies bounded reentry, independent views
and later passes after an exception. A diagnostic run observed reentry inside
the base call; a minimal two-level `NativeClass`/NSView probe did not reproduce
it, so this is not established as a general upstream superclass-dispatch bug.
The exact interaction with AppKit auto layout and the bridge remains unresolved.
The workaround is local to Mason native layout callbacks; it does not skip later
layout passes or change the native host binary.

```sh
node --test packages/macos-renderer/test/mason-native-layout.test.ts
```

The runtime examined is the repository's patched JavaScriptCore host, whose
manifest pins NativeScript/runtimes to `5b697b393152f973dd392851fd72dacf03a7a0c9`.
It is distinct from the Node bridge package. Recheck this guard and the attached
fixture when that host changes; source reads or an unattached view fixture do
not establish live-window behavior.

The existing standalone overlay runner stopped before its assertions because
its window did not become key (`key=false`, `main=false`). A temporary run with
automation suppression disabled, under an exclusive desktop reservation, had
the same result. No existing-overlay runtime pass is claimed for this increment;
its unit coverage and the attached routed-modal checks passed independently.
No acceptance criteria were relaxed to bypass that prerequisite.

## Parsed route metadata and stable generation

The CLI uses its existing `@tsrx/core` parser to inspect top-level value exports
without importing screen modules. Direct declarations, grouped declarations,
local aliases and explicit named re-exports advertise callbacks. Comments,
strings and type-only exports do not. Wildcard value exports cannot establish
the file's runtime capabilities and fail with an explicit repair instead of
silently recording incomplete metadata. Build mode resolves only through local
const literals, including TypeScript assertions/satisfies and local aliases.
Imported/computed/mutable modes fail before generated outputs are written.

```ts
export const dataMode = 'baked' as const
export { Changelog as default } from '../screens/changelog'
```

Every emitted contract, registration, data, JSON, catalog and client entry uses
content comparison before writing. An unchanged run preserves timestamps.
A maintained temporary fixture edits the route tree through addition, rename
and removal, checking that the generated union loses obsolete identities.
Typecheck-only generation retains its existing baked-data policy. This does
not itself install an automatic route watcher.

```sh
pnpm --filter @octane-xplat/cli build
node --test packages/cli/test/route-generation.test.mjs packages/cli/test/route-data.test.mjs
```

The focused generation/data suite passed 30 checks, including generated consumer
TypeScript programs, non-executed source discovery, constant-mode diagnostics,
stable timestamps and renamed/removed identities. The CLI/dependent typecheck
gate passed 46 tasks. No platform runtime is claimed for this CLI-only increment;
large-catalog compiler/editor timing and automatic watching remain open.

## Watch ownership and generation publication

`xplat routes --watch` owns one serial generator over its route tree, routing
configuration and configured manifest/context/transition source references.
`xplat dev` starts that watcher before launching targets when the app owns routes.
The shared repository app exposes `routes:watch`; run it once alongside platform
dev shells, whose working directories do not own that route catalog.

```sh
pnpm exec xplat routes --watch
pnpm exec xplat dev web
pnpm --filter @xplat/app routes:watch
```

The watcher uses containing-directory handles to observe atomic saves and
removed/recreated roots. It watches only relevant parents/route trees, not the
whole dependency tree. Missing configured modules remain watched while strict
generation reports their absence; creating the module repairs the attempt.
The watcher's missing-source discovery option never weakens generation's normal
configuration validation. An output-location change refuses with a repair:
stop, regenerate, update imports and remove obsolete generated entries. It does
not leave a silently relocated registration while the app imports old types.

```json
{ "directory": "src/app", "out": "src/routes.gen" }
```

Source edits invalidate the active attempt and queue one next pass. Generation
collects all content before publication; parsing/baking failure or abort does
not publish pending contracts/data. Each changed file is replaced by rename,
preventing a compiler from reading an empty/truncated write. Unchanged files
retain timestamps. Generated paths are excluded from source discovery and watch
callbacks, including a custom output basename inside the route tree.
Closing releases watchers/timers and awaits active work; obsolete work cannot
publish or announce success. Arbitrary loader effects/work ignoring cancellation
are not undone; filesystem data outside watched inputs still needs regeneration.

```sh
node --test packages/cli/test/route-watch*.test.mjs packages/cli/test/route-generation*.test.mjs packages/cli/test/route-data.test.mjs
```

The built CLI fixture starts a real Vite server, observes generated contract
updates, terminates its owned process group and verifies the server has closed.
This establishes HTTP/dev-process and generated-file behavior, not a newly added
screen's rendered HMR state on every target. The standalone route CLI and watch
lifecycle also have maintained process/filesystem tests. A Node 22 Linux container
runs the dependency-free watch lifecycle suite on its own filesystem; full
Linux Vite/native app hot reload and Windows runtime remain unqualified here.
No Windows VM or image-based inspection was used.

The watcher builds on [Node's filesystem watch API](https://nodejs.org/docs/latest-v22.x/api/fs.html#fswatchfilename-options-listener).
Network/virtualized filesystem reliability is not inferred from local-filesystem
runs. Host development changes and device HMR are distinct from code generation.

The final local generation/watch suite passed 43 tests on macOS/Node, including
the built CLI and real Vite server. Four lifecycle cases passed separately in
the Linux Node 22 container. The CLI/app dependent gate passed 46 tasks; these
results do not establish target-renderer HMR or Windows process/filesystem behavior.

## Retained native control geometry

`RoutePane.macos.tsrx` keeps inactive panes hidden and absolutely positioned at
their owner's bounds. `display: none` collapsed the NSScrollView document and
AppKit clamped a retained 120-point offset to zero. Keeping measured geometry
preserves native viewport state without keeping inactive panes in normal flow.
The attached-window routing fixture passes 281 checks, including retained root
pane Back, refresh, modal presentation/dismissal and cancelled preparation.
The mobile fixtures also run this protocol in a named pane.
Control refs are released when their entry leaves history.

```sh
node apps/macos/test/verify-routing.mjs
```

The shared protocol uses public text/scroll primitives and explicit native focus
reads. Mason's Scroll is not NativeScript's ScrollView; portable offset writes
use platform leaves. Exact SDK evidence, the iOS animation limit and other
scrolling helpers still needing a Mason audit are recorded in
[the Mason integration note](masonkit-layout-evaluation.md#scroll-commands-after-the-cutover).
See [native retention qualification](../navigation-checks.md#native-control-and-viewport-retention)
for executed targets and input limits.

## Literal catalog diagnostics and baked evidence

`defineRoutes` checks the ordinary catalog signature first, so an erased path
reports the literal-path repair before TypeScript's unrelated baked overload.
Use `as const satisfies RouteSpec` for reusable specification values; genuinely
computed paths still use `defineRuntimeRoutes`. The host-free core entry exports
`RouteSpec` and `RouteSpecSet` beside the authoring helpers.

Baked contracts require a supplied map before exposing its DTO. Optional or
erased maps remain accepted with unknown data. An optional generic map parameter
was rejected during probing because explicit type arguments could claim an
omitted value. Maintained consumer cases cover that refusal, the optional-map
fallback, excess catalog fields, the literal repair and preserved required params.
Programmatic guide screens derive props from their preparation builders.

```sh
pnpm --filter @octane-xplat/ui exec vitest run src/routing-package.test.ts
pnpm --filter @octane-xplat/ui test:packed
```
