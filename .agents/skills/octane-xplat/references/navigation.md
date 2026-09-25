# Navigation

The framework owns the API; each platform provides the mechanism.
`pushRoute`/`popRoute`/`useRoute` are real on **both** targets — web is a
URL store over history; iOS uses `Frame`/`Page` stacks and Android swaps
router-owned named-route history into the active tab pane.

```ts
import { pushRoute, popRoute, useRoute, registerScreens } from '@octane-xplat/ui';
// app-level seam (packages/app platform/nav) adds typed names:
navigate(name, params?, { into?: 'demos' });
goBack({ into?: 'demos' });
```

- `pushRoute({ stack, name, params })` — `'root'` is a full-screen push
  covering the tab shell on both targets. A named stack is a parallel
  stack: iOS pushes inside the pane's `Frame`, Android swaps the pane while
  keeping a per-tab route array, and web renders the route outlet.
- `popRoute(stack?)` — native pops the selected Frame or Android route
  array (quiet no-op at the base). Web is one linear history →
  `history.back()`; the `stack` arg is accepted for parity and ignored.
- `useRoute(stack)` — the current route for a stack, `null` at its base.
  Native reads the frame's `currentPage` on iOS and router state on Android;
  web reads the URL store.
- Pushed screens get `_stack` injected into props on named-stack pushes —
  call `popRoute(props._stack)` / `goBack({ into: props._stack })` to pop
  the stack that pushed you. Not injected on web (params = query string).

## What must be registered

1. **Screens** — `registerScreens({ name: Component })` once, from the
   shared screens module (`packages/app/src/screens.ts` does it at module
   scope). Native `pushRoute` resolves `route.name` through it; web
   outlets use it when `Tabs` has no `resolveScreen` prop.
2. **`'root'`** — nothing. When the app boots a `Frame` window root (the
   standard `Application.run` shape), `getStack('root')` auto-resolves
   `Application.getRootView()`. `registerStack('root', frame)` remains as
   an override. A non-Frame root can't host pushes — the push warns and
   drops.
3. **Named stacks** — iOS `TabSpec.stack` on `<Tabs>` registers the pane's
   Frame automatically. Android uses router-owned route arrays and swaps
   the active screen in a fixed-row tab shell; custom Android outlets can
   subscribe with `useRoute(stack)`.

Invalid targets warn loudly (once per key, dev and release): unregistered
root stack, unknown screen name, or non-Frame root.

## Route shapes — what actually pushes today

| Shape | Web | iOS | Android |
|---|---|---|---|
| `{stack:'root'}` push | ✓ `/<path>?params` covers shell | ✓ verified | ✓ verified |
| named stack (`stack:'demos'`) | ✓ `/demos/<path>` in pane | ✓ 48/48 sweep | fixed tab row + router-owned swapped pane; runtime validation pending |
| params | `[param]` segments → real path (`/demo/counter`); extras → query-string scalars — objects degrade (`[object Object]`) | real objects as props | real objects as props |
| `useRoute`/`routeFor` | ✓ | ✓ stamped on pushed page | ✓ root; named tabs subscribe to router state |
| `popRoute` | ✓ (`history.back`) | ✓ | ✓ root + router-owned named-stack pop |
| deep link at boot | ✓ `currentRoute()` seeds tab | n/a | n/a |

Keep params to scalars for parity — the web leaf serializes into the URL.

## Screen registry — the `app/` route dir

`packages/app/src/app/` — every `.tsrx`/`.tsx` file is a route, derived by
`import.meta.glob` in platform manifest leaves (`route-manifest.web.ts`
excludes `*.native/ios/android.*`; `route-manifest.native.ts` excludes
`*.web.*` and prefers the running OS via `Device.os`).
`deriveRouteManifest(files, prefer)` → `{screens, routes, layouts}`;
`registerRoutes(manifest)` in `routes.ts` registers both.

- `app/demo/[id].tsrx` → route `demo/:id` — `navigate('demo/:id', {id})`;
  `[param]` → `:param`. `app/foo/index.tsrx` → `foo`.
- `app/_layout.tsrx` → `layouts['']` — the shell the entry renders
  (`export const App = routes.layouts['']` in `index.ts`). Not a route.
- `app/settings.web.tsrx` → web-only route (skipped by the native glob).
- Component pick: `default` → `screen` → single function export.
- Params arrive as props (native: pushed root's props; web: path segments
  + query). Route names are `string` — literal typing awaits routes.d.ts
  codegen.

Adding a route = adding a file; no table edits.

## Native model

- A `TabSpec` with `stack: 'demos'` hosts a `Frame` inside that tab —
  pushes into `'demos'` render inside the pane (tab bar visible).
- Pushed `Page`s host their own Octane root — never shared context with
  the presenter (decision #9).
- **`Frame.topmost()` is unreliable once nested frames exist** (Android:
  innermost). `getStack('root')` resolves the window root Frame — never
  `topmost()`.
- `wireHardwareBack()` at boot maps Android hardware back → ordered pop:
  root stack first (a pushed page covers the shell), then the most
  recently targeted named stack, then any named stack with entries.
- Frame lifecycle traps + the nested-stack bug: `navigation/native-frames.md`.

## Web model

`route.web.ts` — module-scope route store over real history:

- `pushRoute` → `pushState` — manifest routes write real paths with
  `:param` substitution (`/demos/demo/counter`); params not in the path
  fall back to the query string (`/detail?from=home`). Names outside the
  manifest keep `/<stack>/<name>?params`.
- `popRoute` → `history.back()`; `popstate` resyncs the store.
- `Tabs` is the outlet: `useRoute('root')` covers the shell when a root
  route is active; `useRoute(activeTab.stack)` renders a pushed screen in
  the pane via `resolveScreen` prop — or the `registerScreens` table when
  the prop is absent.
- Deep links work: `currentRoute()` seeds the initial tab index at boot
  (Vite preview SPA-fallbacks unknown paths to index.html).

## Hook rules in outlets

`useRoute(stack)` calls must be unconditional — subscribe with
`props.tabs[active]?.stack ?? ''` rather than conditionally (conditional
hook calls break the compiler's slotting).

## Modal routes and modal primitives

Route files may use `+modal` or `pushRoute({ presentation: 'modal', ... })`.
Native presents a separate root and web overlays the previous history entry.
These routes pass data as props because context does not cross roots.

The `Modal`, `openSheet(Component, props)`, and `openOverlay()` primitives
remain separate from route navigation; use them for transient UI without a
shareable destination. See `overlays.md`.
