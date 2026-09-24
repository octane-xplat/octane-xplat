# Navigation

The framework owns the API; each platform provides the mechanism.
`pushRoute`/`popRoute`/`useRoute` are real on **both** targets — web is a
URL store over history, native drives `Frame`/`Page` stacks.

```ts
import { pushRoute, popRoute, useRoute, registerScreens } from '@octane-xplat/ui';
// app-level seam (packages/app platform/nav) adds typed names:
navigate(name, params?, { into?: 'demos' });
goBack({ into?: 'demos' });
```

- `pushRoute({ stack, name, params })` — `'root'` is a full-screen push
  covering the tab shell on both targets. A named stack is a parallel
  stack: native pushes inside the pane's own `Frame` (tab bar stays),
  web renders the screen in the pane's route outlet.
- `popRoute(stack?)` — native pops that frame's top page (quiet no-op at
  the base page). Web is one linear history → `history.back()`; the
  `stack` arg is accepted for parity and ignored.
- `useRoute(stack)` — the current route for a stack, `null` at its base.
  Native reads the route stamped on the frame's `currentPage` and updates
  on push AND pop (`navigatedTo`); web reads the URL store.
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
3. **Named stacks** — `TabSpec.stack` on `<Tabs>` registers the pane's
   Frame automatically. Custom shells call `registerStack(name, frame)`.

Every drop warns loudly (once per key, dev and release): unregistered
stack, unknown screen name, non-Frame root, Android named-stack push.
Silent no-ops are how apps ship a default route on native while working
fine on web — that failure mode is gone.

## Route shapes — what actually pushes today

| Shape | Web | iOS | Android |
|---|---|---|---|
| `{stack:'root'}` push | ✓ `/<name>?params` covers shell | ✓ verified | ✓ verified |
| named stack (`stack:'demos'`) | ✓ `/demos/<name>?params` in pane | ✓ 48/48 sweep | ✗ upstream #11444 — mounts but `backStack`/`goBack` dead; **loud warn on push** |
| params | query-string scalars only — objects degrade (`[object Object]`) | real objects as props | real objects as props |
| `useRoute`/`routeFor` | ✓ | ✓ stamped on pushed page | ✓ root; named-stack reads stay stale (same bug) |
| `popRoute` | ✓ (`history.back`) | ✓ | ✓ root; named-stack `goBack` no-ops upstream |
| deep link at boot | ✓ `currentRoute()` seeds tab | n/a | n/a |

Keep params to scalars for parity — the web leaf serializes into the URL.

## Screen registry

`packages/app/src/screens.ts` — name → component table shared by both
targets, registered via `registerScreens(screens)`. Register a screen
there; params arrive as props (native: pushed root's props; web: query
params serialized into the URL).

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

- `pushRoute` → `pushState` — URLs like `/demos/demo?id=counter`
  (`/<stack>/<name>?params`; `/<name>?params` for root).
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

## Modal/sheet roots

Modals and sheets are NOT routes — separate roots via `Modal` component /
`openSheet(Component, props)` / `openOverlay()`. See `overlays.md`.
