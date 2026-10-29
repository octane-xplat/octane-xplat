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
  `scrollview`, `textfield`, `textview`, `switch`, `slider`, `progress`,
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
consumed from `@octane-xplat/css-engine`, not copied
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
no visual review.

### NativeScript parity follow-up (2026-10-26)

The first pass left state, resize, and animation gaps; these landed after
it, each with GJS 1.90.1 / GTK 4.24.1 headless evidence in
`test/css.test.mjs` or `test/mason.test.mjs`:

- **Cascade output:** `computeCascade(..., { borderLonghands: true })` —
  per-side borders and per-corner radii stay separate (AppKit keeps the
  collapsed default). Control colors route to GTK subnodes (`slider`,
  `trough > highlight`, `trough > progress`, checked switch track); the
  node's provider is cloned onto every internal descendant context because
  GTK 4.24 does not propagate widget providers to gizmos (display-scoped
  providers measured O(N²) on restyle).
- **Pseudo-classes:** `state-flags-changed` drives `hover` (PRELIGHT),
  `highlighted`/`active`/`pressed` (ACTIVE), `focus` (FOCUS_WITHIN on
  textfield, FOCUSED elsewhere), `focus-visible`, `focus-within`; switch
  `notify::active` drives `checked`. `normal` is cleared only by NS visual
  states (view-common.js), never by the desktop extras. Restyles are gated
  on `stylesheetPseudoClasses()`.
- **Media:** root-window `notify::default-width/height`, maximized, and
  fullscreened call `refreshMediaQueries()`; roots gain
  `ns-portrait|ns-landscape` and `ns-ltr|ns-rtl`. The CLI keeps `px` in
  at-rule preludes, and the engine normalizes lightningcss's Level-4 range
  syntax (`width>=300px`) back to `min-`/`max-` features.
- **Paint:** masonview children carry the NS transform on their
  allocation (`Gsk.Transform`, centre origin, `updateNativeTransform`
  order), so picking follows it; the host snapshot sorts by `z-index` and
  pushes `clip-path` in child space. Neither changes picking — UIKit
  ignores `zPosition` and layer masks for `hitTest` too. Outside masonview
  the transform falls back to GTK CSS and `zIndex`/`clipPath` warn once.
