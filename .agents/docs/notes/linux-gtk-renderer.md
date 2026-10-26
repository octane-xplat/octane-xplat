# Linux GTK renderer — v1 implementation status

> Status note for `packages/linux-gtk-renderer` (`@octane-xplat/linux-gtk`,
> private). Follows the feasibility review
> (`.agents/design/linux-gtk-feasibility-review.md`, gate verdict **fail** —
> production qualification remains gated) and the capability inventory
> (`linux-gtk-capability-inventory.md`). This note distinguishes what is
> proven at build level from what is proven at runtime; it authorizes no
> release and claims no production qualification.

## What landed

A first native slice of the GTK4/GJS renderer:

- **Driver** (`src/index.ts`): `UniversalHostDriver` implementation derived
  from the proven feasibility adapter, mapped onto the shared intrinsic
  vocabulary. `createGtkRoot(host)` mounts a universal root on any GTK
  container widget and installs the required `scheduleMicrotask` bridge
  (GJS has no `queueMicrotask`; the Promise bridge is the evidenced path).
  Handles `create`, `update`, `insert`/`move`, `remove`, `destroy`,
  `event`, `visibility`, `recreate`, `ensure-public-instance`. Rejects
  foreign-renderer batches before mutation.
- **Intrinsics implemented**: `masonview` — the single layout container;
  all layout semantics arrive through the `style`/`className` bag
  (MasonStyleProps) after the style-only cutover — `label`, `button`,
  `scrollview`, `textfield`, `switch`, `slider`, `progress`,
  `activityindicator`; viewless `#text`, `span`, `formattedstring`,
  `contentview`, `proxyviewcontainer`, `rootlayout`. Unknown tags throw at
  create; unwired `on*` props warn once. Direct layout props on `masonview`
  or Mason-parented children warn once and are consumed.
- **Layout engine** (`src/mason.ts` + `native/xplatmason/`): `masonview`
  binds mason-c through the `XplatMason` GI typelib — GJS has no plain-C
  FFI, so a small facade (engine/node handles as `guint64`, JSON style
  dict, `GBytes` layout records) statically links `libmason_c.a` and is
  scanned into a typelib by `native/xplatmason/build.sh`. A custom
  `Gtk.LayoutManager` runs the engine inside GTK's measure/allocate
  passes; leaf children measure their widgets live via mason's
  `mason_node_new_node_with_context` callback (the GTK mirror of the
  macOS `XPLViewMeasure` intrinsic-size read). Without the typelib,
  `masonview` warns once and falls back to the `Gtk.Box` emulation.
  The style dict matches macOS except `margin`/`padding`, which GTK's
  measure/allocate channel already folds into leaf measures and child
  allocations (px-only there — percentage/auto is a gap).
- **Events**: tap/click/press → `clicked` on buttons / `Gtk.GestureClick`
  released elsewhere; doubletap (n_press===2 filter), longpress
  (GestureLongPress), focus/blur (EventControllerFocus), loaded/unloaded
  (`map`/`unmap`), change (entry `changed`, switch `notify::active`, scale
  `value-changed`), submit (entry `activate`), scroll (scrolled-window
  adjustments).
- **Props**: `text`/`value`, `enabled`/`disabled`→sensitive plus the
  `:disabled` pseudo-class, `width`/`height`→size-request,
  `style`/`className`→the stylesheet cascade (`#apply-stylesheets` in the
  README): the computed bag maps onto a per-widget `Gtk.CssProvider`
  (color/background/font/text decorations/shadows/padding/margin/border/
  min-size) plus direct widget writes. `className` is **not** forwarded to
  `add_css_class` — GTK's default theme defines `.card`, `.title`,
  `.error` and friends that would silently style app classes of the same
  name. `flexGrow`→expand along parent orientation, alignment
  props→`halign`/`valign`, `placeholder`/`secure`/`editable` on textfield,
  controlled entry writes with selection preservation + the bounded
  GLib settle (the X11 SelectionClear repair from the proof), `testID`/
  `automationText`/`id`→widget `name`. Prop drops restore documented
  defaults (complete-bag update contract).
- **Host** (`src/host.ts`, `./host` export): `runGtkApp(options, mount)` —
  GtkApplication + ApplicationWindow + vertical content box + mounted root.
