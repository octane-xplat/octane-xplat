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

The artifact is not committed — build it where the renderer runs:

```sh
git clone https://github.com/triniwiz/nativescript-mason research/nativescript-mason  # sibling checkout
packages/linux-gtk-renderer/native/xplatmason/build.sh
```

Requires cargo, pkg-config, `gtk4` and `json-glib-1.0` dev packages, and
`gobject-introspection` (`g-ir-scanner`, `g-ir-compiler`). It produces:

- `libxplatmason-gtk.so` — the facade, statically linked with `libmason_c.a`
- `XplatMason-1.0.typelib` — the namespace GJS binds through

Point the app at the artifact directory before launching `gjs`:

```sh
GI_TYPELIB_PATH=packages/linux-gtk-renderer/native/xplatmason gjs -m dist/app.js
# or: XPLAT_MASON_TYPELIB=<that dir> gjs -m dist/app.js
```

macOS dev builds work too (Homebrew `gjs gtk4 gobject-introspection
json-glib`); `DYLD_FALLBACK_LIBRARY_PATH=$(brew --prefix)/lib` is needed
for brew's gjs to resolve libgjs.

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

What a matched declaration can do: colors and backgrounds (`color`,
`background`, `background-color`), fonts (`font-size`, `font-weight`,
`font-style`, `font-family`), `line-height`, `text-decoration`,
`text-shadow`, `box-shadow`, borders (`border-radius` including percents,
`border-color`, `border-width`, `border-style` — `solid` is emitted
automatically when only a width is set, because GTK's default is `none`),
`padding*`/`margin*`, `min-width`/`min-height`, plus `width`, `height`, and
`opacity` applied directly. `text-align` maps to label and entry alignment,
`placeholder-color` styles a text field's placeholder, and Mason layout keys
reach the engine (or the `Gtk.Box` fallback subset).

Current limits:

- Only `:disabled` responds to state. `:hover`, `:active`, and `:focus`
  rules never match yet.
- Media queries are re-checked when the appearance or the stylesheets
  change, but not when a window resizes.
- `@keyframes` and `animation-*` are parsed but not played.
- Per-corner radii and per-side borders collapse to a single value.
- An unsupported property logs `[linux-gtk-css] ignored unsupported
  property` once per property name.
- GTK's theme still styles native widget chrome (buttons, entries)
  underneath app CSS.

Runtime evidence so far: GJS 1.90.1 + GTK 4.24.1 on macOS (Homebrew),
headless driver checks in `test/css.test.mjs` — class selectors, inherited
and `var()` values, root classes, inline precedence, `:disabled`, sibling
re-match, and runtime replacement, with real `widget.get_color()` reads.
Not yet run on a Linux host; no visual or pixel review; no OS input.

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
