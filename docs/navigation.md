# Moving between screens

> Give every destination a name and let the same screen map to a browser URL
> or a native navigation stack.

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
matching navigation stack. _Verified on the iOS simulator; Android
re-verification pending after the swap-pane fix._

## Let the route dir name your routes

Files under `app/` become routes automatically — the file path is the name:

```
app/detail.tsrx        → 'detail'
app/demo/[id].tsrx     → 'demo/:id'      (params land as screen props)
app/settings.web.tsrx  → 'settings'      (web only — suffixes still apply)
app/about+modal.tsrx   → 'about'         (modal presentation)
app/chat/_layout.tsrx  → wraps every 'chat/*' route
```

`deriveRouteManifest` turns the glob into the table and `registerRoutes`
registers it once at boot — there is no per-screen wiring to maintain.
`xplat routes` (run automatically by `xplat dev`/`xplat build`, or by the
`gen` script) emits `routes.gen.types.ts` + `routes.gen.web.ts` /
`routes.gen.native.ts` — the typed names and the platform-specific globs +
registration all live in generated code; `routes.ts` just re-exports.

## Present a route modally

Suffix the file with `+modal`, or pass `presentation: 'modal'` on the push.
Native shows it as its own modal root over the current page; web overlays it
while keeping the URL underneath. Back — or the `close` prop the screen
receives — dismisses it. `+fade` pushes with a fade transition.

A route file can also export `loader(params)` — it runs when the route is
pushed so the screen's queries start early. It is a prefetch, not a data
source: the screen still reads its own `query$`.

## Guard and document a route

Route files can export behavior alongside their screen:

```ts
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

`beforeLoad` is awaited before an imperative `pushRoute`, `NavLink`, or the
generated route `Link` commits. Its returned object merges into the route's
`context`, `useRoute()` value, and screen props. Use the exported
`redirect(route)` helper to short-circuit the attempted destination; the
target guard still runs. Web commits the redirect through history; native
commits it through the target `Frame.navigate` path rather than recursively
calling the public `pushRoute` API. A rejected guard logs and leaves the
current destination unchanged.

The framework `Link` and `NavLink` components therefore run guards on both
platforms. A plain browser anchor, refresh, or browser back/forward is URL
navigation and does not pass through `pushRoute`; apps that need a boot-time
policy should apply it in their deep-link/bootstrap layer.

`head` is either a static object or a synchronous function of route params.
Web sets `document.title` and creates `meta[name]` tags. Native applies the
title to a pushed `Page`'s action bar; meta entries are inert there. Native
modal roots do not expose a `Page` action-bar surface, so modal meta is inert
on native.

Screens can use `useCanGoBack(stack?)` to render a back affordance. The
framework also supplies `_pushed` on route screen props (and `_stack` for
named native stacks) for code that needs a prop-level seam. On web this is
based on in-app history depth, not the browser's unrelated history entries.

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
onDeepLink(pushDeepLink)
const boot = consumeInitialUrl() // the URL that launched the app
if (boot) pushDeepLink(boot)
```

## Keep browser links real

Use an anchor when the user is following a document or destination that should
be copyable and openable in a new tab. Use `pushRoute` for an in-app action
that is not naturally an anchor.

```tsx
<a href="/settings">Settings</a>
```

For a component that must observe the current destination, use `useRoute` on
the stack it owns. A tab can therefore keep its own history without taking
over the whole app.

## Add a file route

Route files under `app/` build the shared screen table. Bracketed filenames
declare path params:

```text
app/settings.tsrx       → settings
app/demo/[id].tsrx       → demo/:id
app/settings+modal.tsrx  → settings, presented as a modal
```

`xplat build` and `xplat typecheck` generate `src/routes.generated.d.ts`.
The app's `navigate`, `Link`, and `useParams<'demo/:id'>()` APIs use those
names and param shapes. A route may export `loader(params)`; its value is
passed to the screen as `data`, and a rejected loader as `error`.

Use `presentation: 'fade'` to select a fade push, or `presentation: 'modal'`
to present a modal at a call site. `+modal` and `+fade` set route-file
defaults. Browser history keeps the previous route beneath a web modal;
native presents a separate root, so pass values through params or a shared
store rather than component context.

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
