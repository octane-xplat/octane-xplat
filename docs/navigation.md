# Moving between screens

> Give every destination a name and let the same screen map to a browser URL
> or a native navigation stack.

Start with the journey: open a trip, inspect its packing list, and return
without losing your place. Ask your agent to verify the browser URL and the
native back action for that flow. Shared destinations can use different
platform shells; check [navigation limits](known-limits.md#navigation) for the
targets you need.

## A route is a destination

Routes have three pieces:

```ts
pushRoute({
	stack: 'root',
	name: 'settings',
	params: {},
})
```

The `name` identifies the screen. `params` carries the small amount of data
needed to open it. `stack` is `root` for the main flow or a named stack such
as a tab's inner navigation.

On the web, the route becomes a real URL, so refresh, back, bookmarks, and
shared links keep working. On native, the same route pushes a screen into the
matching navigation stack.

## Let the route dir name your routes

Files under `app/` become routes automatically — the file path is the name:

```
app/detail.tsrx        → 'detail'
app/demo/[id].tsrx     → 'demo/:id'      (params land as screen props —
                                         feed them to a screen-scoped query;
                                         see [data](data.md#module-scope-vs-screen-scope))
app/settings.web.tsrx  → 'settings'      (web only — suffixes still apply)
app/about+modal.tsrx   → 'about'         (modal presentation)
app/chat/_layout.tsrx  → wraps every 'chat/*' route
```

`deriveRouteManifest` turns the glob into the table and `registerRoutes`
registers it once at boot — there is no per-screen wiring to maintain.
`xplat routes` (run automatically by `xplat dev`, `xplat build`, and
`xplat typecheck`) emits `routes.gen.types.ts` +
`routes.gen.web.ts` / `routes.gen.mobile.ts` — the typed names and the
platform-specific globs + registration all live in generated code;
`routes.ts` just re-exports. The generated `RouteName` and `RouteParams`
types describe every route name and its param shape, so a typed wrapper
around `pushRoute`/`Link` can name-check destinations.

## Register routes from data

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
`'docs/[slug]'`) declares a param, a trailing `index` or `''` names the
root, and `presentation` replaces the `+modal`/`+fade` suffix. `screen` is
the component itself, not a module; `loader`, `beforeLoad`, and `head` work
exactly like the route-file exports. `layouts` keys are path prefixes that
wrap every route beneath them, the same job `_layout.tsrx` does.

Registered routes are indistinguishable from file routes — they push into
named stacks, resolve through `screenFor` outlets, match deep links, and
substitute params into web URLs. `addRoutes` layers its manifest over the
file-derived one at any point (it survives `routes.gen` re-registration
under HMR); to compose before registration instead, pass
`registerRoutes(mergeRouteManifests(routes, dynamic))`.

**Precedence is registration order.** On a same-name collision the later
manifest wins and a console warning names both sources — deliberate
overrides layer on top, accidental ones are loud. Merge the dynamic
manifest first (`mergeRouteManifests(dynamic, routes)`) if file routes
should win.

Programmatic names are not in the generated `RouteName`/`RouteParams`
types — codegen can't see runtime data. Navigate them with the low-level
`Route` shape (`pushRoute({stack, name, params})`, `NavLink route={...}`),
or union your own names into an app-side wrapper. The generated
`routes.screens` snapshot likewise covers file routes only — resolve
screens through `screenFor(name)`, which reads the merged registry.

## Present a route modally

Suffix the file with `+modal`, or pass `presentation: 'modal'` on the push.
Native shows it as its own modal root over the current page; web overlays it
while keeping the URL underneath. Back — or the `close` prop the screen
receives — dismisses it. `+fade` pushes with a fade transition. A modal
screen mounts its own root, so component context does not reach it — pass
values through params or a shared store.

A route file can also export `loader(params)` — it runs when the route is
pushed, before the screen commits. Its awaited result lands on the screen as
a `data` prop; a rejected loader lands as `error`.

## Guard and document a route

Route files can export behavior alongside their screen:

```ts
import { redirect } from '@octane-xplat/ui'

export async function beforeLoad({ params, context }) {
	if (!context.user) {
		redirect({ stack: 'root', name: 'login', params: {} })
	}

	return { accountId: params.id }
}

export const head = (params) => ({
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

`NavLink` therefore runs guards on both platforms. `Link`, plain browser
anchors, refresh, and browser back/forward are URL navigation that does not
pass through `pushRoute`; apps that need a boot-time policy should apply it
in their deep-link/bootstrap layer.

`head` is either a static object or a synchronous function of route params.
Web sets `document.title` and creates `meta[name]` tags. Native applies the
title to a pushed `Page`'s action bar; meta entries are inert there. Native
modal roots do not expose a `Page` action-bar surface, so modal meta is inert
on native.

Screens can use `useCanGoBack(stack?)` to render a back affordance. The
framework also supplies `_pushed` on route screen props (and `_stack` for
named native stacks) for code that needs a prop-level seam. On web this is
based on in-app history depth, not the browser's unrelated history entries.

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

Web history is one linear stack. `popRoute(stack)` accepts `stack` for API
symmetry but always pops the browser's current entry; it cannot remove a
non-top named-stack entry without rewriting browser history.

Generated `RouteParams` keeps normal route APIs scalar (`string`) for stable
URLs. The low-level `Route` type remains open for compatibility: if an object
or array is passed directly, web JSON-encodes it with a warning and decodes it
again on matching. Prefer the generated scalar API for shareable routes.

## Handle incoming links

`pushDeepLink(url)` turns an incoming URL — `https://…` or an app scheme like
`textcoral://post/5` — into the same route a link would have navigated to.
Wire the platform listeners once at boot:

```ts
import { pushDeepLink } from '@octane-xplat/ui'
import { onDeepLink, consumeInitialUrl } from '@octane-xplat/platform'

onDeepLink(pushDeepLink)
const boot = consumeInitialUrl() // the URL that launched the app
if (boot) pushDeepLink(boot)
```

## Keep browser links real

Use `NavLink` for an in-app destination the user might copy or open in a new
tab — on web it renders a real `<a href>` whose plain click drives
`pushRoute` while modified clicks keep native browser behavior; on native it
navigates the same route. Use `Link` for an outbound URL — a real anchor on
web, the OS opener on native. Use `pushRoute` for an in-app action that is
not naturally a link.

```tsx
import { Link, NavLink, Row } from '@octane-xplat/ui'

export function Footer() {
	return (
		<Row>
			<NavLink route={{ stack: 'root', name: 'settings', params: {} }}>
				Settings
			</NavLink>
			<Link href="https://example.com">Website</Link>
		</Row>
	)
}
```

For a component that must observe the current destination, use `useRoute` on
the stack it owns. A tab can therefore keep its own history without taking
over the whole app.

## Choose a stack

Use the root stack for the main app flow. Use a named stack for independent
flows such as tabs, where each tab should remember its own screen. Keep modal
content separate from ordinary back-stack navigation.

Native deep links resolve against the same route manifest. `openWindow({data})`
opens another NativeScript window; the app provides
`Application.setWindowContentResolver()` to render that window's root.

The [navigation notes](navigation-notes.md) explain native containers, modal
roots, deep links, Android tab-stack limits, and the platform-specific
tradeoffs.
