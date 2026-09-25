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