- **JSX**: the package ships no `jsx-runtime`/`intrinsics` typing of its
  own — GTK files use `/** @jsxImportSource @octane-xplat/jsx */` like every
  native target; the `gtk` customConditions entry in the typecheck env binds
  the host element type to the GTK widget type (packages/jsx `src/gtk.d.ts`,
  full `NativeElements` membership). The driver accepts the contract names
  (`isEnabled`, `visibility`, `ClassValue` className, `style` string|object,
  `keyboardType`→`input_purpose`, `scrollBarIndicatorVisible`/
  `isScrollEnabled`, `maxValue` default 100, `alignSelf`) plus GTK extras not
  in the contract. Note: binding `macos-renderer`'s pragma to the strict
  shared surface was tried and reverted — `packages/ui`'s `.macos.tsrx`
  leaves pass web `CSSProperties`, `Ref<unknown>`, `'start'` aliases, and
  AppKit-specific event types that don't fit the shared contract; that's a
  ui reconciliation workstream, not a types-only change.
- **Compat shims**: `compat/native-core`, `compat/escape-props`.
- **First-class CLI target** (follow-up change): `xplat.targets.linux.runtime`
  now accepts `"gtk"` alongside `"webkitgtk"`. `xplat dev`/`xplat build`
  detect it (`linuxRuntime` in `packages/cli/src/targets.ts`),
  `inspectLinuxPackageConfig` validates it (identity fields as before;
  `host.scheme` optional — the GTK host has no URI handling; `viteConfig`
  defaults to `vite.gtk.config.ts`), and `packageLinux` branches: the GTK
  path runs the app's `xplatLinuxGtk` Vite config into the staged app
  directory and emits `app.js` (or any single top-level ESM file), an
  executable `gjs -m` launcher, `app.json`, `README.txt`, and the usual tar
  archive. **No host script, desktop entry, or installer ships** — bundle +
  launcher is the honest minimum; GJS produces no binary, and URI/install
  surfaces wait on runtime qualification. `xplat dev linux` stays app-owned
  (`pnpm run dev`). Doctor differentiates the runtime check (GTK only, no
  WebKitGTK/libsecret/Adwaita typelibs). Public doc:
  `docs/platform/linux-gtk.md`; recipe: `.agents/docs/recipes/linux-gtk-package.md`.
  apps/linux (webkitgtk) is unchanged — `gtk` is an alternate runtime value,
  not a second linux target.

## The `.gtk` suffix (deviation from the task brief)

