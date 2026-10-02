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
3. One copy of `octane` per app.
4. No DOM globals in shared code.
5. Universal-runtime APIs only in shared code (allowlist produced by Phase 1).
6. Static styles = CSS/`className`; dynamic = `style` objects.
7. Module-level `signal$`/`query$` `.get()` reads subscribe and re-render on
   native too (universal signal reads from the canonical octane patch).
   Non-signal module state still needs `useStore` per reader — the universal
   renderer retains unchanged-prop children on parent re-render, so bare
   reads go stale on native (web re-invokes them; decision #27).
8. Shared `@octane-xplat/ui` delivers same props → same pixels. Every
   shared component carries a normalization class (see
   `docs/start/architecture.md`): `self-drawn` (`Switch`, `Slider`,
   `ActivityIndicator`, `Tabs`, `Drawer`, `SegmentedControl`),
   `chrome-reset` OS controls (`TextInput`, `TextArea`, `ScrollView`,
   `SearchInput`), or `hosted` OS surfaces (`WebView`, `Video`,
   `CameraView`) where the parity claim covers the frame plus whatever
   chrome we draw — never the interior content. Platform-authentic
   widgets live behind `@octane-xplat/ui/{ios,android,web}` under OS
   names (`UISwitch`, `MaterialSwitch`, `UITableView`, `RecyclerView`,
   `UIModal`, `MaterialDialog`, `UITabBar`, `BottomNavigationView`,
   `SideDrawer`, `DrawerLayout`, `LiquidGlass`, `Hoverable`) — each
   subpath resolves only on its platform, and
   `xplat/platform-subpath-import` requires a matching file suffix. An
   idiom may ship in two classes at once (shared `refreshing`/`onRefresh`
   vs a subpath `UIRefreshControl`) — as separate components, never a
   mode prop. There is no shared `List`, `Modal`, `openModal`,
   `PlatformBadge`, or `glass` prop. `KeyboardAvoiding` is part of the shared
   root API: iOS/Android adjust for the software keyboard, while other targets
   retain a neutral column wrapper.
   (decisions #44–46, #50)
9. A platform-suffixed file is an implementation redirect for the same
   module. The default and `.web`, `.mobile`, `.ios`, `.android`, `.macos`,
   `.windows`, and `.linux` variants must expose the same names and public
   types. Keep shared prop types in `props.ts`; platform differences belong
   in the implementation, not in the exported contract. For intentional
   pass-through behavior, follow the criteria in `docs/start/architecture.md`.
