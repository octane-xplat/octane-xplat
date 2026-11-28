# Implementation invariants

Paths in code spans refer to the repository root. Read this reference when its
subject applies to your task; [AGENTS.md](../../AGENTS.md) is the entry point.

`packages/ui` takes **no new dependencies and no new peers** — a feature
needing a NativeScript plugin ships as its own leaf package instead
(decision #53). `octane` is the only required peer; the remaining peers
are optional, and `ui` has zero `dependencies` — the svg plugin is
vendored as a git submodule at `src/vendor/ui-svg`
(`octane-xplat/ui-svg` @ `xplat-vendored`) with its `platforms/` config
carried on the package (#62).

1. One element vocabulary per file; platform divergence at file boundaries:
   `.web` for browser code, `.mobile` for shared iOS/Android variants, and
   unsuffixed files as the native default; OS suffixes such as `.ios`,
   `.android`, and `.macos` override for one platform.
2. Hook-calling code only in `.tsx`/`.tsrx` inside the renderer include glob.
3. One copy of `octane` per app. Import the runtime from `octane` so the
   native preset can retarget the import.
4. Keep code that runs on multiple hosts free of host-specific globals. An
   unsuffixed default can use native APIs when every other host that imports
   the module has its own implementation.
5. Universal-runtime APIs only in shared code (allowlist produced by Phase 1).
6. Static styles = CSS/`className`; dynamic = `style` objects.
7. Module-level `signal$`/`query$` `.get()` reads subscribe and re-render on
   native too (universal signal reads from the canonical Octane patch).
   Any module that calls `.get()` during render needs a runtime import from
   `octane/signals`, `octane/signals/client`, or `octane/signals/server`.
   A bare import works when the module only receives a handle elsewhere.
   Type-only imports and `$` names do not enable tracking.
   Non-signal module state still needs `useStore` per reader — the universal
   renderer retains unchanged-prop children on parent re-render, so bare
   reads go stale on native (web re-invokes them; decision #27). Host `on*`
   props re-commit their handler every render through a stable listener id
   (no stale closures, no re-subscribe churn); listeners bound by hand in an
   effect or ref callback (`view.on('pan', fn)`) attach once — read live
   state through a ref or `useEffectEvent`. Host updates carry the complete
   next-prop bag, so a prop dropped by a later render restores its documented
   default on every driver: the DOM renderer removes it, the NativeScript
   driver resets through `unsetValue` (plain fields restore their captured
   pre-prop value), and the macOS driver injects an `undefined` clear into the
   merged prop bag. `undefined` is elided by the runtime — omitting a prop and
   passing `prop={undefined}` are identical — and `null` behaves as unset
   unless the prop's contract declares a nullable value. Dropped `on*`
   handlers unbind on every driver.
8. Shared `@octane-xplat/ui` delivers same props → same pixels. Every
   shared component carries a normalization class (see
   `docs/start/architecture.md`): `self-drawn` (`Switch`, `Slider`,
   `ActivityIndicator`, `Tabs`, `SegmentedControl`),
   `chrome-reset` OS controls (`TextInput`, `TextArea`, `ScrollView`,
   `SearchInput`), or `hosted` OS surfaces (`WebView`, `Video`,
   `CameraView`) where the parity claim covers the frame plus whatever
   chrome we draw — never the interior content. Platform-authentic
   widgets live behind `@octane-xplat/ui/{ios,android,web}` under OS
   names (`UISwitch`, `MaterialSwitch`, `UITableView`, `RecyclerView`,
   `UIModal`, `MaterialDialog`, `UITabBar`, `BottomNavigationView`,
   `LiquidGlass`, `Hoverable`) — each
   subpath resolves only on its platform, and
   `xplat/platform-subpath-import` requires a matching file suffix. An
   idiom may ship in two classes at once (shared `refreshing`/`onRefresh`
   vs a subpath `UIRefreshControl`) — as separate components, never a
   mode prop. There is no shared `List`, `Modal`, `openModal`,
   `PlatformBadge`, or `glass` prop. `KeyboardAvoiding` is part of the shared
   root API: iOS/Android adjust for the software keyboard, while other targets
   retain a neutral block wrapper.
   (decisions #44–46, #50)
9. A platform-suffixed file is an implementation redirect for the same
   module. The default and `.web`, `.mobile`, `.ios`, `.android`, `.macos`,
   `.windows`, and `.gtk` variants must expose the same names and public
   types. Define shared props and public types once (in `props.ts` for UI)
   and import them in the default and every leaf. Import implementations by
   the unsuffixed name, keeping the explicit `.tsrx` extension for TSRX.
   Put shared helpers under a different basename so a leaf importing the
   helper cannot resolve to itself. Every TSRX family needs
   an unsuffixed module; a declaration-only contract may stand in for a missing
   default implementation. Builds must select a real implementation for the
   requested platform. For intentional
   pass-through behavior, follow the criteria in `docs/start/architecture.md`.

Drawer belongs to UI (#157): its mobile presentation uses UI’s common input owner and scalar animation, with no separate plugin or runtime dependency. Keep platform leaves inside UI; do not recreate a drawer package solely for platform-specific presentation.

BorderBeam lives in UI and uses SVG on the web, Core Animation on iOS and
macOS, and a drawable overlay on Android. Preserve the shared stroke geometry
and timing in `border-beam.ts`. The `@octane-xplat/ui/border-beam` entry
limits imports to targets with a painter. See the
[BorderBeam guide](../../docs/app/components.md#highlight-a-working-surface-with-borderbeam).

## Layout defaults

General-purpose containers use block flow (#159), including `View`, bare
`Pressable`, card content, focus wrappers, safe-area wrappers, scroll content,
list-renderer slots, alert/banner bodies, context-menu triggers, chat bubbles, sheet bodies,
and decorative/effect content hosts. Pager owns horizontal paging while each
page preserves block flow. Keep the public frame, caller-content host,
and internal chrome distinct. A surface may need an internal grid for painting
without making caller children grid items. Parent-placement metadata must still
address the frame.

Named layouts (`Stack`, `Row`, `Grid`, `Center`, ratio/form/page layouts),
intentional inline content, structured controls, and host infrastructure retain
their documented arrangements. Derived controls must establish their own layout;
they cannot depend on `View` or `Pressable` introducing flex. Context/provider
components that render no box stay transparent. Drawer main/panel hosts retain
the bounded viewport layout needed by nested screens; use an explicit child
layout within those hosts. Empty-state chrome retains its centered column.

Use structural CSS for static defaults so caller classes can override them.
Removing a class/style override must restore the component default, including
after native host replacement. Layout-context props do not choose display:
spacing/alignment props alone do not turn a neutral container into flex/grid.
Preserve purposeful screen/viewport/media sizing and the existing shared box
normalization; do not normalize every intrinsic with a universal display rule.
See the [public layout contract](../../docs/app/primitives.md#predictable-container-defaults)
for app composition. Geometry, cascade reset, and OS-input qualification remain
separate evidence requirements.

## Readiness observer ownership

`ReadinessScope` and `useReadinessTask` report ordinary screen work in every build mode; the controller is renderer-free. Query adapters report `hasData` refreshes as nonblocking, terminal errors as failures, and paused requests as pending. Dev actions apply `includeBackground:true` after handlers; ordinary UI observes status without blocking rendering. See [readiness](../../docs/app/readiness.md).

`useReadiness$` subscribes in a layout effect and unsubscribes on cleanup or when a notification encounters a retired signal reader. In Octane 0.16.3's compiled universal runtime, auto-owned `useSignal$` cells can retire before an ancestor's layout cleanup disposes its readiness owner and notifies listeners. The observer catches only `ScopeDisposedError` and unsubscribes that retired reader; other errors propagate. Explicit writable signal construction during render is rejected by the same runtime, so do not replace the owned signal hook with a render-time `createScope().signal$()` allocation. Preserve the compiled update, conditional-hook reentry and parent/child unmount regression; a web-only pass does not prove this cleanup order. This is an observed ownership constraint, not a native OS or frame qualification.
