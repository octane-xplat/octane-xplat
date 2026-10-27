# @octane-xplat/linux-gtk

Experimental GTK4 renderer for Octane on Linux, driven from GJS. This is the
native-widget counterpart of the `webkitgtk` runtime in `apps/linux`: the
Octane universal runtime runs **inside** GJS and mounts real GTK4 widgets —
the same architecture `packages/macos-renderer` uses for AppKit.

Status: **v1 scaffold, build-verified only.** The feasibility evidence for the
approach (universal runtime loading in GJS 1.82, scheduling bridge,
reconciliation, XTEST hit-testing) lives in
`.agents/design/linux-gtk-feasibility-review.md` and
`.agents/docs/notes/linux-gtk-capability-inventory.md`. Runtime verification
of this driver is pending a Linux host — see
`.agents/docs/notes/linux-gtk-renderer.md` for the current status and smoke
path.

## Layout — the Mason engine

`masonview` is laid out by [Mason](https://github.com/triniwiz/nativescript-mason)
(the same engine the macOS renderer binds), not by GTK's built-in sizing.
`src/mason.ts` loads the engine through the `XplatMason` GI namespace — a
small GObject-introspectable facade over mason-c's C ABI — and drives a
custom `Gtk.LayoutManager` during GTK's own measure/allocate passes.
Children keep their real widgets; leaf nodes measure them live on every
compute, the same callback contract the macOS bridge uses for NSViews.

When the typelib is absent, `masonview` warns once and falls back to the
`Gtk.Box` emulation — the app still runs, layout is approximate.

### Building the binding (Linux build host)

The artifact is not committed — build it where the renderer runs. The facade
links the pinned MasonCore engine archive the mason checkout's core native
build produces (`libMasonCore.a` plus its generated `mason_native.h`), so
build that artifact first:

```sh
git clone https://github.com/octane-xplat/nativescript-mason research/nativescript-mason  # sibling checkout
cd research/nativescript-mason && rustup run stable cargo generate-lockfile
pnpm exec nx run nativescript-mason-core:build.native.desktop
cd ../.. && packages/linux-gtk-renderer/native/xplatmason/build.sh
```

The build consumes `dist/native/mason-core/desktop/<rustc host triple>/` —
`x86_64-unknown-linux-gnu` on a standard Linux box — and records the consumed
pin in `native/xplatmason/manifest.json` (`XPLAT_MASON_CORE_MODE` /
`XPLAT_MASON_CORE_TARGET` select another artifact). Requires pkg-config,
`gtk4` and `json-glib-1.0` dev packages, and `gobject-introspection`
(`g-ir-scanner`, `g-ir-compiler`). It produces:

- `libxplatmason-gtk.so` — the facade, statically linked with `libMasonCore.a`
- `XplatMason-1.0.typelib` — the namespace GJS binds through

Both artifacts bind by soname only — no absolute paths are stamped in.
Point the app at the artifact directory before launching `gjs` so the
typelib and the library path both resolve:

```sh
XPLAT_MASON_TYPELIB=packages/linux-gtk-renderer/native/xplatmason gjs -m dist/app.js
# or GI_TYPELIB_PATH=<that dir> plus the dir on LD_LIBRARY_PATH
```

macOS dev builds work too (Homebrew `gjs gtk4 gobject-introspection
json-glib`); `DYLD_FALLBACK_LIBRARY_PATH=$(brew --prefix)/lib` is needed
for brew's gjs to resolve libgjs, and the facade consumes the host archive
(`build.native.host` in the mason checkout) via `XPLAT_MASON_CORE_MODE=host`.

### Layout notes

- The style dict matches the macOS contract one-for-one except `margin` and
  `padding`: GTK's measure/allocate pipeline already folds a widget's CSS
  margin/padding into leaf measures and child allocations, so feeding them
  to the engine would double-count them. Percentage/auto margins and
  paddings are the gap — GTK CSS is px-only there (tracked limitation).
- `scrollview` stays native `Gtk.ScrolledWindow` chrome — a `masonview`
  inside it sizes itself through the engine and scrollbars follow its
  measure, so no special-casing is needed.
- Direct layout props on `masonview` or on children of a Mason parent warn
  once and are dropped — the `style`/`className` bag is the only layout
  channel, same as macOS.

## Exports

| Export                     | Contents                                                            |
| -------------------------- | ------------------------------------------------------------------- |
| `.`                        | `gtkDriver`, `createGtkRoot`, `GTK_RENDERER_ID`, `registerStylesheet`, `octane/universal/native` re-export |
| `./host`                   | `runGtkApp` — GtkApplication + window + content box + mounted root    |
| `./compat/native-core`     | `@nativescript/core` shim for leaves evaluated in a GTK bundle      |
| `./compat/escape-props`    | escape-props shim                                                   |

Implemented intrinsics: `masonview` (the single layout container — every
layout semantic arrives through `style`/`className`), `label`, `button`,
`scrollview`, `textfield`, `switch`, `slider`, `progress`,
`activityindicator`, plus viewless `#text`, `span`, `formattedstring`,
`contentview`, `proxyviewcontainer`, `rootlayout`. Anything else throws a
named driver error at mount.

## Apply stylesheets

Import CSS files from your entry module, the same way the iOS and Android
apps do. `xplatLinuxGtk` compiles them like the other presets (it drops
`@platform` blocks for other targets, unwraps `@layer`, and treats `px` as
points) and injects them into `app.js`. The renderer then matches
`className`, `id`, and element-type selectors against your widgets with the
same vendored NativeScript selector engine the AppKit renderer uses:

```ts
// src/main.ts
import './app.css'
```

```css
/* app.css */
.card {
  padding: 16px;
  background-color: var(--color-surface);
  border-radius: 12px;
}
```

The cascade follows NativeScript: specificity, then `@layer`, then source
order. Custom properties and `color`/`font-*`/`line-height`/`text-align`
inherit, and `var()` and `calc()` resolve per widget. A `style` prop
overrides CSS, and so does an element prop with the same name. The root of
every renderer tree gets `ns-root`, `ns-gtk`, and `ns-light` or `ns-dark`
from the GTK settings (`gtk-interface-color-scheme` on GTK 4.20+, else
`gtk-application-prefer-dark-theme` or a `-dark` theme name).

To add CSS at runtime, call `registerStylesheet`. Registering the same id
again replaces that sheet, and mounted widgets restyle:

```ts
import { registerStylesheet } from '@octane-xplat/linux-gtk'

registerStylesheet('promo', '.promo { background-color: #fde68a; }')
```

`className` only feeds the cascade — it is **not** added to the widget's
own GTK CSS classes. GTK's default theme ships classes like `.card`,
`.title`, and `.error` that would silently style app classes of the same
name, so computed styles reach widgets only through an internal per-widget
provider.

What a matched declaration can do:

- **Colors, backgrounds, and borders:** `color`, `background`,
  `background-color`, `background-image` (including `url()`; `~/` resolves
  next to `app.js`), `background-position`/`-repeat`/`-size`, per-side
  border widths and colors, per-corner radii (percents too), and
  `border-style`. GTK draws no border by default, so a width without a style
  gets `solid`.
- **Text:** `font-size`, `font-weight`, `font-style`, `font-family`,
  `font-variation-settings`, `line-height`, `letter-spacing`,
  `text-transform`, `text-decoration`, `text-shadow`, `text-align`,
  `white-space`, `text-overflow`, and `placeholder-color` on text fields.
- **Box and layout:** `padding*`, `margin*`, `min-width`/`min-height`,
  `width`, `height`, `opacity`, `visibility` (`hidden` keeps its space,
  `collapse` removes it), `direction`, `box-shadow`, and the Mason layout
  keys (flex, grid, absolute insets, gaps).
- **Controls:** `color` and `background-color` paint the moving part and
  the track of a switch, slider, or progress bar.
- **Paint:** inside a `masonview`, `transform` (and the `translateX`/
  `scaleX`/`rotate`/... longhands), `z-index`, and `clip-path` (`rect`,
  `inset`, `circle`, `ellipse`, `polygon`). Transforms move hit-testing
  with the widget; `z-index` and `clip-path` only change painting, as on
  iOS.

State selectors follow the widget's GTK state:

```css
.save:hover { background-color: #2563eb; }
.save:active { opacity: 0.8; }        /* also :pressed and :highlighted */
.field:focus { border-color: #2563eb; }
.toggle:checked { opacity: 1; }
.save:disabled { opacity: 0.4; }
```

`:normal` matches while none of NativeScript's visual states
(`:highlighted`, `:active`, `:pressed`, `:focus`, `:checked`, `:disabled`)
is on. The desktop-only `:hover`, `:focus-visible`, and `:focus-within` do
not cancel it.

Media queries re-check when the window resizes, the color scheme flips, or
the animation setting changes. Roots also get `ns-portrait` or
`ns-landscape` and `ns-ltr` or `ns-rtl`:

```css
@media (min-width: 600px) {
  .sidebar { visibility: visible; }
}
@media (prefers-reduced-motion: no-preference) {
  .spinner { animation: spin 1s linear infinite; }
}
```

`@keyframes` animations play with NativeScript's rules. They can change
`opacity`, `background-color`, `width`, `height`, and the transform
parts:

```css
@keyframes pop {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
.toast { animation: pop 200ms ease-out forwards; }
```

An animation starts when its widget mounts or when the widget's own
classes, id, or state change, and stops when the widget is removed.
`forwards` keeps the last frame. As in NativeScript, every matching rule's
animation plays, so a later `animation: none` does not cancel an earlier
one. GTK's "enable animations" setting does not stop animations either;
put motion inside a `prefers-reduced-motion: no-preference` query, as in
the media example above.

Current limits:

- Outside a `masonview`, `transform` falls back to GTK CSS with `%`
  resolved when the widget restyles, and `z-index`/`clip-path` are
  ignored with a warning.
- `polygon()` clips need GTK 4.14 or newer; older GTK ignores them with a
  warning.
- Changing an ancestor's class restarts a descendant's animation only when
  the descendant's matched animations change. NativeScript restarts it on
  every ancestor class change.
- NativeScript has no CSS `transition`; neither does this renderer.
- An unsupported property logs `[linux-gtk-css] ignored unsupported
  property` once per property name.
- GTK's theme still styles native widget chrome (buttons, entries)
  underneath app CSS.

Runtime evidence so far: GJS 1.90.1 + GTK 4.24.1 on macOS (Homebrew),
headless driver checks in `test/css.test.mjs` and `test/mason.test.mjs`.
They cover selectors, inheritance, `var()`, inline precedence, state
selectors driven by real GTK state flags, media queries after a window
resize, borders read back from the style context, transforms and picking,
paint order and clip calls, and keyframe frames on a real GLib timer. Not
yet run on a Linux host; no visual or pixel review; no OS input.

## Platform seam

GTK variant files use the `.gtk` suffix (`foo.gtk.tsx`), resolved before the
unsuffixed native default. `.linux` files belong to the WebKitGTK renderer
and are unreachable inside a GTK bundle — see the capability inventory for
why the two suffixes must not collide.

`/** @jsxImportSource @octane-xplat/jsx */` on line 1 of `.gtk.tsx` /
`.gtk.tsrx` files that contain JSX — the shared native contract is the JSX
source for every native target; the `gtk` customConditions entry binds the
GTK host element type. There is no renderer-owned `jsx-runtime` export.

## Bundle + run

`@octane-xplat/cli` ships `xplatLinuxGtk` (`@octane-xplat/cli/linux-gtk/vite`)
which wires the Octane compiler's `gtk` renderer, `gi://` externals, the
`.gtk` extension chain, and the `octane` → `octane/universal/native` retarget.
The output is one ESM file run with `gjs -m`.