- **Keyframes:** matched rulesets' animations (`computeCascade().animations`,
  identity-stable per ruleset) sample through the shared
  `sampleKeyframeAnimation` on one 16 ms `GLib.timeout_add` driver — not a
  frame-clock tick callback, because unmapped widgets get no frame clock
  and the headless tests must observe frames. The overlay
  (`node.animatedStyle`) sits above the computed bag like NS's `keyframe:`
  layer; Mason's style dict and paint read it too. Replay follows NS
  `updateDynamicState`: the node's own class/id/pseudo-class change,
  insertion, or a stylesheet change restarts; inline-style restyles do not;
  removal stops. Divergence: a descendant restarts only when its matched
  animation list changes, whereas NS restarts every descendant on an
  ancestor class change. Unchanged `className`/`id` in a full-bag update is
  no longer treated as a selector change. GTK's `gtk-enable-animations`
  does not suppress playback (NS ignores the OS setting too); it feeds
  `prefers-reduced-motion`.

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
- `accessibilityLabel` uses the non-varargs property-array binding; the
  [release audit](linux-gtk-release.md#accessibility-mechanism-and-evidence) records
  AT-SPI evidence and the button mnemonic relation handling.
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
- `<scrollview>` mounts a single content child; wrap multiple children in
  a content masonview. Refs expose browser-shaped metrics, scroll/layout
  subscriptions and clamped offset methods backed by GtkAdjustment. The
  useScrollableArea hook has real-Linux range, resize, cleanup and X11 wheel
  evidence in [the parity record](linux-gtk-ui-parity.md#headless-scrolling-slice).
  ScrollableArea's two-axis handles and block-axis refresh are now checked.
  Generic masonview scrolling and input-only disabling through isScrollEnabled
  remain unqualified; hidden/visible overflow now reaches Gtk.Widget clipping.
- Portals are unimplemented (`resolveParent` rejects non-null targets);
  templates/mount-template ops are unadvertised and unhandled.
- The `native` boundary set does not include `gtk` — `.gtk` leaves are
  foreign in generic native (NativeScript) bundles. Deliberate.
- The Mason binding needs the gitignored build artifacts
  (`native/xplatmason/build.sh` output) plus `GI_TYPELIB_PATH` or
  `XPLAT_MASON_TYPELIB` at run time; without them `masonview` runs the
  `Gtk.Box` emulation with a once warn. `build.sh` binds the facade by soname; supply both the typelib and library
  search paths. Native consumer relocation remains unqualified.

## Canonical retained-pane routing

The canonical routing barrel now selects GTK platform leaves for its default
client, stack registry, Back interception and route shells. The default client
uses the renderer-neutral pane host; it does not import NativeScript Frame,
Page or modal hosts. `xplatLinuxGtk` resolves both compiler-generated GTK imports
and retargeted NativeScript-renderer imports to the application's renderer entry.
UI takes no GTK dependency. The experimental GTK renderer declares UI as a workspace
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

## GJS/GTK stand-ins found during the workshop GTK cutover

Runtime-verified on Homebrew gjs 1.90.1 + GTK4 (`xplat workshop dev --target linux` on macOS; dev stand-in, not Linux qualification):

- Historical finding, superseded by the release preparation: the scalar
  `GtkAccessible.update_property` invocation failed. The property-array binding
  now sets AT-visible labels; widget names remain solely for automation. See the
  [release audit](linux-gtk-release.md).
- `queueMicrotask` is absent in GJS — the workshop shell installs a `Promise.resolve().then` polyfill on the global before octane's universal runtime loads.
- The compat shim `native-core-shim.ts` now carries honest stand-ins: `ApplicationSettings` is an in-process map (no persistence), `Connectivity` reports `connectionType.unknown` and monitoring is a no-op, `Device` reports static desktop values.
- `xplat workshop dev --target linux`: the GJS shell reads the stdin line protocol through a `GLib.IOChannel` watch; blocking `read_line` inside the callback must not loop — read one line per `IN` dispatch or microtasks starve.

## GTK icon and picture sources

The shared Icon, IconRegistryProvider and registry functions are now included in
the GTK barrel, with their original native declarations. Icon's SVG/raster
branches use new image/svgview intrinsics backed by Gtk.Picture; text and font
fallbacks stay Gtk.Label. The public Image component is not added by this slice.

GJS 1.80.2 on the Ubuntu qualification host has neither fetch nor atob.
The existing shared svgSource helper calls them for remote and base64 sources.
A metadata-only GJS probe (/tmp/gtk-texture-probe.mjs on andromeda) confirmed
both missing globals and successful native SVG decoding into a 24 by 16 texture.
The svg.gtk file boundary preserves source strings for renderer-owned decoding;
it does not install browser globals or change the shared helper's behavior.

GDK 4.14.5 loads bytes through Texture.new_from_bytes. Its documented guaranteed
formats are PNG, JPEG and TIFF; SVG support depends on the installed loader.
The tested Ubuntu host has GdkPixbuf 2.42.10 and librsvg2-common 2.58.0. Do not
assume that GTK alone guarantees an SVG loader on another distribution.
A missing decoder follows the explicit imageError state; no fake icon is shown.
Review this dependency when moving to a GDK/glycin loader stack.
Reference: [GDK texture byte loader](https://docs.gtk.org/gdk4/ctor.Texture.new_from_bytes.html).

HTTP(S) sources lazily import Soup 3 (tested typelib package 3.4.4).
Soup reads use Gio.Cancellable; local paths, bundle-relative ~/ paths and
registered GResource res:// paths use Gio.File. Data URIs decode through GLib
and byte escapes, without atob. Promised sources are accepted. A generation
guard blocks late completion after a newer source, recreation or disposal.
Failures clear loading state and retain the error on the raw widget; diagnostics
do not include the source URI. No new UI dependency or peer is added.
Reference: [Soup asynchronous body loading](https://libsoup.gnome.org/libsoup-3.0/method.Session.send_and_read_async.html).

SVG currentColor and custom-property expressions resolve against the renderer
cascade before native decoding. The CSS engine's existing evaluateCssVariables
helper is re-exported rather than copied. Source-independent restyles can
replace the paintable; source changes preserve the widget. The accessible
flag writes GTK's hidden state through the array binding, so decorative and
named icons keep distinct stored accessibility state. This is not a screen-reader
or visual/pixel qualification. Raw intrinsic stretch supports aspectFit,
aspectFill and fill; none rejects until its natural-size behavior is implemented.

Initial Linux qualification passed the existing 32 tests and failed the new
icon test's tint assertion. Correcting the fixture's after-notification capture
exposed a real :root gap: GTK marked ns-root in classes but not root in its
pseudo-class set. Tracking that state at the same logical-root boundary made
the original custom-property tint assertion pass. The next currentColor check
exposed a separate desktop-port gap: IdSelector.match honored cssId, but fast
candidate collection only looked at numeric node.id. Candidate lookup now
includes cssId and avoids duplicate lookup when the two identities agree.
This is a gap in the local desktop adaptation of NS 9.1.3, not an upstream
NativeScript bug with ordinary string ids. The partial adaptation originated
in 53c6019bf0; no local release tag contains that commit. Two new CSS-engine
tests cover numeric identity, changes/removal, compound selectors and deduplication;
all 37 engine tests pass (/tmp/gtk-css-id-test.log). Silo observations:
48fc0a27-efe4-4fa3-89ca-cf1a38c3c9bb and 0f92da1b-c425-4843-ae8c-2d4a31dce35e.
The runtime assertions remain intact. Expanded typecheck passes all
63 tasks for UI/CSS-engine dependents (/tmp/gtk-icon-types-expanded.log).
Packed exports/declarations pass all six tasks (/tmp/gtk-icon-pack.log).
The final expanded renderer/dependent check passes eight tasks
(/tmp/gtk-icon-types-complete.log), and the combined real-Linux renderer
suite passes all 33 tests without skips (/tmp/gtk-icon-test-final.log).
CSS audit reports zero unsupported declarations; recipes and 12 release notes
validate. The runtime fixture also checks file/GResource/raster sources and
request disposal. The focused real-Linux fixture passes 44 assertions
(/tmp/gtk-icon-test-clear.log), including original :root and #id tint checks,
file/GResource/raster/data sources, pending Promise/HTTP ownership, explicit
undefined src clearing, failure recovery and teardown. A malformed synthetic
PNG fixture was replaced with valid generated one-pixel PNG bytes; no pixel
inspection was used. The final combined renderer-suite result is recorded in
the GTK UI parity note.

## Native text refs and editable behavior

The GTK host now routes imperative textfield .text writes through the same
echo suppression and cursor/selection preservation as declarative text props.
This is the path used by the shared native TextInput's text-write helper.
Cursor offsets and shrink clamps count Unicode code points, not UTF-16 units.
Partial selections retain their surviving range. Explicit undefined textfield
props restore registered defaults, including hint/secure/keyboard purpose.

GTK GtkEditable.editable controls editing independently of sensitivity.
The previous renderer comment that Gtk.Entry lacked editable was incorrect:
Gtk.Entry implements GtkEditable, and a GTK 4.14.5/GJS 1.80.2 probe verifies
get_editable=false with get_sensitive=true. Disabled/enabled aliases now derive
sensitivity from the complete incoming bag, so setter order cannot override
a disabled field. Named size and shared field props are not widened.

GtkWidget refs expose focus through grab_focus, and blur clears a GtkRoot focus
only when it belongs to that widget or its descendants (Entry delegates to
GtkText). Disposed ref operations are inert. Entry owns a capture controller
that cancels delayed X11 selection repair on real key/button/touch input before
GTK handles it; cleanup removes that controller and any pending repair timer.
Accessible labels and hints use GTK LABEL/DESCRIPTION arrays and reset when
their values are removed or become undefined. Stored accessibility properties
do not establish screen-reader behavior.

### GTK wrapper cursor limitation

On GTK 4.14.5 with GJS 1.80.2, a backward select_region(4, 1) reports bounds
[1, 4]. GtkEntry.get_position() reports 4, but its GtkText delegate's
cursor-position property reports the actual active edge, 1. The mapped
/tmp/gtk-entry-cursor-probe.mjs records all three values. This is backed by
[GTK 4.14.5's GtkEditable implementation](https://raw.githubusercontent.com/GNOME/gtk/4.14.5/gtk/gtkeditable.c):
the Entry wrapper forwards through normalized selection bounds before the
position getter takes their end. Read the delegate's documented cursor-position
property for restoration and repair checks. select_region retains the backward
direction; no synthetic key binding is required. Reassess the workaround after
GTK upgrades; remove it only after the same backward-range probe and maintained
fixture show that the wrapper getter preserves the active cursor edge.
See [the cursor property](https://docs.gtk.org/gtk4/property.Editable.cursor-position.html)
and [editable state](https://docs.gtk.org/gtk4/method.Editable.set_editable.html).

The maintained ui-text-entry fixture imports the shared TextInput source
directly. TextInput is not added to the curated GTK barrel by this foundation
change: field-tooltip behavior, full accessibility states and remaining input
contracts still require qualification. TextArea still needs its multiline host
and row sizing. The fixture separates native signal/controller checks from
its real X11 keyboard phases; IME/compositor/AT-client/pixel qualification
remains open.

### Nested native focus dispatch

Octane 0.14.0's public dispatchEvent opens an event scope when none is active
and otherwise uses the active priority and handler snapshot. The GTK renderer
previously wrapped every descriptor delivery in eventScope(listener.priority).
A discrete Clear action then focusing its entry synchronously tried to open a
default focus scope and failed with a nested-priority error. Descriptor delivery
now calls dispatchEvent directly. The maintained text fixture forces focus
from a sibling during Clear and requires the current onFocus callback, as well
as rejecting event-handler failures in stderr. This fixes renderer integration
with the upstream event contract; it does not change Octane or weaken its
priority invariant. Raw imperative gesture callbacks retain their existing
continuous scope.

Feedback observations: 31a0040a-2761-4412-a48b-33fa042b7fa8 (text-ref/readonly
expectations), f80486ca-2c44-48b2-a191-24f9e1f86b99 (GTK cursor wrapper), and
bc2d9543-7e13-4fc4-91ed-f1efe7b6b8e4 (nested focus delivery).

The final combined real-Linux renderer suite passes all 34 tests without skips
(guest /tmp/gtk-text-ref-test-final.log), including 51 text-entry assertions and
the earlier real X11 press/drag, pull and wheel fixtures. The final expanded
renderer/dependent typecheck passes eight tasks
(andromeda /tmp/gtk-text-ref-types-final.log). Recipes and all 12 release notes
validate. The existing broad native batch-observer and docs-site parser
failures are unchanged; this slice adds no mobile OS runtime qualification.

## Universal portal target ownership

The GTK driver's portals.prepareTarget capability registers root-scoped target
handles with reference-counted release. Preparation validates and registers the
target without creating widgets, changing native parents or running effects.
Aborted preparation releases speculative registrations. Commit resolves the
handle into the existing owned layout node, root host, or a viewless synthetic
boundary whose portalHost points to an external Gtk.Box/Fixed/Grid.

The synthetic boundary carries CSS and ordered logical children without
installing providers or imperative ref methods on a caller-owned widget.
External insertion finds the next managed native sibling, preserving foreign
children. Reattaching a viewless range moves only its first physical descendants;
children already nested inside those widgets stay there. Each descendant's own
Fixed/Grid placement props are used, including subsequent updates. Existing
Mason targets join the original owned layout graph, preserving ordinary children.

Octane's universal core retains logical provider/state/effect ownership while
its host commands move physical ranges. CSS inheritance follows physical layout
ancestry. Runtime target changes retain widgets and local state. Portal removal
and root unmount release registrations and clear refs/effects while leaving
caller-owned target widgets and foreign children intact. The target must outlive
its portal content. Destroyed owned refs and foreign root handles are rejected.

Only local multi-child layout targets are supported: Box/Fixed/Grid, the root
layout host, and owned Mason/viewless layout refs. Single-child widgets are
rejected before mount; serialized transport targets have no local GtkWidget
identity and are rejected. These are explicit driver boundaries, not upstream
claims that tooltip/dialog behavior is impossible. The shared UI overlay
components remain unqualified until their focus, dismissal and geometry are
implemented and tested.

The maintained ui-portal fixture uses the shared native-portal helper and real
GJS/GTK widgets. It checks provider updates, keyed range order, state and widget
identity during target changes, aborted preparations, foreign child preservation,
owned Mason/viewless/root targets, external CSS refresh, Fixed/Grid placement,
foreign handle rejection and idempotent cleanup. Controller dispatch proves
component event ownership, not OS input or hit testing. No screenshots, AT-client
or pixel qualification is involved.

The combined real-Linux renderer suite passes all 35 tests without skips,
including 48 portal assertions (guest /tmp/gtk-portal-combined-final.log).
The portal fixture uses GTK 4.14.5/GJS 1.80.2 on Ubuntu 24.04 amd64 with real
XplatMason and private Xvfb. It checks native widget properties and controller
dispatch; the existing press/drag, pull, wheel and text-entry fixtures retain
their separate actual X11 input evidence. The expanded renderer/dependent
typecheck passes eight tasks (andromeda /tmp/gtk-portal-types-final.log).
Recipe structure/local links and all 13 release notes validate. No mobile OS,
IME, AT-client, Wayland or pixel evidence is added by this portal fixture.

## GTK 4.14.5 accessible-list constructor guard

Upstream GTK 4.14.5's gtk_accessible_list_new_from_array checks
accessibles == NULL || n_accessibles == 0, rejecting a nonempty accessible
array. The installed GTK 4.14.5 GIR exposes that constructor to GJS as
Gtk.AccessibleList.new_from_array; passing one real GtkWidget produced the
same GTK critical assertion in the ui-tooltip fixture
(guest /tmp/gtk-tooltip-runtime-third.log). This is a native guard failure,
not an inability of GJS to marshal the widget array.

The [versioned GTK source](https://raw.githubusercontent.com/GNOME/gtk/4.14.5/gtk/gtkaccessible.c#L1153-L1180)
contains the guard. The separate new_from_list constructor copies a GList
without that guard and accepts a one-element GJS widget list. The local
Tooltip host uses new_from_list to construct DESCRIBED_BY relation values;
no upstream patch or new dependency is added. Recheck the array constructor
when upgrading GTK; this record only establishes the examined 4.14.5 behavior.
GtkAccessibleList itself is available from GTK 4.14, so the current Tooltip
host rejects older GTK explicitly rather than silently omitting the relation.

## GTK Tooltip ownership and geometry

bindTooltips installs a lazy createTooltip method on retained widget refs.
The UI .gtk leaf calls it after commit, keeps open state in Octane, and renders
its panel through the original root's portal. No new UI dependency or GI import
is added. GtkPopover owns the native surface; Gtk.Box is the portal target and
exposes TOOLTIP. Primitive content is wrapped in shared Text so it becomes a
native label rather than viewless text under a layout widget.

Native motion/focus controllers drive GLib intent timers. A root key controller
dismisses Escape, ancestor adjustment listeners dismiss scrolling, and anchor
unmap/disposal closes. Focus remains in the trigger. A descendant focusable
control receives DESCRIBED_BY while open, then the relation is reset on close.
The wrapper adds no keyboard stop for a nonfocusable trigger. Shared FormField's
unsuffixed Tooltip import permits normal per-platform resolution; its previous
explicit .tsrx import bypassed GTK's leaf.

Mason allocates logical children, while GtkPopover is an unmanaged native child.
Calling present alone on every frame kept the old GdkPopup x coordinate after
an anchor grew from 280 to 420 pixels. The host now observes anchor bounds and
queues popup resize when they change before presenting. The maintained fixture
checks actual GdkPopup coordinate movement as well as the changed anchor width.
It stops the frame observer and adjustment subscriptions on close. Disposal also
cancels pending GLib sources, disconnects controllers and unparents the popover;
stale ref factories and session calls are inert.

GTK compute_bounds uses the target's content origin; its own border rectangle
can start at negative padding coordinates. The fixture verifies 12-pixel native
padding from all four style-context edges and child-to-parent border offsets,
not from an assumed positive child origin. This adds no renderer padding change.

GTK 4.14+ is required by this Tooltip implementation for the introspectable
accessible reference list. This is a host version boundary, not a claim that
GTK cannot show popovers on older releases. Controller dispatch, native metadata
and actual X11 pointer/keyboard evidence are reported separately from AT-client,
Wayland and pixel behavior.

The final combined real-Linux renderer suite passes all 36 tests without skips
(guest /tmp/gtk-tooltip-tests-final.log), including 50 Tooltip assertions with
actual X11 pointer hover/leave, Tab and Escape. Runtime: Ubuntu 24.04 amd64,
GJS 1.80.2, GTK 4.14.5, XplatMason and private Xvfb. The retained prior fixtures
also pass their separate actual press/drag, pull, wheel and text-entry checks.
The expanded UI/renderer/dependent typecheck passes 58 tasks
(andromeda /tmp/gtk-tooltip-types-complete.log); packed exports/declarations pass
six tasks (/tmp/gtk-tooltip-pack.log). Recipe structure/local links, all 14 release
notes and UI barrel synchronization validate. GTK source/generated barrels both
contain 37 values and 57 types; native and GTK Tooltip declarations both take
TooltipProps and return unknown. No mobile OS, AT-client, IME, Wayland or pixel
qualification is added. The existing broad native batch-observer and docs-site
parser failures remain outside this slice's passing evidence.

## Independent GTK accessibility state and field flags

The GTK escape adapter now returns the complete accessibilityState record.
It previously collapsed the record to one NativeScript state string, and the
GTK driver did not bind that prop. A shared renderer synchronizer now runs after
all props in a complete bag. It accepts those legacy strings as well as records,
updates independent states/properties and resets removed values. This allows
one control to report disabled, selected, checked, pressed, busy, expanded,
hidden, invalid, visited, required and readOnly information together.

checked/pressed use GTK tristates, including mixed; invalid accepts boolean,
grammar and spelling tokens. readOnly/required are GTK accessible properties.
GTK's optional booleans, tristates and invalid token values are boxed as
G_TYPE_INT; ordinary boolean states and properties use boolean values. This
matches the examined [4.14.5 value collector](https://raw.githubusercontent.com/GNOME/gtk/4.14.5/gtk/gtkaccessiblevalue.c#L1103-L1173)
and [4.24.1 collector](https://raw.githubusercontent.com/GNOME/gtk/4.24.1/gtk/gtkaccessiblevalue.c#L1175-L1244).
Only 4.14.5 is runtime-tested here; the newer source is not newer runtime proof.

Metadata does not change sensitivity, editability or value. Native insensitive
widgets remain disabled in metadata, noneditable entries remain read-only, and
accessible=false remains hidden even if a record requests false for that flag.
When an explicit native switch checked override disappears, its actual active
state is restored. A WeakMap tracks only managed scalar bindings, so missing
keys can be cleared without retaining roots or widget references. Recreate uses
a fresh widget/cache entry; old weak keys need no global cleanup list.

Shared TextInput forwards resolved disabled, readOnly, required, busy and invalid
flags. The GTK adapter preserves them; NativeScript's existing adapter still
reduces its supported enum and ignores other keys as documented in escape-props.
No GTK TextInput copy or UI dependency is added. Field context supplies the
resolved values, including optional-over-required precedence and combined
label/description/status/disabled-reason text.

The facade adds fixed-signature test helpers for GTK's variadic
check_state/check_property APIs, which GI cannot call directly. They return a
mismatch string or null and are used only by maintained GJS assertions. The
ui-accessibility fixture compares exact native bool/tristate/token/property/text
values, exercises removal and native-state restoration, and verifies shared
TextInput flags. This proves native metadata, not an AT client's announcement,
OS input or pixels. It requires a freshly rebuilt XplatMason typelib.

The final combined Linux suite passes 37 tests without skips, including 58 exact
accessibility comparisons (guest /tmp/gtk-a11y-tests-final.log). The focused
fixture also passes independently (/tmp/gtk-a11y-runtime-first.log). Runtime:
Ubuntu 24.04 amd64, GJS 1.80.2, GTK 4.14.5, XplatMason and private Xvfb. Existing
OS pointer/drag/pull/wheel/keyboard/tooltip fixtures remain passing; this new
fixture itself checks metadata rather than OS input or an AT client. The native
facade rebuild passes with the pinned Linux archive and explicit
XPLAT_MASON_CORE_TARGET=x86_64-unknown-linux-gnu
(guest /tmp/gtk-a11y-native-build.log). GTK's installed GIR marks the original
variadic check_state function introspectable=0.

The expanded UI/renderer/dependent typecheck passes 58 tasks
(andromeda /tmp/gtk-a11y-types-final.log); packed exports/declarations pass six
tasks (/tmp/gtk-a11y-pack.log). Recipes and all 15 release notes validate. Public
UI prop types and the curated 37-value/57-type root surface are unchanged.
No mobile OS, IME, AT-client, Wayland or pixel qualification is added. Existing
broad native batch-observer and docs-site parser failures remain outside this
slice's passing evidence.

## Semantic pressable keyboard ownership

Mason button/link roles are focusable unless accessible=false. Lazy native key
and focus controllers dispatch touch down/up/cancel before tap through the
current universal event registration. Buttons accept Return/KP_Enter/Space;
links accept Return/KP_Enter. Modifier shortcuts and focused descendant input
remain native. Autorepeat does not duplicate press-in. Native Gtk.Button keeps
its own key bindings. Shared Pressable now forwards disabled to isEnabled so
native sensitivity also prevents focus and pointer input.

A deferred event records its listener generation. Replacement/removal/disposal
invalidates queued dispatch instead of calling a retired universal registration.
A generation counter survives host recreation; cleanup clears registrations.

GTK 4.14.5's [gtk_widget_set_accessible_role](https://github.com/GNOME/gtk/blob/4.14.5/gtk/gtkwidget.c#L848-L870)
rejects writes after its AT context is realized, even when the value is unchanged.
The renderer skips equal role writes and uses Octane 0.14.0's existing
updates.classify='recreate' protocol for a changed normalized explicit role.
The core rebinds public refs. The renderer reconnects retained event descriptors
because the ordinary host path in Octane 0.14.0 does not replay unchanged
descriptors after recreation (universal-core.ts, descriptorChanged in the normal
event planning loop; collapsed-template paths do replay). Later event commands
can replace or remove the restored bindings. This renderer adaptation remains
until all upstream recreation paths replay current descriptors. The renderer retains
logical children and restores the old focused child delegate, or focuses the
replacement widget when possible. A role reset restores the new widget's native
default instead of assigning enum zero (GTK ALERT). This host replacement is a
local adaptation to GTK's immutable realized role; review when GTK changes that
restriction. It does not promise native widget identity across role changes.

Qualification: the full Linux renderer suite passes 38 tests without skips
(guest /tmp/gtk-press-keys-tests-final.log), including 48 keyboard assertions.
The final focused fixture adds three retained-child/focus-delegate checks and
passes 51 assertions with actual X11 Tab/Return/Space/cancellation input
(/tmp/gtk-press-keys-focused-final.log). Runtime: Ubuntu 24.04 amd64,
GJS 1.80.2, GTK 4.14.5, XplatMason and private Xvfb. This is real Linux evidence,
not the Homebrew stand-in. No screenshots or AT-client/IME/Wayland/pixel evidence
were collected.

UI/renderer/dependent typechecks pass 58 tasks
(andromeda /tmp/gtk-press-keys-types.log); subsequent renderer/fixture changes
pass the expanded eight-task check (/tmp/gtk-press-keys-types-complete.log).
Packed exports and declarations pass six tasks (/tmp/gtk-press-keys-pack.log).
Recipes, all 16 release notes, synchronized UI barrels, formatting and whitespace
checks pass. Final source-only changes after these checks format the TSRX
fixture; behavior is unchanged. Existing broad native batch-observer and
docs-site parser failures remain outside this slice's passing evidence.

## TextInput field width and status qualification

Shared TextInput applies width to its bare shell when no FieldContext owns the
outer width. Its automatic FormField receives statusVariant, read-only, loading
and size. Percentage width is applied by one owner rather than both wrappers.
The clear control and label-help trigger now declare button roles. GTK's status
policy preserves tooltip; the default touch policy keeps the documented detached
fallback. A status tooltip uses a focusable 20-dip glyph and existing Tooltip
ownership. Switching attached/detached/tooltip presentation keeps the control in
the same FieldProvider slot, preserving its native entry and uncontrolled text.

The maintained ui-field-chrome fixture passes 44 assertions on real Ubuntu
24.04 amd64, GJS1.80.2, GTK4.14.5, XplatMason and Xvfb
(guest /tmp/gtk-field-chrome-first.log). It checks native allocated absolute and
percentage widths, wrapper classes, status portal updates/disposal, and actual
X11 Tab/Return/Escape access to clear, label help and validation status. Native
regressions pass 58 Node checks plus 29 selected Vitest assertions across
forms-layout, state-roles and text-input
(andromeda /tmp/gtk-field-chrome-native-tests.log). These native adapter tests
are not iOS/Android device evidence.

This is further direct-source TextInput qualification, not a GTK root export.
Return-key caption hints, remaining common props and inherited size/state
interactions, retention when automatic chrome appears/disappears, IME,
AT-client/Wayland and pixels remain open. TextArea still needs multiline and
row/growth behavior. The curated root remains 37 values and 57 types. No recipe
workflow changes in this slice; the maintained source fixture is the proving
harness.

## GTK Entry return-key captions

GTK4.14.5's installed Gtk-4.0.gir Entry and internal Text property lists expose
input-purpose, input-hints and activates-default, but no per-field Return/OSK
action-caption selector. The [GTK4.24.1 Entry API](https://docs.gtk.org/gtk4/class.Entry.html),
[InputPurpose](https://docs.gtk.org/gtk4/enum.InputPurpose.html) and
[InputHints](https://docs.gtk.org/gtk4/flags.InputHints.html) have the same relevant
boundary. This is installed metadata and current upstream API/source evidence;
4.24.1 and an on-screen keyboard were not run. It does not prove that a custom
OSK or compositor-specific protocol could never implement action captions.

TextInput returnKeyType's done/next/go/search/send captions therefore have no
direct Gtk.Entry mapping in the current renderer. Native Return activation and
onSubmit are separately proven by the text-entry fixture. Do not map next to
automatic focus advancement or activates-default: those change behavior rather
than naming the key. The renderer now emits a specific once-per-runtime caption diagnostic;
Return submission is preserved and the caption subset is explicit. Revisit if
GTK adds an introspectable per-entry action hint or a platform leaf owns the
external OSK lifecycle. This limitation remains open rather than being hidden
by the field-width/status work.

Final combined evidence: 39 Linux renderer tests pass without skips, including
44 field-chrome assertions and 51 semantic keyboard assertions
(guest /tmp/gtk-field-chrome-tests-final.log). The expanded UI/renderer/dependent
typecheck passes all 58 tasks (andromeda /tmp/gtk-field-chrome-types.log).
Recipes, UI barrel synchronization, all 17 release notes, formatting and
whitespace validate. Only a multiline JSX attribute formatting change followed
the runtime/type checks; behavior and public prop types are unchanged.

Packed export/declaration validation also passes six tasks
(andromeda /tmp/gtk-field-chrome-pack.log). Existing broad native batch-observer
and docs-site parser failures remain outside this slice’s passing evidence.

## Stable native TextInput ownership

Adding or removing an automatic label previously switched TextInputControl
between component branches. A real X11 edit followed by label insertion fails
on the previous source because native entry/public-handle identity changes
(guest /tmp/gtk-entry-lifecycle-before.log). That is an observed remount; the
old branch structure also created a fresh uncontrolled state owner.

Standalone native TextInput now always mounts the same automatic FormField,
even when none of its chrome is visible. Inside an existing FieldContext it
still uses the existing field owner. Width belongs to that outer owner; the
control no longer repeats it on its shell. The automatic wrapper receives
resolved field props, so inherited size and state match the editor. The inner
control receives the original props so description/status hints are resolved
once rather than concatenated twice. The tradeoff is one neutral layout view
for a previously bare standalone input.

The focused real-Linux fixture passes 56 checks after the fix
(/tmp/gtk-entry-lifecycle-after.log), including actual X11 typing followed by
label insertion/removal, exact entry/ref/selection/focus retention, inherited
size updates and explicit size precedence. Existing clear/help/status keyboard
checks remain in that fixture. Native object-driver regression coverage now
queries the editor and clear label instead of assuming a wrapper depth; it adds
an edited-state retention regression. Broad native tests pass 453 Vitest cases
and fail the same previously recorded batch-observer expectation that an
observer exception escapes; its test/config/lockfile/canonical Octane patch
remain unchanged from the task base. The task's prior note records the same
isolated failure. This is not a passing broad-native-suite claim.

TextInput remains direct-source while remaining input-purpose/return-caption
and common-prop qualification proceeds. No GTK root export, recipe workflow,
IME, AT-client, Wayland, mobile-device or pixel qualification is added here.

Final evidence: full real-Linux renderer suite passes all 39 tests without
skips, including the 56-check lifecycle/field fixture
(/tmp/gtk-entry-lifecycle-tests-final.log). The final focused fixture adds
first-validation-message insertion/removal and passes 59 checks with actual
X11 typing and clear/help/status keyboard input
(/tmp/gtk-entry-lifecycle-focused-final.log). Runtime remains Ubuntu24.04 amd64,
GJS1.80.2, GTK4.14.5, XplatMason and private Xvfb. UI/renderer/dependent typechecks
pass 58 tasks (/tmp/gtk-entry-lifecycle-types.log); the final fixture changes
pass the expanded eight-task renderer check
(/tmp/gtk-entry-lifecycle-types-final.log). Packed declarations/exports pass six
tasks (/tmp/gtk-entry-lifecycle-pack.log). Focused native tests pass 58 Node
checks and 30 Vitest cases (/tmp/gtk-entry-lifecycle-native-focused.log).
Recipes, UI barrel synchronization, 17 release notes, formatting and whitespace
pass. Root remains 37 values and 57 types; no new UI dependencies or public prop
types. The broad-native batch-observer failure and docs-site parser failure
remain outside passing evidence.

## GTK TextInput root qualification

The curated root adds TextInput with the native TextInputProps and
TextInputHandle, plus FieldControlProps, FieldControlSize, FieldStatusInfo,
FieldStatusType and FieldStatusVariant. FieldStatusInfo preserves the native
barrel's alias; FieldStatus names a different component and is not added.
Source/generated shape checks compare every current GTK value and all seven
new type exports against the native barrel. Availability is now 38 values
and 64 types; earlier counts above describe their commits.

Maintained text-entry, field-chrome, accessibility and Tooltip fixtures now
import TextInput from the curated root. The focused text-entry fixture passes
89 real-Linux checks (/tmp/gtk-textinput-root-focused.log), including native
computed placeholder colors and resets, all six input purposes, custom classes,
testID/native-id fallback, leading icon/node/removal, controlled/native text
writes, repeated rejected insertions, accepted edits, selection/focus, clear,
Return and lifecycle ownership. Signal dispatch is distinguished from actual
X11 typing/navigation/submission; no IME, OSK, AT-client, Wayland or pixel proof
is implied.

A leading-content change previously remounted the unkeyed textfield while
the imperative handle still referred to the old widget. Comparing only the
handle to a captured handle missed that; comparing container.nodes' mounted
widget reproduces the failure (/tmp/gtk-leading-identity-before.log). The
editor now has a stable host key. This also resolves the misleading placeholder
color failure that read a detached old editor; no CSS-provider workaround is
needed.

Controlled edits now increment an edit revision read by the existing text
write effect. That reconciles the parent's current value even if it rejects
the same invalid text repeatedly without changing props. A single GtkEditable
insertion reproduces the old failure (/tmp/gtk-controlled-insert-before.log).
GTK4.14.5 [set_text](https://github.com/GNOME/gtk/blob/4.14.5/gtk/gtkeditable.c#L567-L579)
composes deletion and insertion; the initial bulk-replacement probe could give
the parent an accepted transition before the invalid insertion. Single insertion
and actual typing provide the rejection evidence.
The corrected probe and actual X11 reject/accept flows pass after reconciliation.
Native object-driver tests now mutate the actual field text before dispatch
instead of assuming a synthetic event had mutated it.

NativeScript core 9.1.3 maps number to iOS NumbersAndPunctuation and Android
signed/decimal numeric flags; decimal uses DecimalPad on iOS and equivalent
numeric flags on Android. GTK NUMBER is therefore retained for both, rather
than inferring DIGITS from web inputMode=numeric. GTK's purpose is a hint,
not text validation. The pinned [iOS source](https://github.com/NativeScript/NativeScript/blob/9.1.3/packages/core/ui/editable-text-base/index.ios.ts#L48-L54) and
[Android source](https://github.com/NativeScript/NativeScript/blob/9.1.3/packages/core/ui/editable-text-base/index.android.ts#L219-L226) were inspected through opensrc; no iOS/Android device input-method proof is added.

GTK4.14.5 Entry/Text GIR and GTK4.24.1 API expose no per-field action-caption
selector. returnKeyType now has a specific once-per-runtime diagnostic instead
of repeated ignored-prop warnings. All five hints preserve one Return callback
and current focus in the maintained fixture; next is not mapped to navigation.
The exact caption boundary remains documented under GTK Entry return-key captions.
Remaining common-renderer/visual/input-method qualification and all other
unqualified UI families remain part of the full goal.

Final GTK TextInput evidence: all 39 Linux renderer tests pass without skips
(guest /tmp/gtk-textinput-root-tests-final.log), including the 89-check entry
fixture, 59 field-chrome checks, 58 native accessibility comparisons and the
existing pointer/keyboard/scroll/portal/tooltip checks. The final focused entry
fixture adds actual X11 typing into a programmatically selected middle range
and passes 92 checks (/tmp/gtk-textinput-root-middle.log): controlled text and
caret remain correct and one native edit reports onChange once. Selection
creation in this case is programmatic; no OS selection-gesture claim is added.
Runtime: Ubuntu24.04 amd64, GJS1.80.2, GTK4.14.5, XplatMason and private Xvfb.

Expanded UI/renderer/dependent typecheck passes 58 tasks
(andromeda /tmp/gtk-textinput-root-types-final.log). All GTK runtime value
signatures and the seven new public type aliases match the native barrel.
Packed exports/declaration graph passes six tasks
(/tmp/gtk-textinput-root-pack.log). Focused native checks pass 58 Node tests
and 31 Vitest cases (/tmp/gtk-controlled-native-focused-second.log). The broad
native suite passes 454 and fails the same recorded batch-observer exception
expectation (/tmp/gtk-textinput-root-native.log); that suite is not reported
as passing. Recipes, all 17 release notes, UI barrel sync, formatting and
whitespace pass. No new UI dependency, IME/OSK/AT-client/Wayland/mobile-device/
pixel or packaged-consumer qualification is added.

Affected recipe coverage: text-entry AC1 has the scoped GTK editing evidence
above; the remaining text-entry criteria retain composition/multiline, public
Field/InputGroup/NumberInput, keyboard/overlay and modal gaps. component-refs
has object-handle and mounted identity evidence; its complete ref-form/cleanup/
composition criteria remain unqualified on GTK. linux-gtk-package keeps its
artifact boundary and has no new packaged-consumer execution. Full criteria
and target lists are retained; GTK assessments belong in gtk_recipe_checks.

## Multiline buffer foundation

The textview intrinsic owns a real Gtk.TextView and its Gtk.TextBuffer. The
private adapter translates its native insert/selection-bound marks into the
same character-offset editable interface used by controlled textfield writes.
Both preserve Unicode ranges and the active edge, clamp after shorter writes,
suppress programmatic echoes, and cancel delayed selection repair on native
input or disposal. Buffer changed handlers connect to the buffer and disconnect
when the owning node retires. Public .text setters become inert on disposal.

Native sensitivity and editability remain independent. Read-only accessibility
metadata now follows either Entry or TextView. Input purpose and spellcheck
hints restore defaults for removed or explicitly undefined properties.
Return stays native multiline editing unless done/send has a submit handler;
unmodified Return is then consumed once by that handler. Shift+Return retains
newline behavior and Tab navigates focus.

Sources: [TextView](https://docs.gtk.org/gtk4/class.TextView.html),
[ordered buffer selection](https://docs.gtk.org/gtk4/method.TextBuffer.get_selection_bounds.html),
[insert and bound mark updates](https://docs.gtk.org/gtk4/method.TextBuffer.select_range.html).
No per-field Return caption is exposed by the inspected GTK 4.24.1 TextView
API; runtime behavior here is GTK 4.14.5. Leave captions unsupported and revisit
that boundary if GTK adds an action-caption API.
The warning describes that API boundary rather than claiming tested OSK behavior.

The maintained ui-text-view fixture distinguishes native buffer insertion and
programmatic selection from X11 keyboard replacement, Return and Tab input.
This foundation does not export TextArea. Placeholder, font-based row sizing,
bounded growth/internal scrolling, maxLength, automatic field ownership,
full component API parity and IME/AT-client/Wayland/pixel evidence remain open.

Qualification for this slice: the focused Linux fixture passes 59 assertions
on GJS 1.80.2/GTK 4.14.5, including actual X11 keyboard input. The renderer and
its dependents pass all eight Turbo typecheck tasks. Recipe links, release-note
validation and formatting/whitespace checks pass. All 40 maintained renderer tests pass
with no skips (/tmp/gtk-textview-full.log in the guest). These are real Linux guest
checks on andromeda, not Homebrew stand-in evidence. No screenshots were
captured or inspected.

## TextArea row sizing on GTK

The maintained ui-text-area fixture mounts shared TextArea source, not a new
GTK component copy or root export. The GTK fitting helper uses the widget's
Pango font layout in logical pixels. The old 24-pixel fallback allocated 72
pixels for three rows even when GTK measured a 32-pixel font line; the fixture
records that mismatch in /tmp/gtk-textarea-rows-before.log.

Gtk.TextView.get_line_yrange is not a reliable fitting input during load:
the diagnostic run saw 0 then 51 before allocation, while the settled line
and the independent Pango layout both measured 32. Pango avoids that buffer
layout cache. GTK still validates changed font CSS across frame boundaries;
the helper refits over two bounded frames, then removes its frame callback.
It also cancels pending callbacks and native subscriptions on cleanup/unmap.

The renderer ref's fontChanged subscription reports effective font-style
changes from ancestor selectors, inherited values and local writes. It is lazy: widgets without subscribers allocate
no observer set. Row min/max changes do not trigger this font event.
The GTK helper uses that notification to schedule measurement after GTK's
style validation; the event itself does not promise already-updated metrics.

NativeScript keeps its platform font metrics (iOS font.lineHeight, Android
getLineHeight converted to dips) and a loaded listener owned by the fitting
effect. Both helpers clear obsolete row caps and release generated row limits
when explicit height or authored min/max constraints take ownership. The GTK
helper clears local ref overrides so authored CSS lengths stay declarative.
The original row-cap/explicit-height bug is visible in stable v0.17.1's
TextArea source; a fix note covers that shared native behavior.

Runtime geometry checks cover default fixed rows, a long value within fixed
rows, internal adjustment range, minimum/capped growth, shrink, cap removal,
mode changes, explicit height, authored bounds, direct and ancestor font
changes and restoration, retained widget identity, and observer/ref disposal.
An internal adjustment range is not actual wheel/scroll-input evidence.
Placeholder, maxLength, controlled rejection, automatic field ownership,
custom line-spacing behavior, internal scroll input, IME and complete TextArea
API qualification remain open before adding TextArea to index.gtk.ts.

Sources: [GTK widget Pango layouts](https://docs.gtk.org/gtk4/method.Widget.create_pango_layout.html),
[Pango pixel extents](https://docs.gtk.org/Pango/method.Layout.get_pixel_size.html).
Actual platform evidence is the andromeda Ubuntu guest, GJS 1.80.2/GTK 4.14.5,
not a Homebrew stand-in or a phone run.

Verification for this slice: all 41 maintained renderer tests pass on the
andromeda Linux guest with no skips; the sizing fixture has 24 native-geometry
assertions. All 58 affected/dependent Turbo typecheck tasks, the 58 Node native
regressions plus six selected Vitest cases, and six UI package-integrity tasks
pass. Recipe, barrel, release-note, formatting and whitespace checks pass.
The full broad native Vitest suite was not rerun; its previously recorded
batch-observer failure remains separate. No phone, OS scrolling, IME, AT-client,
Wayland, HiDPI or image evidence is claimed by the sizing fixture.
Logs: /tmp/gtk-textarea-rows-full.log in the guest, and
/tmp/gtk-textarea-rows-types-final.log, /tmp/gtk-textarea-rows-native-final.log
and /tmp/gtk-textarea-rows-pack-final.log on andromeda.

## Native multiline scrolling and physical hosts

A capped Gtk.TextView had a vertical adjustment range and native keyboard
navigation, but no wheel handler in the standalone configuration.
The maintained X11 probe passed Ctrl+End/Home and then failed wheel scrolling
(/tmp/gtk-textarea-scroll-before.log). TextView now lives in a private
Gtk.ScrolledWindow, which supplies GTK's scrolling behavior. The public ref,
text/selection facade, CSS body, focus, accessibility metadata and text events
remain on the real Gtk.TextView.

| ElementNode field | Owner                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| view              | Native editor and public reference                                                                      |
| layoutView        | Private scrolling host, mount/measure, size, visibility, sensitivity, alignment, opacity and transforms |

Non-composite nodes keep their original single-widget path. Mason measures
and allocates the physical host; Box, Fixed and Grid placement, viewless
projection, detach/reinsert and role recreation use the same physical-view
selector. The factory hands viewport ownership to the node once, then clears
its temporary weak-map entry. The CSS provider styles the editor body and,
outside Mason, applies a separate scoped transform to the physical host.
Opacity is applied once to the complete control.

GTK automatically inserts a Gtk.Viewport when a scrolled window receives a
non-Scrollable child. Unparenting that child directly leaves its child slot
stale: subsequent set_child calls can return without reattaching it. The
host-matrix probe observed a detached scrolling host while the parent's
get_child still returned Gtk.Viewport (/tmp/gtk-textarea-scroll-host-diagnostic.log).
Detach now clears the owning scrolled window's child via its public API.
[GTK 4.14.5 source](https://github.com/GNOME/gtk/blob/4.14.5/gtk/gtkscrolledwindow.c#L3891-L3947)
defines this automatic viewport and unchanged-child behavior. This is a local
adapter ownership correction, not an upstream GTK defect. The old direct
unparent branch is present in stable v0.17.1, so a fix note records it separately
from the new multiline viewport support.

The source TextArea fixture exercises actual X11 keyboard and wheel input,
read-only scrolling, disabled blocking, and app scrolling outside the editor.
Its host matrix covers Box, Fixed, Grid and ScrolledWindow with viewless roots,
size/position changes, transform/opacity scope, keyed replacement and role
recreation with restored focus and text-change bindings. The previous
24-assertion sizing evidence remains historical; the added input/host checks
do not promote TextArea to the GTK UI root. Placeholder/maxLength, stable
automatic field/controlled ownership, custom line spacing, IME/OSK/AT-client,
Wayland/touchpad gestures, HiDPI and visual parity remain outside qualification.

Verification for the scrolling-host slice: all 41 Linux renderer tests pass
with no skips; ui-text-area has 106 assertions and ui-text-view retains 59.
Ctrl+End/Home and wheel phases use actual X11 input; the native host matrix,
role changes and buffer insertions are programmatic checks, not OS-input proof.
All eight renderer/dependent Turbo typecheck tasks pass. Recipes, barrel shape,
release-note validation, formatting and whitespace checks pass. No UI source
or public GTK barrel export changes; no new dependency, native facade rebuild,
phone, touchpad, Wayland, HiDPI, AT-client or image claim.
Logs: guest /tmp/gtk-textarea-scroll-full.log and andromeda
/tmp/gtk-textarea-scroll-types-final.log. Earlier failure logs remain historical
evidence, including the stale viewport diagnosis.

## Multiline placeholder overlays

GTK 4.14.5 on the Linux guest has no Gtk.TextView placeholder property; the
[published TextView API](https://docs.gtk.org/gtk4/class.TextView.html) also
exposes none. The adapter now owns a Gtk.Overlay
around the existing scroller, with a Gtk.Label overlay excluded from preferred
measurement and pointer targeting. The public ref remains the Gtk.TextView.
The label appears only for empty buffers, including read-only editors;
replacing or removing hint updates both the label and the editor's native
PLACEHOLDER accessibility property. The label has PRESENTATION semantics,
while the editor's accessible name remains independently authored.

The overlay's child-position callback uses the editor's visible rectangle and
buffer-to-widget coordinate conversion, so CSS padding and borders align the
hint with the text origin. Typography and color are copied to the private
physical host; background and border stay on the editor. placeholderColor
overrides a translucent text-color default. Disposal disconnects the buffer
and allocation signals, including role recreation.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function Notes() {
	return (
		<textview
			text=""
			hint="Write a note"
			accessibilityLabel="Notes"
			style={{ width: 260, height: 120, placeholderColor: '#777' }}
		/>
	)
}
```

GTK uses different enums for TextView and Label wrapping: Gtk.WrapMode.WORD_CHAR
is 3, while Pango.WrapMode.WORD_CHAR is 2. The first probe rejected the wrong
enum before mounting; importing Pango fixes the constructor. This is an adapter
correction, not an upstream limitation. GTK's
[overlay measurement contract](https://docs.gtk.org/gtk4/class.Overlay.html)
and [child-position callback](https://docs.gtk.org/gtk4/signal.Overlay.get-child-position.html)
supply the layout mechanism. Revisit this adapter when GTK adds a native
TextView placeholder API with equivalent sizing, styling and accessibility.

The focused Linux run passed 121 TextArea assertions, including padded origin,
long-hint size stability, color, metadata, read-only visibility, replacement,
removal and actual X11 click-through. Raw TextView retained all 59 checks in
the preceding run. The first full run passed 41 of 42 tests and failed a newly added reset
assertion: it expected the unthemed translucent fallback, but chrome.css
explicitly defines placeholder-color for .vx-textarea. Native readback after
removal was red=78/255 and alpha=1, rather than the editor's red=10/255 with
half alpha. The corrected assertion checks the resolved theme color exactly;
it does not replace the expected result with a weaker color-change check.
The corrected focused run passed all 125 assertions. One subsequent native
Box allocation check was timing-sensitive after window-child replacement;
the same dimensions passed on rerun. The fixture now waits up to three
seconds for those exact dimensions rather than assuming a 160ms frame delay.
This does not qualify textAlign, bidirectional text, custom line spacing,
maximum length, shared field/controlled ownership, IME, AT clients or visual
parity, and does not promote TextArea to the UI root.
Logs: guest /tmp/gtk-hint-second.log and /tmp/gtk-hint-geometry.log.

Final verification: all 42 Linux renderer tests pass with no skips, including
TextArea125 and raw TextView59. The added checks cover theme color reset and
retired-buffer listener cleanup as well as the earlier hint cases. All eight
renderer/dependent Turbo typecheck tasks pass. Recipes, barrel shape, 20
release notes, formatting and whitespace checks pass. No UI source, root
export or dependency changes. No phone, IME, AT-client, Wayland, HiDPI or image
claim. Logs: guest /tmp/gtk-hint-full-final.log; andromeda
/tmp/gtk-hint-types-complete.log. Earlier failing logs remain diagnostic
history rather than current pass evidence.

## Explicit multiline dimensions in native hosts

The earlier placeholder slice treated an intermittent Box allocation failure
as a frame-settling issue. It recurred after the bounded wait: authored160x80
became160x187. A long-content fixture then reproduced the problem reliably.
Twelve lines produced editor minimum/natural height204; the scrolling host
reported minimum46/natural204, and the physical overlay minimum80/natural204.
Despite START alignment and expansion=false, the native Box allocated360px
height. This is a sizing-policy error, not evidence that three seconds of
waiting was insufficient.

GTK 4.14.5 follows its documented contracts:
[set_size_request](https://docs.gtk.org/gtk4/method.Widget.set_size_request.html)
sets a minimum, and
[propagate-natural-height](https://docs.gtk.org/gtk4/property.ScrolledWindow.propagate-natural-height.html)
requests the child's natural size. The adapter had enabled natural-size
propagation unconditionally. It now disables propagation on each axis with
an explicit numeric width or height, and restores it when that dimension is
removed. Auto-sized controls can still grow. This is a local adapter fix
using GTK's sizing policy, not an upstream GTK defect.

The native host fixture now uses twelve lines in Box and checks a long
unbroken word, removal of both dimensions, and restoration of the authored
size. Existing host position, transform, role recreation, ref/focus and
buffer-listener assertions remain. Focused long-content checks pass on GTK 4.14.5. Final integration checks,
including the dimension-transition cases, are recorded below.
Logs: guest /tmp/gtk-controlled-long-host-before.log and
/tmp/gtk-controlled-long-host-after.log.

## Controlled multiline edit transactions

Actual X11 selected-range replacement exposed two callbacks for one edit:
replacing b in abc with X reported ac, then aXc. The raw buffer fixture had
only required a final matching callback, so its older59-assertion evidence
did not establish one-callback semantics. The stricter maintained assertion
fails on the previous implementation in /tmp/gtk-controlled-before.log.

The adapter now groups TextBuffer changed signals between
[begin-user-action](https://docs.gtk.org/gtk4/signal.TextBuffer.begin-user-action.html)
and [end-user-action](https://docs.gtk.org/gtk4/signal.TextBuffer.end-user-action.html).
It dispatches the final value after the end signal's default handler; direct
buffer changes outside an action remain immediate. Muted owner writes do
not create a pending event. Nested/empty actions and disposal while an action
is pending have maintained native-buffer checks. Real edits cancel pending
selection repair as soon as a grouped change arrives. These GTK signals are
the intended user-operation boundary; multiple low-level changed signals
are not an upstream bug.

TextArea's native shared leaf also depended only on value for reconciliation.
A rejected edit left value unchanged, so the effect never restored it.
TextArea now increments a per-edit revision when controlled, matching
TextInput's existing path. Expanded object-driver coverage found the same
issue in the independent SearchInput native leaf; it now uses the same
reconciliation rule. The v0.17.1 tag contains both old value-only effects,
so a stable-fix release note covers the two shared iOS/Android components.
The macOS TextArea leaf is separate and is not part of that fix.

The focused Linux run passes TextArea135 and raw TextView65, including actual
X11 middle-selection rejection twice, parent acceptance with retained caret,
one complete callback, nested/empty buffer actions, muted writes and disposal.
Selected native tests pass58 Node checks and6 Vitest tests, including repeated
rejection for TextInput/TextArea/SearchInput. Those tests are object-driver
evidence, not phone or GTK SearchInput component qualification. The three
additional host-size transitions and final full checks are recorded below.
TextArea and SearchInput remain outside the GTK root.
Logs: guest /tmp/gtk-controlled-dimensions.log and
/tmp/gtk-controlled-long-host-after.log; andromeda
/tmp/gtk-controlled-native-final.log.

Final integration verification: all 42 Linux renderer tests pass with no skips,
including TextArea 138 and raw TextView 65. All 58 renderer/UI/dependent Turbo
typecheck tasks pass, as do 58 Node checks plus 6 selected native Vitest tests,
six UI package-validation tasks, recipes, barrel checks, 21 release notes,
formatting and whitespace. The final focused run also passes all 138 TextArea assertions after waiting
for native layout following long-word content replacement
(guest /tmp/gtk-controlled-area-final.log).
No dependency or public GTK export changes. No broad native suite rerun,
phone runtime, composition/IME, AT-client, Wayland, touchpad, HiDPI or image
claim. Full field/width/handle ownership, maxLength, text alignment and custom
line spacing still gate public TextArea qualification. SearchInput's complete
GTK component remains unqualified.
Logs: guest /tmp/gtk-controlled-full.log; andromeda
/tmp/gtk-controlled-types.log, /tmp/gtk-controlled-native-final.log and
/tmp/gtk-controlled-pack.log.

## Multiline length limits

The GTK textview intrinsic now limits inserted text through TextBuffer's
insert-text signal. It counts UTF-16 units (String.length), accepts the prefix
that fits without splitting a surrogate pair (not a grapheme-cluster cap), and
revalidates the borrowed
TextIter after nested insertion. Typed/clipboard changes still use the native
buffer, caret and undo engine. Controlled/imperative owner writes bypass the
edit filter; zero prevents insertion and undefined/Infinity remove the cap.
Disposal disconnects the insertion filter.

The shared native TextArea leaf previously never forwarded its declared
maxLength prop. The v0.17.1 tag also lacks the binding, so a stable fix note
covers iOS/Android. The leaf now forwards a number or explicit Infinity;
an omitted prop must remove a previously active cap. A selected object-driver
test checks finite, zero and removed values.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function ShortNote() {
  return <textview text="" maxLength={200}
    onTextChange={(event) => console.log(event.value)} />
}
```

### NativeScript source and insertion differences

The npm registry identifies @nativescript/core9.1.3 with gitHead
45b3b99afd89f19e799da84203aa19d673f7b20a, also the peeled9.1.3-core tag.
The opensrc cache labeled9.1.3 contained package version9.1.4-next.1.
Even an explicit-commit opensrc fetch had package version9.1.4-next.2 and
differed from the canonical source. The exact upstream package.json at the
registry commit says9.1.3. Do not infer a source pin from the cache path.
The examined iOS TextView file and Android maxLength/keyboardType methods
match the release implementation; those earlier behavior findings stand.

NativeScript9.1.3's
[iOS delegate](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/ui/text-view/index.ios.ts#L158-L164)
rejects a growing replacement that exceeds maxLength. Its Android
[maxLength setter](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/ui/editable-text-base/index.android.ts)
installs the platform's InputFilter.LengthFilter.
[AOSP's filter](https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/core/java/android/text/InputFilter.java)
returns the prefix that fits and avoids splitting a surrogate pair.
GTK follows that prefix policy. Oversized insertion behavior therefore already
differs between native platforms; this is not a uniform upstream contract.

Programmatic values also differ: GTK's facade and the iOS delegate path allow
owner text beyond the edit cap, while Android's native filter can shorten
script writes. Setting Infinity on the Android setter removes all filters,
not just the length filter; combining custom filters needs separate native
qualification. These are source findings for the exact SDK release and AOSP,
not phone-runtime evidence. Xplat forwards the existing native property and
does not replace its platform delegates or filter lifecycle.

### Runtime scope

Focused GTK4.14.5/GJS1.80.2 checks pass TextArea145/raw TextView83. The raw
fixture covers UTF-16/emoji truncation, zero/removal, authoritative owner
writes and retired-filter cleanup. Actual X11 Ctrl+V inserts an oversized
emoji-containing clipboard value into a middle selection, yields one bounded
callback with the native caret intact, and supports Ctrl+Z/Shift+Ctrl+Z after
explicitly enabling native buffer undo. The test also rejects invalid-iterator
warnings. TextArea145 proves accepted/blocked typing, zero and removal through
the shared prop, alongside the earlier hint/row/host/edit checks.

Gdk.Clipboard.set_text is C-only; bindings expose set_value as set. The initial
clipboard probe failed before OS paste because it called set_text. Enabling
undo before an older synthetic owner-write-inside-user-action check also
produced GTK warnings about irreversible actions. The fixture now enables undo
only for the native paste/undo checks. Production controlled callbacks run
after end-user-action; a synthetic muted-write check with undo disabled is
not proof that set_text is valid during an undo-enabled user action.

Selected native tests pass 58 Node checks and 7 Vitest tests. Final full Linux
regression passes all 42 tests with no skips, including TextArea 145 and raw
TextView 83. All 58 affected/dependent typecheck tasks and six UI package
validation tasks pass. Recipes, barrel checks, 22 release notes, formatting
and whitespace pass. TextArea remains unexported pending
stable automatic Field/width/handle ownership, text alignment, custom line
spacing and the rest of its shared props. IME/composition, OSK, AT clients,
Wayland, touchpad, HiDPI and images remain unqualified.
Logs: guest /tmp/gtk-maxlength-first.log, /tmp/gtk-maxlength-input.log,
and /tmp/gtk-maxlength-paste.log; andromeda /tmp/gtk-maxlength-native.log.

Final logs: guest /tmp/gtk-maxlength-full.log; andromeda
/tmp/gtk-maxlength-types.log and /tmp/gtk-maxlength-pack.log.
No new dependency, public GTK root export, native facade rebuild, broad native
suite rerun or phone-runtime qualification.


## Stable multiline fields and native label activation

Adding a label to an uncontrolled TextArea previously replaced its native
editor. The automatic FormField now stays mounted, preserving text, focus,
selection and the public handle across label/description/status changes.
Resolved defaults reach the wrapper and original props reach the control;
percentage widths and accessibility hints are applied once. The wrapper
forwards size, status variant, read-only and loading, while native metadata
includes required/busy/invalid. Loading alone leaves editing enabled.

Native FormField labels were static in v0.17.1 too. They now resolve the
associated control and request focus, skipping disabled fields. Automatic
TextInput and TextArea wrappers pair inputID with an explicit child id.
GTK getViewById follows the receiver's logical subtree, including viewless
nodes, and ignores automation names. Destroyed nodes and disposed receivers
are inert. This follows the existing
[NativeScript 9.1.3 lookup contract](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/ui/core/view-base/index.ts#L120-L149);
it does not invent a Page host.

Actual X11 clicks focus both an automatic TextArea and a nested read-only
editor, as well as the existing TextInput field. Direct-source tests also
cover inherited defaults, explicit child label overrides, hint deduplication,
width removal, busy editing, disabled behavior and stale lookup cleanup.
A cleared accessibility flag can be explicitly false; it need not disappear.
An explicit child label intentionally overrides its parent field label.
Those were corrected test expectations. A missing fixture variable was also
corrected before the final run; it was not a framework defect.

On Linux GTK4.14.5/GJS1.80.2, focused checks pass TextArea195/field chrome61.
The full renderer suite passes all42 tests with no skips. Selected native
tests pass58 Node checks and7 Vitest tests; all58 affected/dependent typecheck
tasks and six UI package validation tasks pass. These are Linux/X11 runtime
checks and native object-driver checks, not phone, IME, OSK, AT-client,
Wayland, HiDPI or visual qualification. TextArea remains outside the GTK root.
Logs: guest /tmp/gtk-textarea-field-final-focused.log and
/tmp/gtk-textarea-field-full.log; andromeda /tmp/gtk-textarea-field-types.log,
/tmp/gtk-textarea-field-native-final.log and /tmp/gtk-textarea-field-pack.log.


## Multiline alignment and resolved pixel rows

The GTK alignment adapter previously skipped textview. It now writes native
TextView justification and the private hint's alignment together, accepting
style textAlign and low-level textAlignment/xalign props. Direction is applied
before alignment so removing RTL can restore logical start in the same update.
Existing label and single-line alignment behavior stays covered by regression.

The spacing probe rendered a native 48px line but Pango's independent font-only
layout measured32px, leaving two rows allocated64px. The GTK fitting helper
now prefers a resolved positive numeric/px/dip lineHeight and retains Pango for
normal font spacing. Resolved ancestor CSS participates; removal restores the
font fallback. The bounded CSS-frame refit and owned cleanup remain intact.
Relative line-height units are not qualified for row fitting.

The initial focused run passed227 assertions. The subsequent full run exposed
an incorrect placeholder geometry assertion: Gtk.Label can keep a full-width
justified Pango layout, so its layout origin alone is not the first glyph's
position. The corrected check includes index_to_pos(0) within that layout;
it preserves the original physical left/right expectation. This is test
measurement correction, not evidence of a renderer alignment defect.
An earlier escaped-newline typo in the CSS fixture prevented one build and was
corrected before runtime; it was not an upstream parser limitation.

All58 affected/dependent typecheck tasks and six UI package validation tasks
pass. Final geometry/full-runtime results are recorded below when complete.
No new dependency or GTK root export. TextArea remains outside the root pending
remaining shared props; IME/OSK/AT, full bidirectional text, Wayland, touchpad,
HiDPI and visual parity remain unqualified.
Logs: guest /tmp/gtk-textarea-spacing-before.log,
/tmp/gtk-textarea-alignment-first.log, /tmp/gtk-textarea-alignment-second.log,
/tmp/gtk-textarea-alignment-full.log and /tmp/gtk-textarea-alignment-geometry.log;
andromeda /tmp/gtk-textarea-alignment-types.log and
/tmp/gtk-textarea-alignment-pack.log.


The corrected focused test passes all232 assertions on Linux with actual X11
input. The added geometry cases cover the placeholder's first glyph under
LTR/RTL start/end plus same-update RTL removal. This does not establish full
bidirectional paragraph/cursor behavior or image parity.


Final regression: all42 maintained Linux renderer tests pass with no skips,
including TextArea232, entry92, raw multiline83 and field chrome61. All58
affected/dependent typecheck tasks, six UI packaging tasks, recipes, barrel
checks, 23 release notes, formatting and whitespace pass. No shared native
leaf changed, so the earlier58 Node/7 selected native tests were not rerun.
Final log: guest /tmp/gtk-textarea-alignment-full-final.log.


## Public GTK TextArea

The curated GTK root now exports TextArea and TextAreaProps. It reuses the
shared native leaf, its GTK fitting helper and the existing renderer textview;
no UI dependency or duplicated GTK component leaf is added. The maintained
fixture now imports TextArea from the public root. Availability is39 runtime
values and65 type-only exports; public props come from the same shared type
as the native barrel.

The native leaf now renders registered leading icons and arbitrary renderable
nodes. A keyed editor survives adding, replacing and removing that content
without losing its handle, uncontrolled text, focus or selection. The root
fixture also checks native focus/blur callbacks, every documented keyboard
purpose and reset, done/send submission and ordinary Return newline behavior.

### Secure multiline input limit

GTK4.14.5 TextView has neither a visibility masking property nor an
invisible-char property. Its ordinary visible/cursor-visible properties do not
provide password masking. This is runtime GObject property introspection in
the maintained GTK fixture, not a screenshot or AT-client observation. The
underlying
[GTK TextView API](https://docs.gtk.org/gtk4/class.TextView.html)
does not supply a secure editor. Xplat leaves secure multiline entry
unsupported and directs callers to TextInput secure.

TextArea inherited secure from TextInputProps but the shared native leaf never
forwarded it. Attempting a direct binding failed declaration emit because the
typed NativeScript TextView vocabulary excludes it. Canonical NativeScript
9.1.3 declarations at commit45b3b99afd89f19e799da84203aa19d673f7b20a confirm
that
[TextView](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/ui/text-view/index.d.ts)
does not expose secure, while
[TextField](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/ui/text-field/index.d.ts)
does. This is source/build evidence for the SDK, not phone-runtime proof.

The shared iOS/Android/GTK TextArea now rejects secure=true before rendering.
GTK's low-level driver also preflights secure textview batches, tracking
pending create/recreate types so rejection precedes every mutation. The test
places an unrelated label create before the invalid field and verifies that
the host and node map remain untouched. Defensive prop handling also rejects
it. Revisit this limit if GTK provides a secure multiline control or the
renderer adopts a separately qualified masked editor. The separate web and
macOS leaves were not changed by this guard; they still need an explicit
shared-contract review rather than an inferred safety claim.

### Qualification and corrections

The public-root focused check passes260 assertions on Linux GTK4.14.5/
GJS1.80.2 with actual X11 typing, Return, click and wheel input. It retains
earlier sizing, maxLength/emoji, placeholder, controlled rejection, field,
native-host/recreation and lifecycle checks. No IME/OSK, AT-client, complete
bidirectional editing, Wayland, touchpad, HiDPI, image/pixel or packaged consumer
claim is added.

The first icon measurement used an unregistered name, check; missing registry
names intentionally render nothing. Using the built-in xplat-check preserves
the same native dimension assertion and passes. The first new native test
expected an asynchronous error callback, but root.render rejects this
prepare-time error synchronously; its corrected assertion verifies the throw
and that no native handle was published. These were fixture expectation
corrections. Selected native tests now pass58 Node checks and8 Vitest tests.
Final full/dependent/package results are recorded below when complete.
Logs: guest /tmp/gtk-textarea-props-first.log,
/tmp/gtk-textarea-props-second.log and /tmp/gtk-textarea-props-root.log;
andromeda /tmp/gtk-textarea-props-native.log and
/tmp/gtk-textarea-props-native-final.log.


Final public-root qualification passes all42 maintained Linux renderer tests
with no skips, including TextArea260. All58 affected/dependent typecheck tasks,
58 Node checks plus8 selected native Vitest tests, six UI package validation
tasks, recipes, barrel checks, 24 release notes, formatting and whitespace
pass. The declaration export uses the same TextAreaProps as the native barrel.
Final logs: guest /tmp/gtk-textarea-root-full.log; andromeda
/tmp/gtk-textarea-root-types.log, /tmp/gtk-textarea-root-pack.log and
/tmp/gtk-textarea-props-native-final.log. The full GTK UI parity goal remains
active; this is one qualified component addition.


## Public GTK SearchInput

SearchInput and SearchInputProps join the curated root, giving40 runtime
values and66 types. The shared native leaf now uses the field resolver and a
persistent automatic FormField, matching TextInput/TextArea ownership. The
textfield keeps a stable key while icons or clear actions change. Its id,
testID, platform escape props and accessible name/hint/state belong to the
editable widget; visual classes/style stay on the search shell.

The previous implementation assigned id/name to its shell and ignored field
context/chrome. The same structure is present in stable v0.17.1. A maintained
real-GJS baseline failed the explicit-control-id check at
/tmp/gtk-search-before.log. Source confirms that descriptions, required/default
state and widths were not wired. No renderer intrinsic or GTK UI fork was
needed: the existing native entry, field, icons and Pressable provide the
behavior.

Clear now uses Pressable with button role and native keyboard focus support.
It is absent when empty, read-only, disabled or hasClear=false. It reports
onChange('') before onClear and restores editor focus. Loading announces busy
without blocking edits. Done/Return captions still follow the existing GTK
limit; SearchInput's actual Return submission is tested, not an OSK caption.

### Parent layout ownership

PowerSearchView's vx-power-search-input class owns flex-grow in its row.
With a persistent field wrapper that class must sit on the explicit FormField
owner, with the resolved size passed through. The shared native caller now
does so. A maintained GTK composition allocates280px to that field and its
search control inside a320px row with a40px sibling. It also checks that an
explicit field does not create a duplicate wrapper. This is geometry evidence
for the integration pattern, not full GTK PowerSearch qualification.

### Runtime and diagnostic corrections

The public-root focused test passes76 assertions on Ubuntu24.04.5 amd64,
GJS1.80.2/GTK4.14.5 and private Xvfb/X11. Actual OS input exercises repeated
controlled rejection, acceptance/caret, Space clearing, disabled and busy
typing, label click and Return submission. Native assertions cover default/
replacement/hidden icons, field widths, focus/backward selection retention,
required/read-only/busy/invalid metadata, description/status deduplication,
nested defaults/name override, row growth, ref replacement and disposal.

The first retention assertions read GtkEntry.get_position for a backward
selection. That wrapper normalizes bounds; get_delegate().cursor_position is
the true active edge, as the existing renderer entryCursor helper and entry
fixture already document. A direct GTK probe and an explicit test precondition
confirmed the measurement mistake. Correcting the getter preserves the exact
cursor/range expectation; it is not a renderer selection fix. Logs:
/tmp/gtk-search-first.log, -second.log, -third.log and -fourth.log. The baseline
fixture also needed to quit its GLib loop before exiting on failure; current
failure cleanup exits promptly.

The native controlled-input fixture's escape-props mock lacked
nativeAccessibilityRole once the SearchInput clear action used Pressable.
Adding that export preserves the real role mapping contract; final selected
tests pass58 Node checks and13 native Vitest tests, including automation IDs.
All58 affected/dependent typecheck tasks pass. Final full/package results are
recorded below when complete.

GTK warns that cornerShape and CSS userSelect/WebkitUserSelect are ignored in
this fixture. This change does not qualify squircle drawing or CSS-driven
selection behavior. IME/OSK, AT clients, full bidi, Wayland, touchpad, HiDPI,
images/pixels and packaged consumers remain unqualified. React Aria presence
rows are unchanged: SearchInput's equivalent already ships; this is platform
qualification and shared behavior, not a new presence-level mapping.

Logs: guest /tmp/gtk-search-before.log, /tmp/gtk-search-root.log and
/tmp/gtk-search-full.log; andromeda /tmp/gtk-search-native-final.log and
/tmp/gtk-search-types.log.


Final SearchInput qualification passes all 43 maintained Linux renderer tests
with no skips, including the public-root 76 checks. All 58 affected/dependent
typecheck tasks, 58 Node checks plus 13 selected native Vitest tests, six UI
package validation tasks, recipes, barrel checks, 26 release notes, formatting
and whitespace pass. The TypeScript checker resolves SearchInput and
SearchInputProps from generated GTK/native barrels to the exact same
declarations; the GTK root has 106 total exports (40 values/66 types).
Logs: guest /tmp/gtk-search-full.log; andromeda /tmp/gtk-search-types.log,
/tmp/gtk-search-pack.log, /tmp/gtk-search-declarations.log and
/tmp/gtk-search-native-final.log. No phone, AT-client, IME or pixel
qualification, and no full PowerSearch GTK claim.

## GTK field and form-layout qualification

The initial shared FormLayout rendered a masonview but invoked NativeScript's
eachChildView, columns and col APIs in an effect. The real-Linux baseline
failed with TypeError: i.current.eachChildView is not a function; both fields
remained stacked. The GTK facade does not promise that legacy grid API.
Existing Grid already demonstrates Mason's declarative auto-placement, so
FormLayout now uses gridAutoFlow column and gridAutoColumns 1fr. Adding or
removing fields updates implicit tracks without assigning child indices.

One Mason host remains mounted for every form direction. FormField likewise
keeps its label container, body and FieldProvider position stable. Before
that change, switching to horizontal-labels failed the maintained
editor/text/liveness retention assertion. The fixed tree retains native
editors, uncontrolled text, focus and public handles as direction changes.
The body preserves four logical pixels between description, control and
status by default; authored rowGap/gap overrides that spacing.

The baseline fixture initially assumed a16px form gap without authoring it.
The fixture now explicitly sets gap16 and checks two292px tracks in600px.
That correction is an authored-style assumption, not a renderer spacing fix.
An older field-chrome test also found field owners by a fixed grandparent
path. It now walks to the vx-field ancestor, preserving all existing width,
state, focus, selection and tooltip criteria.

The new maintained public-root fixture covers vertical, horizontal and
horizontal-labels, dynamic child counts, required/optional inheritance and
removal, native bounds, text/focus/ref retention and disposal. Field and
FormLayout use the same native source and shared props. Native horizontal
labels remain per-field rows rather than a web-style shared label column;
set form gaps explicitly. No new dependency or GTK UI leaf is needed.

Logs: guest /tmp/gtk-form-layout-before.log,
 /tmp/gtk-form-layout-grid.log, /tmp/gtk-form-layout-directions.log,
 /tmp/gtk-form-layout-stable.log, /tmp/gtk-form-layout-final.log and
 /tmp/gtk-form-layout-full.log. The first stable chrome failures measured the
new body as the field owner; the later corrected run is authoritative.
Andromeda type logs distinguish the rejected rowGap/gap access on an inferred
width-only object from the corrected authoredStyle record. These are build
and native geometry/context assertions; phone runtime, IME, AT-client output,
images/pixels and packaged consumers remain unqualified.

Final qualification passes all44 maintained Linux renderer tests with no
skips, including28 public-root form checks and the existing61 field-chrome,
260 TextArea and76 SearchInput checks. All58 affected/dependent typecheck
tasks,58 Node checks plus29 selected native Vitest tests and six UI package
validation tasks pass. Recipes, barrels,28 release notes and focused
format/whitespace checks pass. Generated GTK/native barrels resolve Field,
FormLayout and all five associated types to identical declarations. The GTK
root now has113 exports:42 values and71 types. Logs: guest
/tmp/gtk-form-layout-full.log; andromeda /tmp/gtk-form-layout-types-final.log,
 /tmp/gtk-form-layout-native-final.log, /tmp/gtk-form-layout-pack.log and
 /tmp/gtk-form-layout-declarations.log. InputGroup remains unexported and is
the next independent qualification. Text-entry recipe coverage remains
partial for composition, full Field/AT/OSK workflows, overlays, Presence,
InputGroup, insets and NumberInput; narrow form tests do not complete those
journeys. No new upstream limitation was found: legacy placement and unstable
ownership were local UI issues.

## GTK joined input groups

The baseline native InputGroup omitted width, read-only, loading, status
presentation and disabled-reason forwarding to its FormField. On real Linux,
an authored80% of400px stayed400px, both anonymous editors inherited the same
generated controlId, and the row retained generic role15. The shared native
wrapper now resolves field defaults, forwards those props and gives the row
its label/help and disabled/busy/invalid metadata. Native group sensitivity
also covers suffix actions; read-only blocks editor changes while loading
remains metadata. Group labels do not assign one controlId to every member
or act as single-control focus labels.

The first fixed wrapper produced320px and no duplicate IDs, but group role
was still ignored. The GTK role map lacked group, despite the role adapter
preserving its spelling. Adding Gtk.AccessibleRole.GROUP uses the existing
role recreation/ref-rebinding path. Tests cover group-to-button-to-group
and default-role removal, retaining the child editor, local text and exact
native focus delegate without adding a group tab stop.

InputGroupText's string-only test also missed text delivered through JSX's
children collection. The native addon had no label. It now uses the existing
TextSlot helper to normalize primitive runs while retaining supplied nodes.
The fixture covers a dollar prefix, replacement with a supplied USD label,
addon ref ownership and editor/focus retention.

A broader geometry check then found two150px editors and a37px suffix
extending to345px in a320px row; the group had no border. Shared theme rules
now let grouped input shells and editors shrink with a zero minimum
width, give the group one border, remove member borders/backgrounds/radii,
and inset prefix/suffix text. Native bounds and GTK style properties qualify
containment and border ownership without images. These structural rules also
apply to existing web/native InputGroup examples; no dependency or GTK UI
fork is needed. They do not establish pixel parity or full theme coverage.

The maintained fixture uses the GTK root for InputGroup/InputGroupText and
their shared types. It covers name/help/status, hidden visual labels, member
size override, read-only/required/busy/invalid state and resets, width changes,
disabled member/action sensitivity, content updates, refs and disposal.
Native signal/buffer writes and metadata are distinguished from OS input:
this group fixture does not drive an OS keyboard, IME or AT client.

Logs: guest /tmp/gtk-input-group-before.log, -first.log, -second.log, -third.log,
-geometry-before.log and -geometry-fixed.log. The first27 checks passed after
TextSlot; the expanded38 checks add width/border and role-transition proof.
Final public-root/dependent/package results are recorded separately below.
v0.17.1 source confirms the native wrapper already omitted the inherited
field props. Phone behavior remains source/adapter evidence rather than
device execution. Existing NativeScript role mapping is preserved; the GTK
group-role omission, primitive normalization and sizing gaps are local
issues, not new upstream limitations. Text-entry recipe criteria stay intact.


The first full run passes44 of45 renderer tests and fails only the newly
added200px group-containment case. At320px the shells shrink but the nested
entries remain150px wide and overlap. Shared normalization defaults every
flex child to shrink0, so both grouped shells and their editable children
must opt into shrinking. GTK itself does not impose a150px minimum here:
[GTK4.14.5 GtkText measurement](https://github.com/GNOME/gtk/blob/4.14.5/gtk/gtktext.c#L2259-L2302)
uses a zero default minimum and a separate natural width. This is a local
theme correction, not an upstream GTK width limit. The focused rerun passes
45 checks including non-overlap at320px and200px. Explicit flex-basis is
unnecessary and is omitted, respecting NativeScript's existing CSS registry
limit. GTK focus warnings during disable/enable are distinct from Gjs/GTK
critical failures; focus retention and role recreation remain tested.

Final portable-style verification passes45 public-root group checks with no
skips: /tmp/gtk-input-group-final-source.log. Together with the44 unchanged
Linux cases that passed in /tmp/gtk-input-group-full.log, this resolves the
sole failure from that full run; the full45-case command was not rerun after
the CSS-only correction. The58 affected/dependent typecheck tasks passed
before that CSS correction. Final native regression passes58 Node checks
plus37 selected native Vitest tests; web forms/size regression passes44.
Six UI package tasks validate exports/declarations; all five new exports
resolve to the exact same GTK/native declarations. The root now has118
exports:44 values and74 types. Recipes/barrels,30 release notes and focused
format/whitespace checks pass. Logs on andromeda:
 /tmp/gtk-input-group-types.log, /tmp/gtk-input-group-native-final.log,
 /tmp/gtk-input-group-web-final.log, /tmp/gtk-input-group-pack.log and
 /tmp/gtk-input-group-declarations.log. The first web attempt was canceled to
avoid concurrent declaration writers; -web-final.log is authoritative.
Maintained ComponentsDemo/ComponentsDemo InputGroup compositions retain the
same API and pick up the shared theme correction. The text-entry recipe's
GTK discussion now links public forms and groups; remaining composition,
AT-client, OSK/overlay/inset, modal/Presence and NumberInput gaps are unchanged.
No new upstream limitation or UI dependency is introduced.
