# Experimental GTK4 renderer for Linux

Build a native GTK4 window with Octane and GJS. This package is experimental;
the [production feasibility gate](https://github.com/octane-xplat/octane-xplat/blob/main/.agents/design/linux-gtk-feasibility-review.md)
still fails. Publication does not qualify complete UI parity, Wayland, IME,
OS input, or production use.

After the first stable automated release, install matching Xplat releases in your app:

```sh
pnpm add @octane-xplat/linux-gtk @octane-xplat/ui octane
pnpm add -D @octane-xplat/cli @octanejs/vite-plugin vite
sudo apt install gjs gir1.2-gtk-4.0
```

GTK 4.10 or later is required by the CLI runtime check. The package ships
JavaScript in `dist/` and TypeScript declarations. Bundle your application with
`xplatLinuxGtk`; GJS loads the resulting app, not Node. Follow the
[Linux GTK app guide](https://octane-xplat.goddardai.org/linux-gtk)
for an entry point and packaging commands.

```ts
// vite.gtk.config.ts
import { xplatLinuxGtk } from '@octane-xplat/cli/linux-gtk/vite'
export default async (env: { mode: string }) => xplatLinuxGtk(env)
```

## Optional native layout

No native binary is downloaded or compiled during installation. Without
XplatMason the renderer warns once and uses `Gtk.Box`: ordinary rows and columns
work, but grid, reverse directions, asymmetric gaps and full flex alignment
remain approximate or unsupported. This is the default npm consumer path.

Advanced consumers can build the included C facade on the Linux host. It needs
a matching architecture's pinned MasonCore engine archive, C compiler,
`pkg-config`, GTK4, JSON-GLib and GObject Introspection development tools.
The source package does not include the engine archive or its checkout. Use the
[engine build instructions](https://github.com/octane-xplat/nativescript-mason)
and the artifact contract in `native/xplatmason/build.sh`; the script rejects a
missing archive/header/manifest. Keep that external checkout pinned in your app.

```sh
# MASON_CHECKOUT points to your pinned nativescript-mason checkout, after its
# nativescript-mason-core:build.native.desktop task has produced the archive.
GTK_PACKAGE="$PWD/node_modules/@octane-xplat/linux-gtk"
bash "$GTK_PACKAGE/native/xplatmason/build.sh" "$MASON_CHECKOUT"
export GI_TYPELIB_PATH="$GTK_PACKAGE/native/xplatmason${GI_TYPELIB_PATH:+:$GI_TYPELIB_PATH}"
export LD_LIBRARY_PATH="$GTK_PACKAGE/native/xplatmason${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
gjs -m dist/app.js
```

Ship the resulting `.so` and `.typelib` with the app for its architecture and
preserve the engine's license notices. Native Mason builds and relocation need
separate runtime qualification; the npm consumer check uses the Box fallback.

## Accessible names and automation

An explicit label reaches assistive technology through GTK's non-varargs
property-array binding. Buttons also clear GTK's automatic mnemonic naming
relation so the explicit label wins over their visible text. Removing the prop
restores content naming. Widget names remain an automation fallback;
`testID`, then `automationText`, then `id` take priority over that mirror.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function Save() {
  return <button text="Save" testID="save-draft" accessibilityLabel="Save draft" />
}
```

The release readiness note records independent AT-SPI evidence and its limits.
A readable AT-SPI name does not establish screen-reader navigation or speech.

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

For consumer build steps, use [Optional native layout](#optional-native-layout).
Contributor implementation details and qualification evidence live in the
[renderer note](https://github.com/octane-xplat/octane-xplat/blob/main/.agents/docs/notes/linux-gtk-renderer.md).

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
