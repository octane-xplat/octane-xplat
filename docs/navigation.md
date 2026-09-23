# Navigation

> The largest app-architecture seam. Web = URL-driven router; native =
> `Frame`/`Page` stacks, `TabView`, drawers, modals-as-roots, multi-window.
> Design follows One (prior-art/one.md): **shared route table + shared screens,
> per-platform shells.**
>
> **Owns:** #2 navigation contract · **Status:** mapped; Q6/Q14 resolved
> (boundaries = `@try`; HMR = self-accepting modules, named exports stay
> convention) · **Blocks on:** none blocking · **Decisions:** #8, #9, #13, #19
> · **Validated by:** two shared screens + `Link` + `goBack` on both targets,
> then a modal route as second native root. **Lab (Exp 9, iOS):** Frame-root
> entry + `frame.navigate({create})` pushes a second `Page` hosting its own
> `createNativeScriptRoot` — per-page roots work. Shared code calls
> `platform/nav` (`.native.ts`/`.web.ts` suffix seam). Full push→`navigatedTo`→
> `backStack=1`→`goBack`→pop cycle asserted: `Detail screen` text read from the
> pushed page's own root. Transitions commit asynchronously — read `currentPage`
> only after the `navigatedTo` event, never at a fixed delay.
>
> **Lab (Exp 14, iOS):** `navigate(name, params)` over a shared `screens`
> registry — native resolves `screens[name]` inside `frame.navigate({create})`
> and passes `params` as the pushed root's props; `from=home` arrived as
> `props.from` on Detail. Web leaf serializes params into the hash URL.
>
> **Lab (app-surface, iOS):** the demo catalog now navigates like an app —
> each of 10 demos pushes `demo` (own Page + Octane root) via
> `navigate('demo', {id})`, `goBack` pops, and a module-scope store
> (`useSyncExternalStore`) proves state crosses roots reactively where
> context cannot (`Last opened` updates on the Gallery after pop). Same
> component mounts in a third root via `openSheet(renderFn)`. Findings:
> (a) `Frame.topmost().currentPage` flips ~500ms after `navigate` —
> transitions are async; probe/assert code must poll for settle, never
> read at a fixed offset (a transient 'Loading…' state can lapse
> mid-transition). (b) `onPress={fn}` passes the tap event — a
> parameterized entry like `openSheet(Component)` silently receives the
> event; wrap in an arrow at callback call sites.
>
> **Lab (parallel stacks, iOS):** `TabSpec.stack` hosts a `Frame` inside
> the pane — `navigate(name, params, {into})` pushes into it, the tab bar
> stays visible, `goBack({into})` pops; `_stack` is injected into pushed
> props so screens pop their own stack. Named frames register via
> `registerStack`; the app boot registers `'root'` as the default target
> (`Frame.topmost()` is ambiguous once nested frames exist). Verified:
> push→content→pop across all 10 demos inside the Demos tab (48/48).
> Findings: (a) `frame.navigate` before the frame is `loaded` leaves
> `_executingContext` stuck — iOS's delegate never fires `didShow` — and
> every later push queues forever: mount the pane's first page on
> `loaded`, not eagerly. (b) `TabViewItem`-hosted frames report
> `isLoaded=false` after tab-selection lifecycle churn (item views skip
> the normal parent/load path), which defers the whole nav queue —
> `navigate` re-arms with `callLoaded()` when the flag is stale.
>
> **Lab (parallel stacks, Android):** the app builds and runs on Android
> (35 emulator, JDK 17, AGP self-provisioned) — root-frame navigation,
> overlay/sheet/modal, gestures, and animation all pass. **Nested stacks
> do not work yet:** `TabViewItem`-hosted Frame pushes execute
> `NAVIGATE CORE` (the fragment transaction commits; the pushed page
> mounts — its `useEffect`/store write proves it), but `setCurrent` never
> runs — `TransitionListener.onTransitionEnd` doesn't propagate from the
> child `FragmentManager` under a `TabViewItem`. `currentPage`/`backStack`
> stay frozen, `goBack` no-ops (bare `GO BACK`, no CORE), and pages
> accumulate natively. `animated:false` does not rescue — the completion
> hook itself never fires, not merely the animation. Needs an upstream
> fix or a different shell construction (swap-style tabs, or a single
> frame with replace semantics). iOS remains green (48/48). Also on
> Android `Frame.topmost()` returns the *innermost* frame — all
> root-level reads must use the registered `'root'` stack. Smaller
> divergences seen once, uncharacterized: `dark class` absent, list
> cell-restore, `anim settled` timing, one `modal texts` flake.

