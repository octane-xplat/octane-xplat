# Navigation

The framework owns the API; each platform provides the mechanism.
`pushRoute`/`popRoute`/`useRoute` are real on **both** targets — web is a
URL store over history; native root routes use `Frame`/`Page` stacks. The
shared `Tabs` is a self-drawn row and one swapped pane. Platform-authentic
`UITabBar`/`BottomNavigationView` components live in the native subpaths.

```ts
import { pushRoute, popRoute, useRoute, registerScreens } from '@octane-xplat/ui';
// app-level seam (packages/app platform/nav) adds typed names:
navigate(name, params?, { into?: 'demos' });
goBack({ into?: 'demos' });
```

- `pushRoute({ stack, name, params })` — `'root'` is a full-screen push
  covering the tab shell on both targets. Web renders named routes in the
  tab outlet. iOS uses a named `Frame` only when one is registered (the
  platform `UITabBar` does this; shared `Tabs` does not). Android has a
  router-owned swap-pane implementation, but consult the canonical limit
  before relying on it (NativeScript#11444).
- `popRoute(stack?)` — native pops the selected registered `Frame` or
  Android route array (quiet no-op at the base). Web is one linear history →
  `history.back()`; the `stack` arg is accepted for parity and ignored.
- `useRoute(stack)` — the current route for a stack, `null` at its base.
  Native reads the registered frame's `currentPage` on iOS and router state on Android;
  web reads the URL store.
- Pushed native screens get `_stack` injected into props on named-stack
  pushes — call `popRoute(props._stack)` / `goBack({ into: props._stack })`
  to pop the stack that pushed you. Web route params are URL-backed.

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
3. **Named stacks** — `UITabBar` from `@octane-xplat/ui/ios` registers a
   `Frame` for each stacked tab. The shared `Tabs` does not register Frames;
   Android stores named routes in router-owned arrays and swaps the active
   pane. Android support remains unverified per the canonical known-limits
   guide.

Invalid targets warn loudly (once per key, dev and release): unregistered
root stack, unknown screen name, or non-Frame root.

## Route shapes — what actually pushes today

| Shape                         | Web                                                                                                                   | iOS                      | Android                                                               |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------- |
| `{stack:'root'}` push         | ✓ `/<path>?params` covers shell                                                                                       | ✓ verified               | ✓ verified                                                            |
| named stack (`stack:'demos'`) | ✓ `/demos/<path>` in pane                                                                                             | registered `UITabBar` Frame; shared `Tabs` unverified | swap-pane code exists; unverified per known-limits |
| params                        | `[param]` segments → real path (`/demo/counter`); extras → query-string scalars — objects degrade (`[object Object]`) | real objects as props    | real objects as props                                                 |
| `useRoute`/`routeFor`         | ✓                                                                                                                     | ✓ stamped on pushed page | ✓ root; named tabs subscribe to router state                          |
| `popRoute`                    | ✓ (`history.back`)                                                                                                    | ✓                        | ✓ root + router-owned named-stack pop                                 |
| deep link at boot             | ✓ `currentRoute()` seeds tab                                                                                          | n/a                      | n/a                                                                   |

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
  - query). Route names are `string` — literal typing awaits routes.d.ts
    codegen.

Adding a route = adding a file; no table edits.

## Native model

- Shared `Tabs` renders a fixed tab row and swaps one pane; it does not host
  a Frame. `UITabBar` from the iOS subpath uses NativeScript `TabView` and
  registers a `Frame` for each `TabSpec` with a stack.
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

The shared `Sheet`, `Overlay`, `Popover`, and `openSheet(Component, props)`
APIs remain separate from route navigation; use them for transient UI without
a shareable destination. For OS-authentic modal widgets, import
`UIModal`/`MaterialDialog` from the matching UI subpath. See `overlays.md`.
