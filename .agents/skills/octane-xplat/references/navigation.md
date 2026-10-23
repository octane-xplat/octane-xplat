# Navigation

Use the canonical routing client on every target. Generated startup configures
its catalog, context source, and declared stacks. Mount the root outlet below
the providers screens should inherit; routed screens then use their own navigator.
Keep that outlet in the long-lived shell: removing it releases owned Pages,
modals, and pending loads.

```tsx
import './routes.gen'
import { NavLink, RouteOutlet } from '@octane-xplat/ui'

export function App() {
	return <RouteOutlet><NavLink to="/items/:id" params={{ id: 'coat' }}>Coat</NavLink></RouteOutlet>
}
```

## Author routes and infer inputs

Generation parses route syntax without evaluating modules. Use explicit named
exports/re-exports for callbacks; `export *` is rejected because it hides runtime
capabilities. Declare `dataMode` as a local const literal (`'baked'` or `'live'`),
optionally through local const aliases, `as const` or `satisfies`. Imported,
mutable and computed modes fail instead of silently selecting another pipeline.
Unchanged generated files retain their timestamps. `xplat dev` watches an app-owned
route directory; `xplat routes --watch` works with a separate dev server. A shared
workspace package owns its watcher independently of the platform shells.
Web CLI and agent discovery recognize `vite.config.{js,mjs,cjs,ts,mts,cts}`;
do not rename a JavaScript config merely to enable `xplat dev web`.
Watch configuration/module/source repairs recover without restart, and deleting
and recreating the conventional route tree clears/restores its contract union.
Keep `out` fixed while watching; moving it requires stopping, regenerating,
updating client/type imports and removing obsolete generated entries. Arbitrary
loader filesystem inputs outside the watched trees still need explicit regeneration.

```ts
export const dataMode = 'baked' as const
export { Changelog as default } from '../screens/changelog'
```

```sh
pnpm exec xplat routes --watch
# Repository harness: one shared watcher alongside platform dev servers.
pnpm --filter @xplat/app routes:watch
```

The repository's live browser watcher check covers route edits/additions/renames/
removals and configured context/manifests without restarting Vite. Document reloads
occur; retained HMR state and native/device HMR remain separate qualifications.
The TSX fixture currently emits the documented nonfatal JSX dependency-scan warning.

```sh
pnpm --filter @xplat/web smoke:routing-watch
```



File routes export a screen plus optional `validateSearch`, `beforeLoad`,
`loader`, `head`, and `ErrorBoundary`. Import generated local `.contracts`
types inside that route. Path, validated search, guard context, and loader data
remain separate; no `_stack`, flattened parameter bag, or injected close callback.
Malformed callback exports are compiler errors in generated `RouteExportChecks`
and fatal `route/invalid-export` errors at catalog construction. Repair the
source export; never cast generated checks away. Invalid guards are not ignored.
Guard callbacks return an added context object or void; parsers return a search
object, with async equivalents. Returning boolean permission flags or scalar
search output is a type error in file routes, as it is in programmatic routes.
Named output interfaces need no index signature, including async parsers and
Standard Schema. Return plain field objects; non-record JavaScript results fail
before guards/loaders. Preserve validator return literals with `as const` or an explicit return type;
a widened `string` output also widens navigation's admitted search values.

```tsx
// src/app/items/[id].tsrx
import { Text } from '@octane-xplat/ui'
import type { RouteLoaderArgs, RouteProps } from '../../routes.gen.contracts'

export function validateSearch(raw: { tab?: unknown }) {
	const tab = raw.tab ?? 'details'
	if (tab !== 'details' && tab !== 'activity') throw new TypeError('Invalid tab')
	return { tab } as const
}
export function loader({ params, search }: RouteLoaderArgs<'/items/:id'>) {
	return { title: params.id, tab: search.tab }
}
export function screen(props: RouteProps<'/items/:id'>) {
	return <Text>{props.data.title}</Text>
}
```

URL validation always starts with strings or repeated-key arrays. A schema
requiring number/boolean input must use `withSearchDecoder`; bare incompatible
schemas and parser parameter types fail programmatic and generated checks.
Keep the decoder pure and let the schema reject invalid values. Navigation
retains the schema's input types; typed objects and direct URLs share decoding.
Only scalar fields and arrays of scalars can be encoded in destinations.

