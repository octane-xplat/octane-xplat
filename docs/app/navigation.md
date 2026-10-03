# Moving between screens

> Open another screen and let someone return with Back.

A packing-list app might have a list screen, an item detail screen, and a
settings screen. **Navigation** connects those screens. In the browser,
each destination can have a URL. On phones, opening a screen adds it to a
**stack**, the history that Back moves through.

If you're working with an agent, describe the action: “Tap an item to open
its details, then go back without losing the list.” Try both the browser
Back button and the phone's back action. Check
[navigation limits](../verify/known-limits.md#navigation) for the platforms you use.

This guide assumes you have [a working app](../start/toolchain.md#create-and-run).
The early sections cover destinations and links; later sections cover
optional setup for data, sign-in rules, and links from outside the app.

## A route is a destination

A **route** describes a destination: `name` identifies the screen, `params`
carries the information it needs, and `stack` selects its navigation history.
Use `root` for the main flow. On web, opening the route updates the URL; on
native, it opens the screen in that stack. With a registered `settings` screen,
call `pushRoute` from a button's press handler:

```ts
import { pushRoute } from '@octane-xplat/ui'

pushRoute({ stack: 'root', name: 'settings', params: {} })
```

## Keep browser links real

This example assumes a registered `settings` route. Place the component in
your app and render `<Footer />` in a screen. Select Settings and check that
it opens that destination; on web, its link can also open in a new tab.

Use `NavLink` for an in-app destination the user might copy or open in a new
tab — on web it renders a real `<a href>` whose plain click drives
`pushRoute` while modified clicks keep native browser behavior; on native it
navigates the same route. Use `Link` for an outbound URL — a real anchor on
web, the OS opener on native. Use `pushRoute` for an in-app action that is
not naturally a link.

```tsx
import { HStack, Link, NavLink } from '@octane-xplat/ui'

export function Footer() {
	return (
		<HStack>
			<NavLink route={{ stack: 'root', name: 'settings', params: {} }}>Settings</NavLink>
			<Link href="https://example.com">Website</Link>
		</HStack>
	)
}
```

For a component that must observe the current destination, use `useRoute` on
the stack it owns. A tab can therefore keep its own history without taking
over the whole app.

```tsx
import { Text, useRoute } from '@octane-xplat/ui'

export function Example() {
	const route = useRoute('root')
	return <Text>Current screen: {route?.name ?? 'Home'}</Text>
}
```

## Let the route dir name your routes

A **route directory** is a folder containing your screen files. When your
app is configured for generated routes, files under `app/` become
destinations, and their file paths supply the names. For example,
`app/detail.tsrx` names the `detail` route:

```
app/detail.tsrx        → 'detail'
app/demo/[id].tsrx     → 'demo/:id'
app/demo/[[ref]].tsrx  → 'demo/:ref?'    (optional segment — matches with or without it)
app/docs/[...r].tsrx   → 'docs/*r'       (catch-all — captures the rest of the path)
app/settings.web.tsrx  → 'settings'      (web only — suffixes still apply)
app/about+modal.tsrx   → 'about'         (modal presentation)
app/notes.md           → 'notes'         (markdown — baked at codegen)
app/chat/_layout.tsrx  → wraps every 'chat/*' route
app/x.loader.ts        → build-time loader for baked route 'x' (never bundles)
```

An **optional segment** (`[[name]]`, or `:name?` in a programmatic path)
matches zero or one path segments, so one route can serve
`/en/guides/setup` and `/guides/setup` alike. When the segment is absent the
param is simply not set — the screen reads it as `undefined`. A
**catch-all** (`[...name]` or `*`) must be the last segment of the pattern;
it captures everything left in the path, `/`-joined, into a param — the
anonymous `*` form lands on `params['*']`, a named `[...rest]` on
`params.rest`, and an empty remainder gives `''`. When several patterns can
match one URL, static segments win over params, params over optional
params, and optionals over a catch-all — `docs/new` beats `docs/:id` beats
`docs/:id?` beats `docs/*rest`. On web the same rule runs in reverse when a
route is pushed: an optional segment without a value is left out of the
URL, and a splat param splices in as real path segments. One boundary: a
bare root-level `*` claims every URL the manifest doesn't otherwise match —
including links into named stacks — so apps that use named stacks scope
their catch-alls under a prefix (like `guides/*`) instead.

```tsx
import { Text } from '@octane-xplat/ui'

// Screen for ':locale?/guides/:doc' — locale may be absent.
export function Guide(props: { doc: string; locale?: string }) {
	return <Text>{`${props.locale ?? 'en'}: ${props.doc}`}</Text>
}
```

Route params land as screen props. Feed them to a
[screen-owned query](data.md#module-scope-vs-screen-scope) when stacked
screens must keep independent requests.

```tsx
import { Text } from '@octane-xplat/ui'

export function Detail(props: { id: string }) {
	return <Text>Item: {props.id}</Text>
}
```

### What the route generator writes

The rest of this section explains generated files for setup and debugging.
A **manifest** is a list of available routes. A **glob** is a file pattern
used to collect the route files, and **codegen** means generating code from
that list. You don't edit the generated route files by hand.

`deriveRouteManifest` turns a set of screen modules into a route table, and
`registerRoutes` registers it once at startup. The generated web entry uses a
Vite glob to collect the modules:

```ts
import { deriveRouteManifest, registerRoutes } from '@octane-xplat/ui'

// Generated web entry: Vite supplies import.meta.glob.
const files = import.meta.glob('./app/**/*.tsrx', { eager: true })
registerRoutes(deriveRouteManifest(files, ['web']))
```

`xplat routes` generates the route types, baked loader results, manifest JSON,
and a registration entry for each platform. It runs automatically during
`xplat dev`, `xplat build`, and `xplat typecheck`; run it directly after changing
your route files if you need to refresh generated code:

```sh
pnpm exec xplat routes
```

The generated `RouteName` and `RouteParams` types let your own navigation
helper check destination names and params. This helper belongs beside the
app's generated `routes.gen.types.ts`:

```ts
import { pushRoute } from '@octane-xplat/ui'
import type { RouteName, RouteParams } from './routes.gen.types'

export function openScreen<Name extends RouteName>(name: Name, params: RouteParams[Name]) {
	pushRoute({ stack: 'root', name, params })
}
```

## Register routes from data

You can skip this if your destinations come from screen files. Use it when
a list of data records determines the routes, such as one help page per guide.

This composition fragment assumes `docs` is your data array and `GuideIndex`,
`GuideShell`, and `guideScreen(doc)` are your components. The maintained
[guide routes](../../packages/app/src/guides.tsrx) show the complete example.

The file tree can't express routes derived from runtime data — a docs app
that maps a content directory, or a host framework generating its route
table. `defineRoutes` builds the same manifest from specs instead of files
(decision #67):

```ts
import { addRoutes, defineRoutes } from '@octane-xplat/ui'

addRoutes(
	defineRoutes({
		routes: [
			{ path: 'guides', screen: GuideIndex, head: { title: 'Guides' } },
			...docs.map((doc) => ({
				path: `guides/${doc.slug}`,
				screen: guideScreen(doc), // a component closing over the record
				head: { title: doc.title },
			})),
		],
		layouts: { guides: GuideShell }, // like guides/_layout.tsrx
	}),
)
```

A `RouteSpec.path` uses the route-dir vocabulary — `'docs/:slug'` (or
`'docs/[slug]'`) declares a param, `':locale?'` (or `'[locale?]'`/
`'[[locale]]'`) an optional segment, a terminal `'*'` (or `'[...rest]'` for
a named capture) a catch-all, a trailing `index` or `''` names the
root, and `presentation` replaces the `+modal`/`+fade` suffix. `screen` is
the component itself, not a module; `loader`, `beforeLoad`, and `head` work
exactly like the route-file exports. `layouts` keys are path prefixes that
wrap every route beneath them, the same job `_layout.tsrx` does — they key
off the route name's literal prefixes, so a route like
`':locale?/guides/:doc'` nests under `layouts[':locale?/guides']`, not
`layouts['guides']`.

```tsx
import { defineRoutes, registerRoutes, Text } from '@octane-xplat/ui'

function Guide(props: { slug: string }) {
	return <Text>{props.slug}</Text>
}
function GuideShell(props: { children?: unknown }) {
	return <>{props.children}</>
}

registerRoutes(
	defineRoutes({
		routes: [
			{
				path: 'docs/:slug',
				screen: Guide,
				presentation: 'push',
				head: { title: 'Guide' },
				loader: (params) => ({ slug: params.slug }),
			},
		],
		layouts: { docs: GuideShell },
	}),
)

export function Example() {
	return <Text>Routes registered</Text>
}
```

Registered routes are indistinguishable from file routes — they push into
named stacks, resolve through `screenFor` outlets, match deep links, and
substitute params into web URLs. `addRoutes` layers its manifest over the
file-derived one at any point (it survives `routes.gen` re-registration
under HMR); to compose before registration instead, pass
`registerRoutes(mergeRouteManifests(routes, dynamic))`.

```tsx
import { addRoutes, defineRoutes, screenFor, Text } from '@octane-xplat/ui'

function Guide() {
	return <Text>Guide</Text>
}
addRoutes(defineRoutes({ routes: [{ path: 'guides', screen: Guide }] }))
const GuideScreen = screenFor('guides')
```

**Precedence is registration order.** On a same-name collision the later
manifest wins and a console warning names both sources — deliberate
overrides layer on top, accidental ones are loud. Merge the dynamic
manifest first (`mergeRouteManifests(dynamic, routes)`) if file routes
should win.

```tsx
import { defineRoutes, mergeRouteManifests, registerRoutes, Text } from '@octane-xplat/ui'

function FileGuide() {
	return <Text>File guide</Text>
}
function DynamicGuide() {
	return <Text>Dynamic guide</Text>
}
const files = defineRoutes({ routes: [{ path: 'guide', screen: FileGuide }] })
const dynamic = defineRoutes({ routes: [{ path: 'guide', screen: DynamicGuide }] })
registerRoutes(mergeRouteManifests(dynamic, files)) // FileGuide wins.
```

Literal paths are typed at the callsite — `defineRoutes` infers route
names, params, and presentations from each `path` string, and the returned
manifest carries them through `ManifestRouteNames`/`ManifestRouteParams`/
`ManifestRoutePresentations`, so an app can union them into its generated
types (`RouteName | ManifestRouteNames<typeof manifest>`) with no codegen
step. Only paths that are genuinely computed at runtime stay outside the
typed surface — navigate those with the low-level `Route` shape
(`pushRoute({stack, name, params})`, `NavLink route={...}`). The generated
`routes.screens` snapshot likewise covers file routes only — resolve
screens through `screenFor(name)`, which reads the merged registry.

```tsx
import { defineRoutes, Text } from '@octane-xplat/ui'
import type { ManifestRouteNames, ManifestRouteParams } from '@octane-xplat/ui'

function Guide(props: { slug: string }) {
	return <Text>{props.slug}</Text>
}
const manifest = defineRoutes({ routes: [{ path: 'docs/:slug', screen: Guide }] })
type Name = ManifestRouteNames<typeof manifest>
type Params = ManifestRouteParams<typeof manifest>
const name: Name = 'docs/:slug'
const params: Params['docs/:slug'] = { slug: 'packing' }
```

## Present a route modally

A **modal** appears over the current screen, such as a form you can close
without leaving the list underneath.

Suffix the file with `+modal`, or pass `presentation: 'modal'` on the push.
Native shows it as its own modal root over the current page; web overlays it
while keeping the URL underneath. Back — or the `close` prop the screen
receives — dismisses it. `+fade` pushes with a fade transition. A modal
screen mounts its own root, so component context does not reach it — pass
values through params or a shared store.

```ts
import { pushRoute } from '@octane-xplat/ui'

// The about route is registered; run this in an action handler.
pushRoute({ stack: 'root', name: 'about', params: {}, presentation: 'modal' })
```

A route file can also export `loader(params)` — it runs when the route is
pushed and the commit waits for it: the previous screen stays up until the
promise settles, then the result lands on the screen as `data` and a
rejection as `error`. That's the default `dataMode: 'live'`; the next
section covers baking the result in instead.

```tsx
// app/detail.tsrx
import { Text } from '@octane-xplat/ui'

export async function loader(params: Record<string, string>) {
	return { title: `Item ${params.id}` }
}
export function Detail(props: { data?: { title: string }; error?: unknown }) {
	return <Text>{props.error ? 'Could not load item' : (props.data?.title ?? 'Loading')}</Text>
}
```

Two entry paths land on a different first paint. A push commits the route
only after `loader` settles — the screen mounts once, already holding
`data` or `error`. A direct-URL visit or a history entry from before the
document loaded can't block its own mount — the screen renders immediately
with `pending: true`, and `data` or `error` arrive when the loader
settles. Screens that should stay honest render `pending` before reaching
for `data`:

```tsx
export function Detail(props: {
	data?: { title: string }
	error?: unknown
	pending?: boolean
}) {
	if (props.pending) return <Text>Loading…</Text>
	return <Text>{props.error ? 'Could not load' : props.data?.title}</Text>
}
```

To rerun a loader, push the route again — there is no loader `refetch`.
The low-level `runLoader(name, params)` from `route-table` is a different
primitive: it fires a loader without navigating, for warming a cache ahead
of a push an app expects to make.

## Catch a screen that fails to render

A **route error boundary** replaces the route's rendered subtree — the
screen plus its `_layout` chain — when rendering throws. That includes the
ordinary case (the screen crashes) and the sneaky one: the screen rendering
a loader `error` prop crashes on the way to its own error UI. Declare one
by exporting a component named `ErrorBoundary` from the route file; the
runtime wraps every outlet that presents the route — pushed page, native
modal root, named stack root, or web root/pane/modal — in a portable
boundary that renders it instead (decision #97):

```tsx
// app/detail.tsrx
import { Pressable, Text } from '@octane-xplat/ui'
import type { RouteErrorBoundaryProps } from '@octane-xplat/ui'

export function ErrorBoundary(props: RouteErrorBoundaryProps) {
	return (
		<Pressable onPress={props.reset}>
			<Text>{`Route ${props.route.name} failed — tap to retry`}</Text>
		</Pressable>
	)
}
```

The boundary receives `error` (the thrown value), `route` (the committed
route object), and `reset`. `reset` clears the caught error and remounts
the same subtree with the same props — it does **not** rerun `loader` or
`beforeLoad`, so a deterministic throw recatches. To retry route
preparation, the boundary re-pushes the route:

```tsx
export function ErrorBoundary(props: RouteErrorBoundaryProps) {
	return (
		<Pressable
			onPress={() =>
				pushRoute({
					stack: props.route.stack,
					name: props.route.name,
					params: props.route.params,
				})
			}
		>
			<Text>Reload route</Text>
		</Pressable>
	)
}
```

Loader rejections do not enter the boundary — they commit as the screen's
`error` prop and the screen owns its own error UI. The boundary exists for
when *that* render fails too. `defineRoutes` specs take `errorBoundary`
directly; `routes.gen.manifest.json` records an `errorBoundary` presence
flag for host consumers. A working screen-plus-boundary pair lives in the
maintained harness at `packages/app/src/app/broken.tsrx` — its loader and
render can each be made to fail from the Test tab.

## Bake route data at build time

`export const dataMode = 'baked'` moves the loader off the runtime: its
output is computed once during `xplat routes`/`dev`/`build`, serialized
into `routes.gen.data.ts`, and delivered to the screen as `data` on web and
native without a navigation-time fetch.

```tsx
// app/changelog.tsrx; pair with changelog.loader.ts below.
import { Text } from '@octane-xplat/ui'

export const dataMode = 'baked'
export function Changelog(props: { data: { title: string } }) {
	return <Text>{props.data.title}</Text>
}
```

The loader itself moves to a sibling module — `app/changelog.tsrx` pairs
with `app/changelog.loader.ts` exporting `loader()`. That module runs under
Node (vite `ssrLoadModule`), so `node:fs` and friends are legal inside it,
and because nothing at runtime imports it, its dependency graph stays out
of every bundle. An in-file `loader` export on a baked route warns and is
ignored — it would drag its imports into the shipped graph.

```ts
// app/changelog.loader.ts: runs during route generation, not in the app.
export function loader() {
	return { title: 'Packing list release notes' }
}
```

Constraints that keep the mechanism honest:

- **JSON results.** A non-serializable value (function, symbol, bigint)
  fails `xplat routes` naming the route.
- **No params at bake.** The loader runs once per route, not per URL — a
  `docs/[slug]` baked loader returns the whole slug→record table and the
  screen selects by `params.slug`.
- **Regeneration is explicit.** Baked data is committed like the manifest;
  edit a `.loader.ts` and re-run `xplat routes` (or dev/build). `Xplat
typecheck` refreshes types without re-baking.
- A `dataMode: 'baked'` route with no `.loader.*` sibling fails codegen —
  the pairing is checked, not implied.

Programmatic routes carry the same axis: `dataMode: 'baked'` on a
`RouteSpec` plus a `baked` map on the `defineRoutes` set — the host
computes the data however it wants and ships it in the manifest.

```tsx
import { defineRoutes, registerRoutes, Text } from '@octane-xplat/ui'

function Guide(props: { data: { title: string } }) {
	return <Text>{props.data.title}</Text>
}
registerRoutes(
	defineRoutes({
		routes: [{ path: 'guide', screen: Guide, dataMode: 'baked' }],
		baked: { guide: { title: 'Packing guide' } },
	}),
)
```

## Route a markdown file

A `.md` file in the route dir is a baked route with the parser built in:
`xplat routes` converts it to a JSON AST at codegen, the result rides
`bakedRouteData` like any baked route, and the shared `MarkdownScreen`
renders it through the vocabulary (`Text`/`View`) on every target — no
parser ships. It's the zero-code path for help, changelog, and docs
screens. A `[param].md` warns and is skipped (use the `.loader.ts` table
pattern for param'd content); a `.md` file colliding with a same-name
component file keeps the component with a warn.

```md
<!-- app/help.md: route generation bakes this document. -->

# Packing help

Keep heavy items at the bottom of your bag.
```

`MarkdownScreen` handles the `Screen`/`ScrollableArea` shell; `Markdown`
renders a document tree anywhere if you embed a baked doc inside a custom
screen.

```tsx
import { Markdown, MarkdownScreen } from '@octane-xplat/ui'
import type { MdDoc } from '@octane-xplat/ui'

// doc is the baked Markdown tree supplied by route generation.
export function Help(props: { doc: MdDoc }) {
	return <MarkdownScreen data={props.doc} />
}
export function HelpSection(props: { doc: MdDoc }) {
	return <Markdown data={props.doc} />
}
```

## Hand the route list to a host

`xplat routes` writes `routes.gen.manifest.json` — a versioned normalized
route list (names, colon paths, params, presentation, `dataMode`, layout
chains, sources, hook-presence flags) that an external host can consume
without reading the route dir. `manifestToJson(manifest)` produces the
identical shape in-process for programmatic or merged manifests, so a host
sees one schema whether routes came from files or `defineRoutes`.

```tsx
import { defineRoutes, manifestToJson, Text } from '@octane-xplat/ui'

function Help() {
	return <Text>Packing help</Text>
}
const manifest = defineRoutes({ routes: [{ path: 'help', screen: Help }] })
const hostRoutes = manifestToJson(manifest)
console.log(JSON.stringify(hostRoutes))
```

When pushes overlap, the latest request wins for that stack on native and
macOS. Web has one history, so any newer push supersedes the pending push.
For example, push a slow-loading detail screen, then a settings screen:
finishing the detail loader cannot take you away from settings. Back navigation
also invalidates pending work for the affected history. Superseded guards,
redirects, and loader results are ignored; their underlying requests are not
aborted, so loaders must still manage their own side effects.

```ts
import { pushRoute } from '@octane-xplat/ui'

// Both routes are registered; detail has an asynchronous loader.
pushRoute({ stack: 'root', name: 'detail', params: { id: 'coat' } })
pushRoute({ stack: 'root', name: 'settings', params: {} })
```

## Guard and document a route

A **guard** checks a condition before opening a screen, such as whether
someone is signed in. A **redirect** sends them to another destination,
such as a login screen. These checks do not replace server-side access
controls for private data.

Route files can export behavior alongside their screen. This fragment assumes
the app supplies `context.user` and registers a `login` destination; Xplat
does not populate authentication context automatically:

```ts
import { redirect } from '@octane-xplat/ui'

import type { BeforeLoadArgs } from '@octane-xplat/ui'

export async function beforeLoad({ params, context }: BeforeLoadArgs) {
	if (!context.user) {
		redirect({ stack: 'root', name: 'login', params: {} })
	}

	return { accountId: params.id }
}

export const head = (params: Record<string, string>) => ({
	title: `Account ${params.id}`,
	meta: { description: 'Account details' },
})
```

`beforeLoad` is awaited before a `pushRoute` or `NavLink` commits. Its
returned object merges into the route's `context`, `useRoute()` value, and
screen props. Use the exported
`redirect(route)` helper to short-circuit the attempted destination; the
target guard still runs. Web commits the redirect through history; native
commits it through the target `Frame.navigate` path rather than recursively
calling the public `pushRoute` API. A rejected guard logs and leaves the
current destination unchanged.

```ts
import { redirect } from '@octane-xplat/ui'
import type { BeforeLoadArgs } from '@octane-xplat/ui'

// Route-file export; the app supplies user in the navigation context.
export function beforeLoad({ context }: BeforeLoadArgs) {
	if (!context.user) redirect({ stack: 'root', name: 'login', params: {} })
	return { checked: true }
}
```

`NavLink` therefore runs guards on both platforms. `Link`, plain browser
anchors, refresh, and browser back/forward are URL navigation that does not
pass through `pushRoute`; apps that need a boot-time policy should apply it
in their deep-link/bootstrap layer.

```tsx
import { NavLink, Link } from '@octane-xplat/ui'

export function Example() {
	return (
		<>
			<NavLink route={{ stack: 'root', name: 'settings', params: {} }}>Settings</NavLink>
			<Link href="https://example.com">Website</Link>
		</>
	)
}
```

`head` is either a static object or a synchronous function of route params.
Web sets `document.title` and creates `meta[name]` tags. Native applies the
title to a pushed `Page`'s action bar; meta entries are inert there. Native
modal roots do not expose a `Page` action-bar surface, so modal meta is inert
on native.

```ts
// In a registered route file.
export const head = (params: Record<string, string>) => ({
	title: `Item ${params.id}`,
	meta: { description: 'Packing item details' },
})
```

Screens can use `useCanGoBack(stack?)` to render a back affordance. The
framework also supplies `_pushed` on route screen props (and `_stack` for
named native stacks) for code that needs a prop-level seam. On web this is
based on in-app history depth, not the browser's unrelated history entries.

```tsx
import { Pressable, Text, useCanGoBack, popRoute } from '@octane-xplat/ui'

export function Example() {
	const canBack = useCanGoBack('root')
	return (
		<Pressable disabled={!canBack} onPress={() => popRoute('root')}>
			<Text>Back</Text>
		</Pressable>
	)
}
```

Android hardware back is framework-owned — nothing to wire. Once screens or
stacks register, the press dismisses the newest open modal, then pops the
root stack when a pushed page covers the shell, then the most recently used
named stack; at the base of everything the press falls through to the
system. Apps that need first dibs (close a drawer, confirm a discard) call
`useBackInterceptor(fn)` inside a screen or `addBackInterceptor(fn)` at
module scope — interceptors run most-recent-first and returning `true`
consumes the press before the stack pop. On web there is nothing to
intercept: browser back is URL history, so `addBackInterceptor` is a no-op
that warns once.

```tsx
import { useBackInterceptor, Text, Pressable } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [drawerOpen, setDrawerOpen] = useState(false)
	useBackInterceptor(() => {
		if (!drawerOpen) return false
		setDrawerOpen(false)
		return true
	})
	return (
		<Pressable onPress={() => setDrawerOpen(true)}>
			<Text>{drawerOpen ? 'Drawer open' : 'Open drawer'}</Text>
		</Pressable>
	)
}
```

Web history is one linear stack. `popRoute(stack)` accepts `stack` for API
symmetry but always pops the browser's current entry; it cannot remove a
non-top named-stack entry without rewriting browser history. Prepared guard context
and loader results are retained during back/forward traversal within the same
document, including modal entries. Calling `addRoutes` does not discard this
prepared state. A fresh document parses its URL again; it does not restore
non-URL screen state or re-run `beforeLoad` automatically. Direct URLs run
the route loader without adding a history entry — the screen mounts with
`pending: true` until the result lands — including the generated loader for
baked data and Markdown.

```ts
import { popRoute } from '@octane-xplat/ui'

// In a Back action; web pops the current browser entry.
popRoute('root')
```

## Keep scroll where the reader left it

Web keeps a scroll position for every history entry. Pushing a route starts
the new screen at the top — or scrolls to the element whose `id` matches
`hash` when the pushed route carries one. Back and forward restore the
position saved for that exact entry, so two pushes sharing a URL keep
independent positions; a modal push overlays the page without moving the
content beneath it.

```ts
// Push detail scrolled to its specs section — URL: /detail?id=x#specs
pushRoute({ stack: 'root', name: 'detail', params: { id: 'x' }, hash: 'specs' })
```

The saved position is keyed by the history entry, not the URL. An entry the
runtime never committed — a URL the browser restored before routes
registered — falls back to the URL itself (path, query, and hash), which
still separates a deep link's anchor from the page top. The web leaf sets
`history.scrollRestoration = 'manual'` at module load so one owner settles
each navigation. Direct URLs and deep links keep their `#fragment` —
`route.hash` survives `matchUrl`, so an anchor lands on its element once the
screen mounts.

Native needs no code here: a pushed page keeps the page beneath it alive,
and dismissing a modal reveals the same view tree — retained lists resume
where the reader left them (decision #98). That claim is source-verified,
not device-verified; see [navigation limits](../verify/known-limits.md#navigation).
`route.hash` is a web-only field native ignores.

Generated `RouteParams` keeps normal route APIs scalar (`string`) for stable
URLs. The low-level `Route` type remains open for compatibility: if an object
or array is passed directly, web JSON-encodes it with a warning and decodes it
again on matching. Prefer the generated scalar API for shareable routes.

```ts
import { pushRoute } from '@octane-xplat/ui'

// Prefer scalar params for a registered item route.
pushRoute({ stack: 'root', name: 'detail', params: { id: 'coat' } })
```

## Handle incoming links

A **deep link** opens a particular screen from outside the app, such as a
shared link to a trip. This needs route registration and phone configuration;
follow this section when you are ready to add incoming links.

`pushDeepLink(url)` turns an incoming URL — `https://…` or an app scheme like
`textcoral://post/5` — into the same route a link would have navigated to.
Register routes before dispatching incoming links. On native, subscribe before
`Application.run` so launch events are captured, but consume the launch URL only
after the navigation host loads. This bootstrap fragment queues links until
NativeScript reports its first displayed frame:

```ts
import { Application } from '@nativescript/core'
import { pushDeepLink } from '@octane-xplat/ui'
import { onDeepLink, consumeInitialUrl } from '@octane-xplat/platform'

let ready = false
const pending: string[] = []
const unsubscribe = onDeepLink((url) => {
	if (ready) pushDeepLink(url)
	else pending.push(url)
})
Application.on(Application.displayedEvent, () => {
	if (ready) return
	ready = true
	const boot = consumeInitialUrl()
	if (boot) pushDeepLink(boot)
	for (const url of pending.splice(0)) pushDeepLink(url)
})
// Then Application.run({ create: ... }) with your Frame-root shell.
```

Keep `unsubscribe` for teardown. The maintained harness wiring in
`packages/app/src/route-links.mobile.ts` waits for a loaded root Page instead.
Browser boot is already URL-driven: do not push its initial URL again.
A URL carried by the native launch event belongs to `consumeInitialUrl`;
other URL events go to the listener. Queue both paths while the host loads,
since iOS may deliver its cold URL through `openUrl`.
Android deduplicates a new-intent/resume pair by intent identity. A later intent
with the same URL is a new navigation request.

```ts
import { onDeepLink } from '@octane-xplat/platform'
import { pushDeepLink } from '@octane-xplat/ui'

// Native bootstrap, after the route host is ready.
const unsubscribe = onDeepLink((url) => {
	pushDeepLink(url)
})
export function disposeLinks() {
	unsubscribe()
}
```

### Register a custom scheme

For a scheme named `xplatnav`, add this activity filter to
`App_Resources/Android/src/main/AndroidManifest.xml`, inside the app's
`com.tns.NativeScriptActivity` (use `android:launchMode="singleTask"`):

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="xplatnav" />
</intent-filter>
```

Add this entry inside the root dictionary of `App_Resources/iOS/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array><dict>
  <key>CFBundleURLSchemes</key>
  <array><string>xplatnav</string></array>
</dict></array>
```

Rebuild and install after changing either file. This registers a custom scheme;
HTTPS Universal Links/App Links also need domain association and are outside
this recipe.

### Reproduce launch and fallback behavior

Use a route named `nav/:id`. The isolated release harness registers it and
uses app ID `org.nativescript.xplat.navigation`. With that app stopped, opening
the first URL below is a cold launch. Keep it running for the second request;
send the warm request twice and verify two pushes, one per OS delivery.
Replace `DEVICE_ID` with the selected simulator UUID or Android serial:

```sh
xcrun simctl openurl DEVICE_ID 'xplatnav://nav/cold'
xcrun simctl openurl DEVICE_ID 'xplatnav://nav/warm'
adb -s DEVICE_ID shell am start -W -a android.intent.action.VIEW \
  -d 'xplatnav://nav/cold' \
  -n org.nativescript.xplat.navigation/com.tns.NativeScriptActivity
adb -s DEVICE_ID shell am start -W -a android.intent.action.VIEW \
  -d 'xplatnav://nav/warm' \
  -n org.nativescript.xplat.navigation/com.tns.NativeScriptActivity
```

Also send `xplatnav://missing` and `xplatnav://nav/%` using the same command.
`pushDeepLink` rejects an unregistered screen or malformed percent encoding,
returns `false`, and warns; the current screen stays. Show an app-owned not-found
message when it returns `false`. A `true` result means a match was dispatched,
not that an asynchronous guard or navigation completed. On browser direct load,
a malformed encoded path falls back to the shell; an unmatched literal route
is left to the outlet's not-found UI. Guards are not a blanket filter for
browser bootstrap or history traversal.

```ts
import { pushDeepLink, showToast } from '@octane-xplat/ui'

// Called after route registration and host readiness.
if (!pushDeepLink('xplatnav://missing')) {
	showToast({ body: 'This page could not be found.' })
}
```

The [release navigation checks](../verify/navigation-checks.md) exercise these commands
without images. Coverage in this guide and actual per-target results are
recorded separately; scheme registration alone is not runtime verification.

## Choose a stack

Use the root stack for the main app flow. Use a named stack for independent
flows such as tabs, where each tab should remember its own screen. Keep modal
content separate from ordinary back-stack navigation.

Native deep links resolve against the same route manifest. `openWindow({data})`
opens another NativeScript window; the app provides
`Application.setWindowContentResolver()` to render that window's root.

```ts
import { openWindow } from '@octane-xplat/ui'

// Native app bootstrap must install its window content resolver first.
openWindow({ data: { listId: 'trip' } })
```

The [navigation notes](../notes/navigation-notes.md) explain native containers, modal
roots, deep links, Android tab-stack limits, and the platform-specific
tradeoffs.