The brief asked for a `.linux` suffix seam. `.linux` is already claimed by
the WebKitGTK renderer — the existing chain resolves `.linux.*` → `.web.*`
→ unsuffixed, and `.linux` leaves carry DOM assumptions (see the capability
inventory's resolution-model section). Reusing it would let DOM leaves
resolve silently into a GJS bundle and would rewrite the meaning of every
existing `.linux` file. The renderer therefore registers a distinct **`.gtk`**
suffix:

- `tsconfig.base.json` `moduleSuffixes` (`.gtk` after `.linux`, before
  `.windows`)
- `packages/cli/src/tsconfig-envs.mjs`: `gtk` env — `jsxImportSource`
  `@octane-xplat/linux-gtk`, `moduleSuffixes ['.gtk','']`,
  `customConditions ['gtk']`, `lib ESNext` (no DOM lib), ambient
  `host-globals.d.ts`
- `packages/cli/src/vite.mjs`: `PLATFORM_TAG` + `boundaryAllowed.gtk =
  {'gtk'}` — `.linux` leaves are foreign in a GTK bundle (tested)
- `packages/lint/src/xplat-rules.ts`: `.gtk` in the platform suffixes, `isNativeFile`,
  and the `.gtk.tsrx` pragma rule expecting
  `/** @jsxImportSource @octane-xplat/linux-gtk */`
- `packages/cli/src/linux-gtk/vite.mjs` (`@octane-xplat/cli/linux-gtk/vite`):
  `xplatLinuxGtk` preset — `gtk` renderer registry, `.gtk` extension chain,
  `gi://` externals, `octane` → `octane/universal/native` retarget, one
  resolved universal-native instance for app + renderer

Repository and consumer lint now share `packages/lint/src/xplat-rules.ts`,
including GTK suffix and pragma rules. There is no separate published mirror
to synchronize.

## Evidence

**Runtime-proven (prior feasibility work, retained evidence):** Octane
universal runtime loads in GJS 1.82.3 + GTK 4.18.6 / GLib 2.84.4 on Debian 13
aarch64; Promise-based scheduling bridge ordering; reconciliation and
hit-testing via XTEST; controlled-entry selection semantics. The driver
adapter those runs proved is the direct ancestor of `src/index.ts`.

**Build-proven (this change):**

- `pnpm --filter @octane-xplat/linux-gtk typecheck` — clean
- `pnpm --filter @octane-xplat/jsx typecheck` — clean (`gtk.d.ts` compiles)
- `node --test test/build.test.mjs` (in the package) — 2 tests pass on macOS:
  1. `xplatLinuxGtk` compiles `test/fixtures` into one ESM bundle with
     `gi://` imports external, `universalPlan` emitted, no DOM globals;
  2. a `.linux.ts` leaf reachable in a GTK bundle fails with the
     `xplat boundary` error.
- `node --test packages/cli/test/tsconfig-envs.test.mjs` — 9 pass (suffix
  order invariant intact)
- `node --test scripts/xplat-rules.test.mjs` — 3 pass
- `scripts/lint-tsrx.mjs` — no new violations
- `pnpm probe doctor` — run on macOS; linux target correctly reports
  unavailable ("Run this command in a real Linux environment; no macOS
  stand-in is used")

**Runtime-proven (mason binding, this change):** driver command handling
and the Mason layout path ran under real GJS 1.90.1 + GTK 4.24.1 (Homebrew,
macOS — GJS and GTK are the genuine libraries; the host OS differs from the
Linux target). `test/mason.test.mjs` builds `test/fixtures/src/mason-smoke.ts`
and drives `gtkDriver` batches headlessly: `masonview` instantiates the
`XplatMasonView` host, children attach via `insert_before`, a row of two
labels computes `alpha` at its measured text width and `beta` flex-grown,
`flexDirection:column` restacks, and `destroy` frees engine nodes. The ABI
itself was exercised function-by-function in GJS before the driver pass
(handle marshalling, `guint64[]` children, JSON styles, `GBytes` records,
the leaf `gtk_widget_measure` callback). The Gtk.Box fallback is
deliberately retained for typelib-absent builds.

**NOT proven:** driver event wiring, widget mounting, and the interactive
smoke path below remain unverified — the headless pass exercised layout,
not input. Nothing ran on a Linux host yet (the brokered
`linux:gtk-proof-vm` reservation was granted but the VM was not
contactable — OrbStack ssh helper absent). GJS versions between 1.82.3
(evidence base) and 1.90.1 (verified) may drift on `imports.gi` details.

**Runtime-proven (this package, 2026-10-18):** on an OrbStack Debian 13
arm64 guest (GJS 1.82.3, GTK 4.18.6 — matching the feasibility stack):

- `xvfb-run gjs -m dist/app.js` opened a real window titled
  "Octane GTK smoke" 480×320 (confirmed via `xwininfo`), no errors.
- `src/introspect.ts` (`vite.introspect.config.mjs` entry) mounted the
  fixture headlessly and printed the realized tree —
  `GtkBox > GtkBox > GtkLabel + GtkButton(GtkLabel)`.
- Emitting `clicked` on the GtkButton ran `onPress` → `setState` → a
  Promise-microtask flush updated the label text to `"Count: 1"` — event
  wiring and reconciliation verified end-to-end.

Two runtime findings worth keeping: bare `Gtk.*` widget construction
segfaults without `Gtk.init()` (the `runGtkApp` path gets it free from
`GtkApplication`), and `gjs -m` exits silently when the module throws before
any output — run with stderr visible.

**Still NOT proven:** real OS-input dispatch (pointer/keyboard events into
widgets — only `emit` directly on the widget), Wayland, x86_64, window
lifecycle edge cases, and anything visual/layout-correctness that requires
looking at rendered pixels. The full feasibility evidence pipeline
(`scripts/probe/linux-gtk-*`) remains the deeper qualification path.

## Smoke path (verified 2026-10-18 on OrbStack Debian 13 arm64)

Prerequisites: GJS ≥ 1.80, GTK 4, a graphical session (X11 or Wayland —
`xvfb-run` works for a display-less check; Wayland + x86_64 remain
unqualified gaps).

1. Build the fixture bundle (any host):

   ```sh
   cd packages/linux-gtk-renderer/test/fixtures
   pnpm exec vite build -c vite.config.mjs
   ```

2. On the Linux host, run:

   ```sh
   gjs -m packages/linux-gtk-renderer/test/fixtures/dist/app.js
   ```

   Expected: a GTK window titled "Octane GTK smoke" with a counter label
   and an "Increment" button; pressing the button updates the label.
   `runGtkApp` returns `GtkApplication.run`'s exit status.

   For a display-less check, `xvfb-run -a gjs -m dist/app.js` mounts the
   same window under Xvfb. The introspection entry
   (`pnpm exec vite build -c vite.introspect.config.mjs`, then
   `xvfb-run -a gjs -m dist/app.js`) prints the realized widget tree and
   exercises button-press → setState → label update without any window.

3. `pnpm probe run <case> --target linux` does not yet serve this renderer —
   the probe pipeline targets the WebKitGTK host. A native-GTK probe path
   is future work (out of scope: `scripts/probe/` is owned by the
   qualification workstream).

## Stylesheets (2026-10-26)

The renderer applies stylesheets through the same vendored NativeScript
selector engine and renderer-owned cascade the AppKit renderer uses —
consumed from `@octane-xplat/macos-renderer/css`, not copied
(decision #124). `xplatLinuxGtk` installs the shared
`xplatInlineStylesheets` plugin (renamed from `xplatMacOSStylesheets`),
which processes each emitted `.css` asset and prepends one
`__xplatStylesheets.push(...)` statement to `app.js` — valid before ESM
imports and it runs before bundled module bodies, so the engine's
module-init drain registers every sheet. `registerStylesheet` is
re-exported from `@octane-xplat/linux-gtk`; `Application.addCss` in the
native-core shim registers a sheet for theme-css-inject.

Mechanics worth knowing: the CSS tree is the logical tree minus
`#text`/`span`/`formattedstring` (viewless `contentview`/
`proxyviewcontainer`/`rootlayout` participate so inheritance and custom
props flow through); restyle is per-container dirty-set flushed at batch
end or on one Promise microtask; root nodes get `ns-root`, `ns-gtk`,
`ns-light|ns-dark` (scheme from `gtk-interface-color-scheme` on GTK ≥
4.20, else prefer-dark-theme / a `-dark` theme name); computed styles
reach widgets through a per-node `xplat-n<id>` class + `Gtk.CssProvider`;
`border-style: solid` is auto-emitted when a width is set without a style
(GTK's default is `none`); `text-align` maps to `xalign`/`justify`;
unsupported CSS properties warn once per name (`[linux-gtk-css]`).

**Runtime-proven (this change):** `test/css.test.mjs` builds
`test/fixtures/src/css-smoke.ts` (which imports a real `.css` file, so the
CLI injection is exercised end to end) and drives `gtkDriver` batches
headlessly under real GJS 1.90.1 + GTK 4.24.1 (Homebrew, macOS — genuine
libraries, non-Linux host): class selectors land in `computedStyle` and on
the real widget (`get_color()` returns the rule's red), color/font-size
inherit from a masonview to a child label, `var()` declared on `.ns-root`
resolves in a descendant, roots carry `ns-root`/`ns-gtk`/one scheme class,
inline `style` beats CSS, `enabled:false` matches `:disabled` and
re-enabling unmatches, an unsupported property warns exactly once across
several nodes, an adjacent-sibling rule re-matches after an insert, a
runtime `registerStylesheet` replace restyles mounted widgets after a
microtask, and `className` does not reach the widget's GTK css classes.
Theme delivery: `registerStylesheet` of `@octane-xplat/ui` `tokens.css` +
`chrome.css` (961 rule bodies) completes in ~13 ms under GJS 1.90.1.

**Build-proven (this change):** `node --test
packages/cli/test/vite-inline-stylesheets.test.mjs` — 2 pass, including an
ES-format GTK-shaped case (push statement prepended before the `gi://`
import, `@platform gtk` kept / `@platform web` stripped, px→dip).
`node --test test/style-css.test.mjs` — 9 pass on the GI-free
`src/style-css.ts` mapping.

**NOT proven:** same boundary as above — no Linux-host run, no OS input,
no visual review. Media queries re-check on appearance/stylesheet changes,
not window resize; only `:disabled` responds to state; animations are not
played.

## Known limitations (build-level observations, not runtime findings)

- GJS 1.82.3 exposes no `queueMicrotask`, `process`, `performance`, or
  `fetch` (verified by the feasibility proof's globals inventory; upstream
  is GJS itself, not Octane). The driver bridges microtask scheduling via
  `Promise.resolve().then`; `xplatLinuxGtk` inlines
  `process.env.NODE_ENV` at build. These are load-bearing workarounds —
  do not remove them if a future GJS adds the globals without re-checking
  flush ordering.
- No `@girs/*` types — `src/gi.d.ts` is a hand-maintained member subset;
  members beyond it resolve as `any`. Generated GIR types are the upgrade
  path.
- `accessibilityLabel` is wired through a guarded `update_property` call —
  the GTK4 varargs entry point may not marshal from GJS; expect the
  once-per-label warning until the GtkAccessible row is qualified.
- `flexDirection` `*-reverse` renders unreversed under the Box fallback
  (warns); under Mason the engine handles it. The fallback collapses
  asymmetric `rowGap`/`columnGap` to `spacing` and cannot express
  `justifyContent`/`alignItems` — the engine owns all four when present.
- Mason leaf nodes measure `gtk_widget_measure` once per axis per pass and
  ignore the engine's `known`/`avail` constraint args — wrapped text and
  for-size-dependent natural sizes are approximate (documented gap, v1).
- `margin`/`padding` reach the engine through the widget's CSS box, not
  the style dict — px-only; `margin: auto` and percentage values have no
  GTK CSS equivalent inside Mason subtrees.
- Text only folds into `label`/`button`; `#text` under other containers is
  dropped from the widget tree (logical node retained).
- `<scrollview>` mounts a single child — the shared scrollable contract
  needs a future viewport pass.
- Portals are unimplemented (`resolveParent` rejects non-null targets);
  templates/mount-template ops are unadvertised and unhandled.
- The `native` boundary set does not include `gtk` — `.gtk` leaves are
  foreign in generic native (NativeScript) bundles. Deliberate.
- The Mason binding needs the gitignored build artifacts
  (`native/xplatmason/build.sh` output) plus `GI_TYPELIB_PATH` or
  `XPLAT_MASON_TYPELIB` at run time; without them `masonview` runs the
  `Gtk.Box` emulation with a once warn. `build.sh` stamps the absolute
  `.so` path into the typelib — fine for in-tree dev, wrong shape for a
  system install.

## Canonical retained-pane routing

The canonical routing barrel now selects GTK platform leaves for its default
client, stack registry, Back interception and route shells. The default client
uses the renderer-neutral pane host; it does not import NativeScript Frame,
Page or modal hosts. `xplatLinuxGtk` resolves both compiler-generated GTK imports
and retargeted NativeScript-renderer imports to the application's renderer entry.
UI takes no GTK dependency. The private GTK renderer declares UI as a workspace
dev dependency for its public-consumer fixture.

The initial barrel probe failed on five missing native-core exports. A second
runtime check exposed the style-only shell's visible inactive entry under the
Gtk.Box fallback. `RoutePane.gtk` now sets native `visibility` explicitly and
avoids the default View's unwired NativeScript pan/swipe adapters. The maintained
runtime checks actual widget visibility rather than inferring it from local
state retention.

```sh
node --test packages/linux-gtk-renderer/test/build.test.mjs
pnpm --filter @octane-xplat/linux-gtk typecheck
pnpm --filter @octane-xplat/linux-gtk exec vite build --config test/fixtures/vite.routing.config.mjs
```

Real GJS 1.82.3 / GTK 4.18.6 on Debian 13 arm64 passes 13 programmatic routing
assertions: rendering, local state updates, hidden retention, Back with widget
identity, explicit modal rejection and disposal. No XplatMason typelib is
installed in that guest; the separate native layout test is skipped. This
qualifies the explicit programmatic pane subset, not generated GTK startup,
modal surfaces, OS input, visual parity or the complete UI. The fixture's GTK
pane code is byte-identical to the public guide's example and has positive and
negative TypeScript consumer checks. The source/import boundary and runtime
results are separate evidence in the
[routing qualification guide](../navigation-checks.md#native-gtk-retained-panes).