```ts
import { withSearchDecoder } from '@octane-xplat/ui/routing/core'
import { pageSchema } from './schemas'
export const validateSearch = withSearchDecoder(pageSchema, raw => ({
	page: raw.page === undefined ? undefined : Number(raw.page),
}))
```

Programmatic definitions infer preparation with `defineRoute(options)`, then
attach a module-level component with `.screen(component)` before `defineRoutes`.
The flat `screen` option is removed; do not add a compatibility overload or cast
an unfinished builder into a catalog. Keep inline validators, guards and loaders
in dependency order; a named parser value preserves its known type across field
order. Configure manifest
exports for generated registration; application authors never handwrite an
augmentation. Generated `.catalog.<target>` and `.contracts` imports stay local;
`.types` and client imports deliberately contribute application contracts.
Inline JSX screen callbacks are not lowered by the installed universal compiler;
use a module-level named function or arrow binding for shared/native views.
Typechecking such a callback alone does not establish native build support.

```tsx
import { Text } from '@octane-xplat/ui'
import { defineRoute, defineRoutes } from '@octane-xplat/ui/routing/core'
function Guide(props: { data: { title: string; page: number } }) { return <Text>{props.data.title}</Text> }
export const guideRoutes = defineRoutes([
	defineRoute({
		path: '/guides/:slug',
		validateSearch(raw: { page?: unknown }) {
			const page = Number(raw.page ?? 1)
			if (!Number.isInteger(page) || page < 1) throw new TypeError('Invalid page')
			return { page }
		},
		beforeLoad: ({ params }) => ({ section: params.slug }),
		loader: ({ search, context }) => ({ title: context.section, page: search.page }),
	}).screen(Guide),
])
```

```json
{
	"directory": "src/app",
	"manifests": [{ "module": "./src/guides.tsx", "export": "guideRoutes" }],
	"stacks": ["library", "settings"]
}
```

## Share parent preparation

Use `defineRouteGroup` for reusable parent lifecycles. Attach programmatic
children with `group.route(options).screen(Component)`; file routes explicitly
export the group as `group`. Nest with `group.group(options)`. Layout components
remain rendering wrappers. Each group's guard then loader runs before its
children, and loader output is inherited at `context[group.id]`. Root dependencies
remain separate from those additions. Groups rerun on every preparation, including
URL entry, Back and refresh; failures, redirects and cancellation stop children.
Group callbacks see general params/search because a group can serve several paths.

```ts
import { defineRouteGroup } from '@octane-xplat/ui/routing/core'
export const account = defineRouteGroup({ id: 'profile', loader: () => ({ name: 'Alex' }) })
export const project = account.group({ id: 'project', loader: ({ context }) => context.profile.name })
// In a file route: export { project as group } from '../route-groups'
```

## Keep platform contracts truthful

File discovery recognizes `.tsx`, `.tsrx` and `.md`, not plain `.ts`/`.js`
helpers. Platform variants must preserve compatible params, search input/output,
context and loader data; generated `.contracts` checks compare both directions.
The default facade, hook, redirects and links only accept routes available on
all generated targets. A platform-only destination uses the existing async
validation proof; do not cast it into the shared destination union.

```ts
import { router } from '@octane-xplat/ui/routing'
const camera = await router.validateDestination({ to: '/camera' })
if (camera.status === 'valid') await router.push(camera.destination)
```

