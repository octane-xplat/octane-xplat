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
matching navigation stack.

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
`xplat routes` regenerates `routes.gen.ts` so route names and params stay
typed.

## Present a route modally

Suffix the file with `+modal`, or pass `presentation: 'modal'` on the push.
Native shows it as its own modal root over the current page; web overlays it
while keeping the URL underneath. Back — or the `close` prop the screen
receives — dismisses it. `+fade` pushes with a fade transition.

A route file can also export `loader(params)` — it runs when the route is
pushed so the screen's queries start early. It is a prefetch, not a data
source: the screen still reads its own `query$`.

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

## Choose a stack

Use the root stack for the main app flow. Use a named stack for independent
flows such as tabs, where each tab should remember its own screen. Keep modal
content separate from ordinary back-stack navigation.

The [navigation notes](navigation-notes.md) explain native containers, modal
roots, deep links, and the platform-specific tradeoffs.
