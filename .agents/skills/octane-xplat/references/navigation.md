# Navigation

The framework owns the API; each platform provides the mechanism.

```ts
import { navigate, goBack } from '@xplat/app';   // barrel — see platform-leaves.md

navigate(name, params?, { into?: 'demos' });
goBack({ into?: 'demos' });
```

- Without `into` → the **root stack** (full-screen push; covers the tab
  shell on both targets).
- With `into` → a **named parallel stack** (native: the pane's own `Frame`;
  web: the pane's route outlet — tab bar stays).
- Native screens get `_stack` injected in props — a pushed screen calls
  `goBack({ into: props._stack })` to pop its own stack.

## Screen registry

`packages/app/src/screens.ts` — name → component table shared by both
nav leaves. Register a screen there; params arrive as props
(native: pushed root's props; web: query params serialized into the URL).

## Native model

- App boot registers the entry frame as `'root'` (`registerStack` in
  `apps/native/src/index.ts`).
- A `TabSpec` with `stack: 'demos'` hosts a `Frame` inside that tab —
  pushes into `'demos'` render inside the pane (tab bar visible).
- Pushed `Page`s host their own Octane root — never shared context with
  the presenter (decision #9).
- **`Frame.topmost()` is unreliable once nested frames exist** (Android:
  innermost). Always `getStack('root')`/named lookups — never `topmost()`.
- `wireHardwareBack()` at boot maps Android hardware back → ordered pop:
  root stack first (a pushed page covers the shell), then the most
  recently targeted named stack, then any named stack with entries.
- Frame lifecycle traps + the nested-stack bug: `navigation/native-frames.md`.

## Web model

`route.web.ts` — module-scope route store over real history:

- `navigate` → `pushState` — URLs like `/demos/demo?id=counter`
  (`/<stack>/<name>?params`; `/<name>?params` for root).
- `goBack` → `history.back()`; `popstate` resyncs the store.
- `Tabs` is the outlet: `useRoute('root')` covers the shell when a root
  route is active; `useRoute(activeTab.stack)` renders a pushed screen in
  the pane via `resolveScreen(name, params)`.
- Deep links work: `currentRoute()` seeds the initial tab index at boot
  (Vite preview SPA-fallbacks unknown paths to index.html).
- `route.native.ts` — no-op twin for import parity (never call it for real
  navigation on native).

## Hook rules in outlets

`useRoute(stack)` calls must be unconditional — subscribe with
`props.tabs[active]?.stack ?? ''` rather than conditionally (conditional
hook calls break the compiler's slotting).

## Modal/sheet roots

Modals and sheets are NOT routes — separate roots via `Modal` component /
`openSheet(Component, props)` / `openOverlay()`. See `overlays.md`.