Explicit instances infer only their generated target catalog's paths. A missing
screen retains metadata and reports `not-found/unavailable`, separately from
unknown patterns and host readiness. `.web` also serves Linux WebKit; `.mobile`
serves iOS/Android/generic mobile. See the [platform guidance](../../../../docs/app/navigation.md#share-routes-across-targets)
before choosing a target-specific custom host.

```ts
import { routes } from './routes.gen.catalog.web'
import { createRouter } from '@octane-xplat/ui/routing/core'
import type { RouterHost } from '@octane-xplat/ui/routing/core'
export function createWebNavigation(host: RouterHost) {
	return createRouter({ catalog: routes, host })
}
```

## Navigate from the rendering flow

Use `useRouter()` in a routed tree and the imported `router` for root-level
imperative actions. `useCanGoBack()` and `useRouterState()` are reactive and
owner-bound; they take no legacy stack string. A hidden retained entry keeps
its own match when reading through `getRouteApi`.

```tsx
import { Pressable, Text } from '@octane-xplat/ui'
import { useCanGoBack, useRouter } from '@octane-xplat/ui/routing'
export function Back() {
	const navigation = useRouter()
	const available = useCanGoBack()
	return <Pressable disabled={!available} onPress={() => navigation.back()}><Text>Back</Text></Pressable>
}
```

Use `push`, `replace`, `reset`, `back`, `dismiss`, `refresh`, and `retry` for
their distinct operations. Native modal Back walks the presentation's inner
history and returns `at-base` at its first screen; dismiss closes the surface.
Browser reset cannot erase history and returns `unsupported`.

```ts
import { router } from '@octane-xplat/ui/routing'
const result = await router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'none' })
if (result.status === 'committed') await result.finished
```

## Confirm unsaved navigation

Use the entry-owned blocker for a draft, including under a custom provider. It
asks before context/guards/loaders; stale controls cannot approve a newer attempt.
Refresh bypasses leave confirmation. Clearing the condition or unmounting a
blocked declaration cancels it; proceed ends with navigation, not animation.

```tsx
import { Button, View } from '@octane-xplat/ui'
import { useNavigationBlocker } from '@octane-xplat/ui/routing'
export function ConfirmLeave(props: { dirty: boolean }) {
	const blocker = useNavigationBlocker({ when: props.dirty })
	return blocker.status === 'blocked' ? <View>
		<Button label="Keep editing" clickAction={blocker.reset} />
		<Button label="Leave screen" clickAction={blocker.proceed} />
	</View> : null
}
```

Older retained entries in the same flow cannot block its current entry. Several
active blockers must all approve, newest registration first. Confirmation is
flow-owned; redirects stay in the approved attempt, and parent-owner teardown
or raw host closure cannot be vetoed. This does not intercept document unload
or OS exit. See the [supported boundaries and save ordering](../../../../docs/app/navigation.md#confirm-before-leaving-unsaved-edits)
before adding app-wide exit protection.



## Handle inputs and preparation

The browser host prepares Back/Forward destinations with fresh guards, loaders
and one context snapshot for the restored background/modal entries. Imperative
Back refuses before moving history; browser-triggered denial keeps the current
screen and corrects its URL with a bounded wait. Retry preserves the refused
direction. Saved data is never authorization, including URLs revisited after
root-owner replacement. Same-flow rendered-pane Back also rechecks guards/loaders while retaining
local state. Programmatic Frame Back and Android OS Back also prepare retained
targets; redirected Frame content stages in a separate owned root before adoption.
A history redirect to another stack replaces its current entry and preserves the
source history; a modal redirect presents above the admitted source. Native modal
dismissal prepares and refreshes its presenter before closing; denial retains
the modal. Explicit `stack: 'root'` escapes a modal even when its logical stack is
root; an omitted stack inherits the current flow. Redirects reuse prepared data
within the same attempt. An iOS Frame leading-edge swipe requests canonical Back
after release; guards run before the pop. Short/cancelled/reversed drags do not
navigate. It has no finger-tracked preview. Built-in full-content pops are
disabled on owned Pages; this adapter does not add swipe Back to rendered panes
or add modal-dismissal gestures. Routed native modals are fullscreen with direct
SDK cancellation disabled. Close through canonical dismiss or Android OS Back;
forced host closure reconciles cleanup after closing.

```ts
const result = await router.back()
if (result.status === 'forbidden') { /* Show the application's sign-in action. */ }
// After the application's session changes: await router.retry()
```

Use typed `redirect` in guards or loaders. Use the route's own callback args
and root context dependencies instead of reading its own complete inferred
application registry during inference. A failed attempt returns a structured
result and leaves the committed screen visible; it does not inject an error
into otherwise successful screen props.

```tsx
// In the item route, with generated local inputs:
import { redirect } from '@octane-xplat/ui/routing'
import type { RouteGuardArgs } from '../../routes.gen.contracts'
export function beforeLoad({ params }: RouteGuardArgs<'/items/:id'>) {
	if (params.id === 'old') redirect({ to: '/items/:id', params: { id: 'coat' } })
	return { checked: true }
}
```

For programmatic baked specs, preserve the inferred `defineRoutes({ routes,
baked })` return. Accessors infer each DTO from the normalized route-name key
(`'/guides/:slug'` uses `'guides/:slug'`; root uses `'index'`). Missing or erased
map values remain unknown. Extra map keys do not widen destination unions, and
live routes keep their loader output. `defineRoute` is the live-loader helper;
a baked spec is supplied directly in the catalog's route list.

```ts
const catalog = defineRoutes({
	routes: [{ path: '/help', dataMode: 'baked', screen: Help }],
	baked: { help: { title: 'Packing help' } },
})
```

Head callbacks receive `{ params, search, context, data }` from the prepared
snapshot. Access path values through `params`; derive titles from awaited loader
data without another fetch. Keep callbacks synchronous. Programmatic head
callbacks follow the loader in dependency order for inference. File callbacks
use the generated local `RouteHeadArgs<Path>` type, including baked data and
parent context. Static head objects remain supported.

```ts
import { defineRoute } from '@octane-xplat/ui/routing/core'
const item = defineRoute({
	path: '/items/:id',
	loader: ({ params }) => ({ title: params.id }),
	head: ({ data }) => ({ title: data.title }),
})
```

```ts
import type { RouteHeadArgs } from '../../routes.gen.contracts'
export function head({ data }: RouteHeadArgs<'/items/:id'>) {
	return { title: data.title }
}
```

For current-screen filters, bind `getRouteApi(path, instance?).useUpdateSearch()`
inside the screen. A synchronous pure callback receives validated search output
and returns the whole navigation search input. Omit fields to remove them;
preservation is explicit. It replaces by default; `replace:false` pushes.
Guards/loaders rerun, the fragment is preserved, and ordinary host scroll rules
apply. A retained inactive entry's stale callback returns `cancelled` without
invoking the function. Use the returned callback in that screen's handlers.

```tsx
import { Button } from '@octane-xplat/ui'
import { getRouteApi } from '@octane-xplat/ui/routing'
const item = getRouteApi('/items/:id')
export function ItemFilters() {
	const updateSearch = item.useUpdateSearch()
	return <Button label="Activity" clickAction={() => {
		void updateSearch(previous => ({ ...previous, tab: 'activity' }))
	}} />
}
```

Treat unknown URLs as runtime inputs. `navigateUrl` validates them through the
same pipeline. Unknown patterns, unavailable screens, malformed input,
resource-not-found, forbidden, cancellation, and failures remain distinguishable.
Never recover typing by asserting a computed object to a destination union.

```ts
import { router } from '@octane-xplat/ui/routing'
export async function openIncoming(url: string) {
	return router.navigateUrl(url)
}
```

For destination objects from data, await `validateDestination`. It runs path,
option and search/schema checks without context, guards or loading. Pass the
original opaque result to navigation/href, or as `<NavLink to={value}>`.
Choose route options before validation. Do not spread or serialize the opaque
value or pass it to a different instance. Omitted stacks follow the consuming
navigator; navigation rechecks the current registry and guards. Removed or
changed routes cannot use an old proof to bypass preparation. `resolveUrl` is
only a synchronous syntactic match, not the async schema proof.

```tsx
import { NavLink } from '@octane-xplat/ui'
import { router } from '@octane-xplat/ui/routing'
import type { ValidatedDestination } from '@octane-xplat/ui/routing'
export async function openFromData(value: unknown) {
	const checked = await router.validateDestination(value)
	if (checked.status === 'valid') return router.push(checked.destination)
	return checked
}
export function CheckedLink(props: { destination: ValidatedDestination }) {
	return <NavLink to={props.destination}>Open</NavLink>
}
```

## Show navigation feedback

`useNavigation()` returns one flow's `idle`, `pending`, or `failed` state,
including the attempted action and readonly URL inputs. It exposes no route
DTO, so shared status components can inherit custom providers without an
instance prop. Typed `useRouterState()`, `useRouteMatch()`, `useRouter()` and
route-specific accessors require that explicit instance under custom providers.

```tsx
import { Text } from '@octane-xplat/ui'
import { useNavigation } from '@octane-xplat/ui/routing'
function LoadingStatus() {
	return <Text>{useNavigation().status === 'pending' ? 'Opening…' : ''}</Text>
}
```

Failed preparation retains the committed screen. A flow's retry repeats its
latest failed request, including missing/forbidden/invalid destinations;
successful commit or `clearFailure()` clears feedback. A cancelled retry can
reveal the previous failure again. Keep errors local and distinguish expected
missing/forbidden outcomes from unexpected loader/render failures.

```ts
const state = navigation.getSnapshot().navigation
if (state.status === 'failed') await navigation.retry()
navigation.clearFailure()
```

## Compose typed navigation

Use `to`/`params`/`search` directly on sidebar, top-bar, heading-menu,
breadcrumb, menu-link, navigation-strip and navigation-tab items. Their arrays
accept readonly values; use `as const satisfies readonly BreadcrumbItem[]`
(or the corresponding item type) when storing them separately. `href` is the
raw URL alternative; actions omit both. Literal destinations under a custom
provider require `router={instance}`. An opaque checked destination may inherit
its issuing instance from that provider; pass the entire value as `to`.

```tsx
import { SideNavItem, DropdownMenu, TabList, Tab } from '@octane-xplat/ui'

const item = <SideNavItem label="Coat" to="/items/:id" params={{ id: 'coat' }} />
const menu = <DropdownMenu trigger="Items" items={[
	{ type: 'link', key: 'coat', label: 'Coat', to: '/items/:id', params: { id: 'coat' } },
]} />
const tabs = <TabList value="coat" onChange={() => {}}>
	<Tab value="coat" label="Coat" to="/items/:id" params={{ id: 'coat' }} />
</TabList>
```

Typed navigation tabs use the navigation pattern. `role="tablist"` controls
local panels and rejects `to`; `TabMenu` also remains a local selection menu.
Use a routing `DropdownMenu` for overflow destinations. Web typed items retain
real hrefs, modifiers and target/download behavior; native activation uses the
owner's flow. Callback `preventDefault()` cancels activation and menu closing.

```tsx
import { SideNavItem } from '@octane-xplat/ui'

const paused = <SideNavItem label="Coat" to="/items/:id" params={{ id: 'coat' }}
	onClick={event => event.preventDefault()} />
```

## Keep panes and ownership explicit

A named stack has a distinct URL marker: `/@library/items/coat`. Generate links
with the bound navigator's `href`; ordinary root patterns and catch-alls cannot
claim a marked stack URL. Literal `@` route segments are percent-encoded. Use
three slashes for a custom-scheme link such as `pack:///@library/items/coat`,
so the stack marker is in the path, not the URL authority.

```ts
import { router } from '@octane-xplat/ui/routing'
const href = router.forStack('library').href({ to: '/items/:id', params: { id: 'coat' } })
```

A named `Tabs` pane owns its route outlet. Stackless tabs are ordinary UI.
Retain tab render functions and keys; place the outer root outlet explicitly.
Native activity Back targets the visible flow rather than stealing hidden-tab
history. Native pane histories are independent; web still has one browser history.

```tsx
import { RouteOutlet, Tabs, Text } from '@octane-xplat/ui'
function Library() { return <Text>Library</Text> }
function Settings() { return <Text>Settings</Text> }
const tabs = [
	{ key: 'library', title: 'Library', stack: 'library', render: Library },
	{ key: 'settings', title: 'Settings', stack: 'settings', render: Settings },
]
export function Sections() { return <RouteOutlet><Tabs tabs={tabs} /></RouteOutlet> }
```

A root outlet owns retained prepared route data. On web, removing it discards
current/saved matches and owned Back state; a new default root prepares the
current URL again without adding history. Application stores are separate.
Key a common component around every outlet that should be discarded together.
A new native owner waits for old Frame restoration and modal cleanup before
committing navigation; it starts at its declaring content. A context-source
update alone does not invalidate retained prepared entries.

```tsx
import { RouteOutlet, Text } from '@octane-xplat/ui'
function OwnedScreens() { return <RouteOutlet><Text>Choose a screen.</Text></RouteOutlet> }
export function App(props: { ownershipVersion: number }) {
	return <OwnedScreens key={props.ownershipVersion} />
}
```

Embedded panes use an explicit instance with `createPaneRouterHost` and
`RouterPane`. Attach the instance created with that host before rendering;
cloned bindings, host reuse and attachment to another instance are rejected.
The creator owns disposal. Keep JSX component declarations at module scope for
universal compilation; factories create controller/state objects. Pane histories
retain screens and providers without changing browser URLs, creating native
Frames or presenting modals. Motion reports skipped. OS Back and window-close
integration belong to the enclosing host. Typed hooks take the explicit instance.
The private native GTK renderer supports this explicit pane workflow through
`xplatLinuxGtk`. Keep its screens in `.gtk` leaves and use the GTK preset's
renderer resolution. Its modal presentation, OS Back, generated startup and
full shared-control support are outside this measured subset. See the
[GTK pane example](../../../../docs/platform/linux-gtk.md#add-retained-route-panes)
and [executed checks](../../../docs/navigation-checks.md#native-gtk-retained-panes).

Read the [complete pane walkthrough](../../../../docs/app/navigation.md#bind-a-custom-router-to-rendering)
for toolbars, named flows and lifetime cleanup.

```tsx
import { Text } from '@octane-xplat/ui'
import { createPaneRouterHost, createRouter, defineRoute, defineRoutes, RouterPane } from '@octane-xplat/ui/routing'
export function createPaneNavigation() {
	const host = createPaneRouterHost()
	const catalog = defineRoutes([defineRoute({ path: '/help' }).screen(() => null)])
	const navigation = createRouter({ catalog, host: host.host, stacks: ['library', 'settings'] })
	host.attach(navigation)
	return { host, navigation, dispose: () => navigation.dispose() }
}
export function Library(props: { workspace: ReturnType<typeof createPaneNavigation> }) {
	return <RouterPane host={props.workspace.host} router={props.workspace.navigation} stack="library">
		<Text>Library base</Text>
	</RouterPane>
}
```

Register runtime contributions with stable IDs and disposal handles. They do
not widen compile-time destinations or replace a declared contract, even with
`conflict: 'replace'`; compose declared overrides before creating the instance.
Keep reusable specs literal with `as const satisfies RouteSpec`; a broad
`: RouteSpec` annotation erases the finite path. Ordinary catalog errors put
the literal-path repair first. The baked-data signature requires actual data;
explicit generic arguments cannot provide evidence for an omitted value.

```ts
import { defineRoutes, type RouteSpec } from '@octane-xplat/ui/routing/core'
const help = { path: '/help', screen: () => null } as const satisfies RouteSpec
const helpRoutes = defineRoutes([help])
```

Use `defineRoutes` for finite patterns and `defineRuntimeRoutes` for computed
strings/templates. Both preserve root dependencies. Prefer `/guides/:slug` for
content sharing one screen. Returned catalogs/definitions are immutable;
author changes through the builders instead of spreading inferred definitions
or editing metadata.

```ts
import { defineRoute, defineRuntimeRoutes } from '@octane-xplat/ui/routing/core'
import type { RouterInstance } from '@octane-xplat/ui/routing'
export function installContent(navigation: RouterInstance, paths: readonly string[]) {
	const catalog = defineRuntimeRoutes(paths.map(path => defineRoute({ path }).screen(() => null)))
	return navigation.addRoutes(catalog, { id: 'content', conflict: 'replace' })
}
```

Aggregate state, navigation results, and `useRouteMatch` include a runtime
branch with unknown data. Check `contract === 'declared'` before narrowing the
declared route union. Use a named accessor for the
inferred DTO. Under a custom provider, pass its instance to typed hooks and
accessors; omitted instances refer to the default client and throw under a
custom provider. Client behavior belongs in definitions, never router option
overrides.

```tsx
import { useRouter } from '@octane-xplat/ui/routing'
import { Pressable, Text } from '@octane-xplat/ui'
import type { createPaneNavigation } from './pane-navigation'
type Navigation = ReturnType<typeof createPaneNavigation>['navigation']
export function OpenHelp(props: { navigation: Navigation }) {
	const navigation = useRouter(props.navigation)
	return <Pressable onPress={() => navigation.push({ to: '/help' })}><Text>Help</Text></Pressable>
}
```



## Return after sign-in and change authority

Use `navigateUrl(returnUrl, { replace: true })` after the application updates its
session. It applies the origin/scheme policy, search validation and current
guards/loaders. A resolver match is normalized runtime input, not a typed
contract proof. Rejected URLs retain the committed screen; inspect the result.

```ts
import { router } from '@octane-xplat/ui/routing'
export function returnAfterSignIn(returnUrl: string) {
	return router.navigateUrl(returnUrl, { replace: true })
}
```

Root context is a shallow snapshot per attempt. Synchronous sources are copied
before yielding; services retain identity, so return immutable/fresh account
values. Set the common root outlet's `authority` token when account identity or
permissions change. It retires owned screens, nested panes, modals and pending
work. Application-owned caches and server authorization remain separate.

```tsx
import { RouteOutlet } from '@octane-xplat/ui'
export function App(props: { authorityVersion: number }) {
	return <RouteOutlet authority={props.authorityVersion} />
}
```

If sign-in changes authority, supply `resumeUrl` in the same update. The new
owner consumes one validated replacement navigation after startup settles.
`onResume` receives its result while the owner is alive. Failures consume the
intent too; changing only resumeUrl cannot create a retry loop in the same
lifetime. The app owns SDK cancellation and must ignore late results from a
cancelled or unmounted login attempt. See the [handoff guide](../../../../docs/app/navigation.md#return-after-sign-in).

```tsx
import { RouteOutlet } from '@octane-xplat/ui'
export function SessionApp(props: { authorityVersion: number; returnUrl?: string }) {
	return <RouteOutlet authority={props.authorityVersion} resumeUrl={props.returnUrl}
		onResume={result => { if (result.status !== 'committed') console.info('Return failed') }} />
}
```

## Ship build-time route data

For `dataMode: 'baked'`, put Node/content dependencies in the `.loader.ts`
sibling. Generated `RouteProps` and route accessors infer its awaited output
through type-only imports. Never import that loader into a screen at runtime.
Markdown route contracts receive `MdDoc`. Typechecking refreshes contracts
without executing loaders; routes/dev/build regenerate the actual data.

```tsx
import { Text } from '@octane-xplat/ui'
import type { RouteProps } from '../routes.gen.contracts'
export const dataMode = 'baked'
export default function Changelog(props: RouteProps<'/changelog'>) {
	return <Text>{props.data.version}</Text>
}
```

Return plain JSON values from the sibling. Generation rejects silent JSON loss
such as `undefined`, holes, non-finite numbers, class instances, accessors and
cycles, with route/source/field diagnostics. Convert special values explicitly.

```ts
export function loader() { return { version: '1', publishedAt: new Date().toISOString() } }
```

## Boundaries to preserve

Route presentation and motion are separate. Use `transition: 'none'` for
predictable no-animation navigation. Browser `fade`/`default` wrap the actual
DOM commit in View Transitions after preparation. Navigation resolves at commit;
`result.finished` reports animation separately. Reduced motion and missing
browser support skip the effect. Register custom names with `defineTransitions`
and browser leaves with `defineWebTransition` from `@octane-xplat/ui/web`; configure
the export in `xplat.routes.json`. Other target leaves need the same keys and an
implementation or explicit `{ kind: 'skip' }` fallback. Native Frame leaves use
`defineNativeTransition` from `@octane-xplat/ui/nativescript` with a synchronous
`page` factory returning NativeScript navigation options or a new Transition
instance. The native engine owns Back reversal; do not rerun that factory for
Back. The same definition's `view` option animates routed NativeScript modals
and retained rendered panes: the router-owned content wrapper animates from the
flat `from` values (`opacity`, `translateX/Y`, `scaleX/Y`, `rotate`) to neutral
via the SDK `Animation` engine after the surface appears (`animated: false` —
`ShowModalOptions.transition` is unreliable upstream). Built-in `fade` fades
content for 240 ms; the `view` subset is unsupported on GTK and Windows, which
report `skipped`/`unsupported`.
AppKit pane leaves use `defineAppKitTransition` from `@octane-xplat/ui/macos`:
`from` supplies the same flat numeric starting values, optionally derived from
direction, and `duration` is a linear tween in milliseconds. The router restores
its private incoming wrapper to neutral values on completion/interruption/
disposal; routed AppKit modal content animates the same way after `show`. Back
uses the departing definition with reverse direction. No outgoing snapshots are
implied.

```ts
// src/transitions.macos.ts
import { defineTransitions } from '@octane-xplat/ui/routing/core'
import { defineAppKitTransition } from '@octane-xplat/ui/macos'
export const transitions = defineTransitions({
	detail: defineAppKitTransition({
		from: ({ direction }) => ({ opacity: 0, translateX: direction === 'back' ? -24 : 24 }),
		duration: 240,
	}),
})
```

Explicit router instances infer their own transition keys through hooks and
NavLink. AppKit routed modals use a deferred fullscreen in-window surface,
retain their own history/providers, and animate content with a configured
`defineAppKitTransition` (otherwise `finished` reports `skipped`). Back at
the first modal screen returns `at-base`; `dismiss` closes the flow.
Escape/outside callbacks request canonical guarded dismissal; raw window closure
and owner removal clean up the modal family. Native keyboard/pointer input
remains unqualified.

```ts
import { router } from '@octane-xplat/ui/routing'
await router.push({ to: '/items/:id', params: { id: 'coat' }, presentation: 'modal', transition: 'none' })
```

Browser routed modal flows use body portals and the shared modal focus manager:
the presenter is inert, Tab stays inside, and Escape requests canonical guarded
dismissal. `head.title` names the dialog (fallback: “Dialog”). Focus ownership
survives screen changes. A stable DOM `id` can restore the opener after presenter
revalidation replaces its node. A remaining parent modal is the fallback for a
removed opener; do not claim an absent control is recreated or that screen-reader
input has been tested.

```tsx
export const head = () => ({ title: 'Edit item' })
```

Browser page changes focus an explicit autofocus target, then a visible h1/
level-one ARIA heading, a main landmark or the document body. Temporary tabindex
is released on blur/owner teardown. Back/Forward use entry-specific document
scroll and saved focus, with stable DOM IDs for re-rendered controls. Refresh
preserves focus/scroll; ordinary push/replace/search updates use page-change
effects. Cancelled/stale work cannot apply late focus, scroll or head metadata.
These are document effects; nested scrollers, late layout shifts, native focus
and assistive-technology input require their own qualification.

```tsx
/** @jsxImportSource @octane-xplat/jsx/dom */
export default function Help() {
	return <main><h1>Packing help</h1><button id="packing-action">Pack</button></main>
}
```

The default client is app/document-local. Server hosts must create request-local
instances, context and preparation state; a JSON manifest is not an SSR host.
Do not configure a shared default client for an account on a server request.

```ts
// Client entry only:
import './routes.gen'
// Optional server HTML uses @octane-xplat/web-host/server, not this startup.
```

```ts
// src/transitions.mobile.ts
import { defineTransitions } from '@octane-xplat/ui/routing/core'
import { defineNativeTransition } from '@octane-xplat/ui/nativescript'
export const transitions = defineTransitions({
	detail: defineNativeTransition({ page: () => ({ name: 'slideLeft', duration: 240 }) }),
})
```

Read [the app navigation guide](../../../../docs/app/navigation.md) for complete
workflows, [Frame internals](navigation/native-frames.md) only when debugging
native containment, and [navigation checks](../../../docs/navigation-checks.md)
for commands and target-specific evidence. Current cutover verification must be
reported separately from historical pre-cutover runs; Windows has no VM here.

Incoming absolute links require explicit `allowedSchemes` or `allowedOrigins`
in `xplat.routes.json` (or explicit router configuration). Schemes map their
authority into the route path; HTTPS origins are allowlisted and removed before
matching. For example, `pack://items/coat` and an allowed
`https://app.example/items/coat` both resolve `/items/:id`. Unconfigured URLs
return `invalid-input`; malformed links never create fallback routes.

```json
{ "allowedSchemes": ["pack"], "allowedOrigins": ["https://app.example"] }
```


## Optional Web document host

Use `@octane-xplat/web-host` for request-time HTML over an executable catalog.
Read the [Web rendering guide](../../../../docs/platform/web-rendering.md) for
paired server/browser builds and the maintained example. Keep request context
local, require an explicit public projection, and keep server dependencies in
the server entry. The public projection is also the server screen's props;
screens cannot rely on private preparation services. Use the passed router with
typed hooks, never the shared default client in a request.

```ts
import { createWebHandler } from '@octane-xplat/web-host/server'
import { catalog } from './routes.web.tsrx'
export const handle = createWebHandler({
  catalog, buildId: 'store-v1', assets: { scripts: ['/client.js'] },
  transfer: match => ({ data: match.data as { name: string }, context: {} }),
})
```

A component `Document` is a server-only shell; only its app container hydrates.
Place interactive persistent UI in the same `App` supplied on both sides.
`mode: 'client'` skips server preparation, whereas `live`/`baked` still describes
portable data provenance. This package provides neither remote loaders nor
server-import stripping, streaming, or static-path enumeration.

```ts
import { startWebApp } from '@octane-xplat/web-host/client'
await startWebApp({ catalog, buildId: 'store-v1' })
```

Use `srvx` for the listening server instead of implementing Node HTTP conversion.
Serve built browser assets with `srvx/static` on Node-compatible runtimes. A
Fetch-native deployment can call the same handler directly; provider deployment
and asset storage still need their own qualification.

```ts
import { serve } from 'srvx'
serve({ fetch: handle })
```
