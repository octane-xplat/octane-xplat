# Navigation notes

> Detailed navigation record. Web = URL-driven router; native =
> `Frame`/`Page` stacks, `TabView`, drawers, modals-as-roots, multi-window.
> Design follows [One](https://one.dev): **shared route table + shared screens,
> per-platform shells.** Device evidence lives in the [lab log](#lab-log) at
> the end.
>
> **Owns:** #2 navigation contract · **Status:** implementation underway; route
> manifest and APIs typecheck, iOS navigation and demo sweeps pass, Android
> swap-pane route validation pending
> (boundaries = `@try`; HMR = self-accepting modules, named exports stay
> convention) · **Blocks on:** Android swap-pane runtime validation · **Decisions:** #8, #9, #13, #19
> · **Validated by:** web/native typecheck, UI web/native package builds, and
> iOS simulator navigation + demo sweeps. New modal routes and Android swap
> tabs still need runtime validation.

## The contract

```
app/                          (shared route dir — implemented)
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
  self-accepting modules either way ; named exports stay as
  convention for clarity of non-component exports.

### Mechanism (v1, implemented)

The dir is scanned by `import.meta.glob` in generated platform leaves —
`xplat routes` emits `routes.gen.web.ts` (excluding native-only files) and
`routes.gen.native.ts` (excluding web-only files and preferring the running
OS via `Device.os`), alongside `routes.gen.types.ts`.
`deriveRouteManifest(files, prefer)` (`packages/ui/src/route-table.ts`)
turns the module map into `{screens, routes, layouts, loaders}`:

- `demo/[id].tsrx` → route name `demo/:id` (`[param]` → `:param`);
  `foo/index.tsrx` → `foo`; trailing `index` drops.
- Platform suffix dedupe by `prefer` rank: web `['web']`, native
  `['ios'|'android','native']`; suffixes outside `prefer` are skipped.
- `_layout` files catalog into `layouts[dir]` (`''` = root) — the entry
  renders `routes.layouts['']` as the app shell; matching nested layouts
  wrap screens from outer directory to inner directory on both targets.
- `+modal` and `+fade` suffixes set a route's default presentation;
  `Route.presentation` overrides it for a particular navigation.
- A route may export `loader(params)`. Its result reaches the screen as
  `data`; a rejected loader reaches it as `error`. Loaders run on navigation
  and do not provide prefetch or a suspense boundary.
- Component pick rule: `default` export → `screen` export → one remaining
  function export (the `loader` export is excluded); anything else warns
  and skips.

`registerRoutes(manifest)` (ui, both leaves) registers screens + URL
patterns in one call — `packages/app/src/routes.ts` does it at module
scope. Web: `pushRoute` substitutes `:param` segments into the path
(`demo/:id` + `{id:'x'}` → `/demo/x`; leftover params → query) and
`parse()` matches incoming paths back to `{stack, name, params}` — named
stacks keep the `/<stack>/<path>` prefix. Native: `route.name` resolves
through `screens`, params and loader values land as props. `hrefFor(route)`
is the canonical path builder (Link's href). `xplat build` and
`xplat typecheck` refresh the generated route files from `app/`; generated
`RouteName` and `RouteParams` types constrain `navigate`, `Link`, and
`useParams<Name>()`.

## Mapping

| Shared concept | Web | Native |
|---|---|---|
| route table | URL ↔ component (@octanejs/tanstack-router or thin file-router) | `Frame.navigate` stack, params passed as context |
| `<Link to="/chat/3">` | `<a href>` | `frame.navigate()` + params |
| `Stack` layout | history stack | `frame` pages (real nav transitions) |
| `Tabs` layout | tab bar + outlet | iOS `TabView`; Android fixed tab row + swapped pane |
| `Drawer` layout | slide-over panel | `ui-drawer` w/ `hostSlot` mains/drawer |
| `Modal` route | overlay route (URL preserved) | `showModal` → **separate Octane root** |
| `useNavigate()`/`useParams()` | router hooks | facade over `Frame` API |
| back | popstate | `frame.goBack()` + Android `activityBackPressed` |
| deep link | URL load | `Application` lifecycle (openUrl/continueActivity) |
| windows/scenes | `window.open()` | `openWindow({data})`; app supplies NativeScript's window content resolver |

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
4. **Scroll/memory parity**: Native keeps page views alive in its stack.
   Web stores scroll offsets by history URL and restores them on back/forward;
   no native scroll work is needed while pages remain mounted.
5. **Typed routes**: `xplat routes` generates route names, params, and
   presentation types. `xplat build` and `xplat typecheck` refresh them too.
   Add a route file, then rerun one of those commands.
6. **Data**: a route `loader(params)` may return a value or promise. The
   screen receives `data` after resolution or `error` after rejection. This
   is the basic route-data seam; prefetch and async boundary integration
   remain open.
7. **Modal routes**: `+modal` or `presentation: 'modal'` opens a separate
   native root / web overlay while retaining the prior history entry. Params
   and loader values cross as props; context does not. `+fade` or
   `presentation: 'fade'` selects a fade transition; push remains the
   default.
8. **Windows**: `openWindow({data})` is the minimal cross-platform seam.
   Native app code must install `Application.setWindowContentResolver()` to
   render content for each new window; the framework does not own app roots.

## What we are NOT doing

- Forcing URL semantics onto native. The route *table* is shared; web assigns
  paths, native assigns names+params. Deep links map onto the same table.
- Porting React Navigation. `Frame` is the native navigator; our `Stack`/
  `Tabs`/`Drawer` shells wrap it. That also means nav transitions are
  platform-native by default — correct behavior, not a gap.
- Sharing `_layout` internals across targets — they're expected split files.

## Build order (prototype path)

1. ~~`Link` + `useNavigate` + two hand-written route tables (no codegen).~~
   done — tables superseded by the `app/` manifest (Mechanism above).
2. `Stack` (frame) + `Tabs` shells on native; URL router on web. — done.
3. ~~Platform-suffixed route files via the resolver.~~ done — glob
   manifests are the directory-level suffix seam.
4. Modal route as second native root — implemented; iOS simulator route sweep
   passed, additional target validation remains.
5. Android back + deep link + typed route codegen — wired. Deep-link behavior
   still needs target validation.
6. Nested layouts, basic loaders, fade transitions, web scroll restoration,
   and the minimal window-opening seam — implemented; loader boundary and
   multi-window resolver composition remain app-owned.
7. Android nested tab stacks — swap-style fallback implemented. Android
   stores named-stack routes in the router and swaps the active screen under
   a fixed tab row (no swipe gesture); tab screen-local state resets when
   switching away. NativeScript #11444 remains open for apps that use
   `Frame` inside `TabViewItem`. Runtime validation is pending.

## Lab log

> **Lab (route dir, web, 2026-09-24):** `packages/app/src/app/` holds the
> harness routes — `_layout.tsrx` (the Tabs shell, rendered via
> `layouts['']`), `detail.tsrx`, `demo/[id].tsrx`. `import.meta.glob` +
> `deriveRouteManifest` build the table; `registerRoutes` wires both
> leaves. Verified end-to-end on web (18/18 smoke): chip →
> `navigate('demo/:id',{id},{into:'demos'})` writes `/demos/demo/counter`
> (path param, not query), pushed screen renders in the pane, deep link
> `/demos/demo/watch` boots into the right tab + screen. `Link.web` now
> emits real `hrefFor` paths (the `#/` hash stub is gone). Native:
> typecheck clean; device run pending.

> **Lab (Exp 9, iOS):** Frame-root entry + `frame.navigate({create})` pushes a
> second `Page` hosting its own `createNativeScriptRoot` — per-page roots work.
> Shared code calls `platform/nav` (`.native.ts`/`.web.ts` suffix seam). Full
> push→`navigatedTo`→`backStack=1`→`goBack`→pop cycle asserted: `Detail screen`
> text read from the pushed page's own root.
>
> **Lab (Exp 14, iOS):** `navigate(name, params)` over a shared `screens`
> registry — native resolves `screens[name]` inside `frame.navigate({create})`
> and passes `params` as the pushed root's props; `from=home` arrived as
> `props.from` on Detail. Web leaf serializes params into real paths.
>
> **Lab (web router):** `nav.web` now drives a real URL router — the hash stub
> is gone. `route.web.ts` is a module-scope route store: `navigate` →
> `pushState` (`/demos/demo?id=counter`; `into` names the outlet), `goBack` →
> `history.back()`, `popstate` resyncs the store. `Tabs.web` is the outlet: a
> stack-named pane renders the pushed screen via the app's `resolveScreen`
> (tab bar stays — nested-route semantics for parallel stacks); a `root`-stack
> route covers the whole shell (root-push semantics). Deep links boot into the
> right tab + pushed screen (`currentRoute` seeds the initial tab index).
> Verified 14/14 in headless Chromium: real path write, pane render, popstate
> restore, `lastDemo` visible after pop, deep-link boot. ~~`route.native.ts` is
> a no-op twin~~ — superseded 2026-09-23: see "route.native goes real" below.
>
> **Lab (app-surface, iOS):** the demo catalog now navigates like an app —
> each of 10 demos pushes `demo` (own Page + Octane root) via
> `navigate('demo', {id})`, `goBack` pops, and a module-scope store
> (`useSyncExternalStore`) proves state crosses roots reactively where context
> cannot (`Last opened` updates on the Gallery after pop). Same component
> mounts in a third root via `openSheet(renderFn)`.

> [!NOTE]
> Transitions commit asynchronously — `Frame.topmost().currentPage` flips
> ~500ms after `navigate`. Probe/assert code must poll for settle, never read
> at a fixed offset; a transient 'Loading…' state can lapse mid-transition.

> [!IMPORTANT]
> `onPress={fn}` passes the tap event — a parameterized entry like
> `openSheet(Component)` silently receives the event. Wrap in an arrow at
> callback call sites.

> **Lab (parallel stacks, iOS):** `TabSpec.stack` hosts a `Frame` inside the
> pane — `navigate(name, params, {into})` pushes into it, the tab bar stays
> visible, `goBack({into})` pops; `_stack` is injected into pushed props so
> screens pop their own stack. Named frames register via `registerStack`; the
> app boot registers `'root'` as the default target (`Frame.topmost()` is
> ambiguous once nested frames exist). Verified: push→content→pop across all
> 10 demos inside the Demos tab (48/48). *Superseded 2026-09-23:* `'root'`
> registration is now optional — `getStack('root')` resolves the window's
> root `Frame` (`Application.getRootView()`) when unregistered.

> **Lab (route.native goes real, 2026-09-23):** the native twin is no longer
> a no-op. `pushRoute` resolves the target stack (`'root'` = window root
> Frame auto-resolved; named = `TabSpec.stack`/`registerStack`) and pushes a
> `Page` hosting `registerScreens()`'d components — the seam that made
> web-shaped apps silently render only their default route on native is
> closed. `useRoute`/`routeFor` read the route stamped on `currentPage` via
> `navigatedTo`; `popRoute` pops a stack. Invalid targets warn loudly
> (`console.warn`, once per key): unregistered stack, unknown screen, or
> non-Frame root. Android named routes use the swap-pane fallback below.
> `platform/nav` in the
> harness is now a thin typed wrapper over the ui API.

> [!WARNING]
> `frame.navigate` before the frame is `loaded` leaves `_executingContext`
> stuck — iOS's delegate never fires `didShow` — and every later push queues
> forever: mount the pane's first page on `loaded`, not eagerly.
> `TabViewItem`-hosted frames report `isLoaded=false` after tab-selection
> lifecycle churn (item views skip the normal parent/load path), which defers
> the whole nav queue — `navigate` re-arms with `callLoaded()` when the flag
> is stale.

> **Lab (parallel stacks, Android):** the app builds and runs on Android (35
> emulator, JDK 17, AGP self-provisioned) — root-frame navigation,
> overlay/sheet/modal, gestures, and animation all pass. Smaller divergences
> seen once, uncharacterized: `dark class` absent, list cell-restore,
> `anim settled` timing, one `modal texts` flake.

> [!WARNING]
> **NativeScript nested Frames do not work on Android:** `TabViewItem`-hosted Frame
> pushes execute `NAVIGATE CORE` (the fragment transaction commits; the pushed
> page mounts — its `useEffect`/store write proves it), but `setCurrent` never
> runs — `TransitionListener.onTransitionEnd` doesn't propagate from the child
> `FragmentManager` under a `TabViewItem`. `currentPage`/`backStack` stay
> frozen, `goBack` no-ops (bare `GO BACK`, no CORE), and pages accumulate
> natively. `animated:false` does not rescue — the completion hook itself
> never fires, not merely the animation. Needs an upstream fix or a different
> shell construction. The harness now uses swap-style tab outlets on Android;
> app-defined `Frame`-inside-`TabViewItem` stacks still have this limitation.
> iOS remains on the native swipeable `TabView` path.

> [!NOTE]
> **Android tab fallback (2026-09-25):** `Tabs.native` renders a fixed button
> row and one active pane. `route.native` keeps each named tab's pushed route
> history in module state; hardware back pops the root Frame first, then the
> most recently used tab route. Tab switches recreate the inactive screen,
> so component-local state does not persist. This avoids the broken nested
> FragmentManager completion path while retaining tab-specific back stacks.
> The app launched with the populated tab pane on Android; route pushes through
> the swap pane still need a focused runtime check. iOS simulator sweeps passed.

> [!IMPORTANT]
> On Android `Frame.topmost()` returns the *innermost* frame — all root-level
> reads must use the registered `'root'` stack.

> **Hardware back (Android):** `wireHardwareBack()` registers
> `activityBackPressed` at boot. Pop order: root stack when a pushed page
> covers the shell (NS's default `Frame.topmost()` resolves to the *innermost*
> frame — wrong once nested stacks exist), then the most recently targeted
> named stack, then any named stack with entries; `e.cancel` suppresses the
> system fallback. Verified wired + clean fallthrough on the emulator; the
> pop-while-pushed path needs a persistent push to verify live (probe pushes
> auto-pop in ~500ms).
>
> **Release builds (all three):** iOS `--release` (Release-iphonesimulator) and
> Android `--release` (signed debug keystore) build + run clean; web production
> dist passes 14/14 smoke.

> [!CAUTION]
> Release-only fatal: `RootLayout.open()` returns a Promise that rejects when
> the host view is already attached — `openSheet`/`openOverlay` now
> close-before-open and handle the promise (unhandled rejection = fatal on
> release). `demosweep.native.ts` still skips Android because its probe reads
> `Page` instances from a nested `Frame`; it has not been adapted to the
> router-owned swap-pane history yet.