## The contract

```
app/                          (shared route dir — concept, not yet implemented)
  _layout.tsrx                shell: Stack/Tabs/Drawer per platform
  index.tsrx                  screen component (shared)
  chat/[id].tsrx              dynamic param screen
  settings.web.tsrx           web-only route
  onboarding.native.tsrx      native-only route
```

- **Route files export screen components** — shared, vocabulary-free.
- **`_layout` files are the per-platform seam**: web layout renders
  `<Outlet/>`-style children inside URL router context; native layout renders
  `frame`/`tabview`/`drawer` shells. Same file name, different vocabulary —
  `_layout.web.tsrx` / `_layout.native.tsrx` splits are expected and fine.
- Render-mode suffixes (`page+ssr.tsrx`) are web semantics; ignored on native.
- **Named exports preferred** for route files — HMR accept boundaries are
  self-accepting modules either way (Q14 resolved); named exports stay as
  convention for clarity of non-component exports.

## Mapping

| Shared concept | Web | Native |
|---|---|---|
| route table | URL ↔ component (@octanejs/tanstack-router or thin file-router) | `Frame.navigate` stack, params passed as context |
| `<Link to="/chat/3">` | `<a href>` | `frame.navigate()` + params |
| `Stack` layout | history stack | `frame` pages (real nav transitions) |
| `Tabs` layout | tab bar + outlet | `tabview`/`tabviewitem` |
| `Drawer` layout | slide-over panel | `ui-drawer` w/ `hostSlot` mains/drawer |
| `Modal` route | overlay route (URL preserved) | `showModal` → **separate Octane root** |
| `useNavigate()`/`useParams()` | router hooks | facade over `Frame` API |
| back | popstate | `frame.goBack()` + Android `activityBackPressed` |
| deep link | URL load | `Application` lifecycle (openUrl/continueActivity) |
| windows/scenes | N/A | `setWindowContentResolver` per `NativeWindow` |

## Hard seams (decide consciously)

1. **Modal = root.** Shared `Modal`/`Sheet` route cannot share context with
   its presenter on native. Pass data via params + shared store module, never
   context. (See primitives.md.)
2. **Android hardware back** must feed the router — intercept
   `activityBackPressed`, map to history/frame pop, allow per-screen override
   (confirm-dialog flows).
3. **URL↔stack impedance**: web history is linear+addressable; Frame stacks
   are push/pop with per-entry transitions. Keep the shared API at
   `navigate(pathOrName, params)` + `goBack()`; don't try to share transition
   config beyond a small named set (`'push'|'modal'|'fade'`).
4. **Scroll/memory parity**: NS keeps pages' native views alive in the stack;
   web re-renders on pop. Scroll-restoration is per-platform.
5. **Typed routes**: codegen `routes.d.ts` from the `app/` dir (One precedent)
   once route files exist — params flow into `Link` and `useParams`.
6. **Data**: optional `export loader` per route (Remix/One style). Web:
   SSR/prefetch on nav; native: prefetch during transition, render into
   `@try`/`@pending` + `use()` (universal async boundaries — decision #19;
   `<Suspense>` doesn't exist there). Fold this in only after basic routing
   works.
7. **Modal routes = `Modal` primitive** (decisions #9/#22): a route marked
   modal renders through `showModal`→own root on native / portal+URL on web.
   Params cross as `params`; context does not. Same contract as the
   `ModalProps.component` API in primitives.md — the router treats
   `component: ScreenComponent` + `params` uniformly.

## What we are NOT doing

- Forcing URL semantics onto native. The route *table* is shared; web assigns
  paths, native assigns names+params. Deep links map onto the same table.
- Porting React Navigation. `Frame` is the native navigator; our `Stack`/
  `Tabs`/`Drawer` shells wrap it. That also means nav transitions are
  platform-native by default — correct behavior, not a gap.
- Sharing `_layout` internals across targets — they're expected split files.

## Build order (prototype path)

1. `Link` + `useNavigate` + two hand-written route tables (no codegen).
2. `Stack` (frame) + `Tabs` shells on native; URL router on web.
3. Platform-suffixed route files via the resolver.
4. Modal route as second native root.
5. Android back + deep link + typed routes codegen.
