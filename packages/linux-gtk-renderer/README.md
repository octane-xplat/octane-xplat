# Experimental GTK4 renderer for Linux

Build a native GTK4 window with Octane and GJS. This package is experimental;
the [production feasibility gate](https://github.com/octane-xplat/octane-xplat/blob/main/.agents/design/linux-gtk-feasibility-review.md)
still fails. Publication does not qualify complete UI parity, Wayland, IME,
OS input, or production use.

After the first stable automated release, install matching Xplat releases in your app:

```sh
bun add @octane-xplat/linux-gtk @octane-xplat/ui octane
bun add -D @octane-xplat/cli @octanejs/vite-plugin vite
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
`scrollview`, `textfield`, `textview`, `switch`, `slider`, `progress`,
`activityindicator`, `image`, `svgview`, plus viewless `#text`, `span`, `formattedstring`,
`contentview`, `proxyviewcontainer`, `rootlayout`. Anything else throws a
named driver error at mount.

## Icon sources

The shared Icon component uses Gtk.Picture for SVG and raster sources, and
Gtk.Label for font/text fallbacks. Registry providers and explicit registries
use the same shared UI implementation.

```tsx
import { Icon } from '@octane-xplat/ui'

export function SearchGlyph() {
  return <Icon name="xplat-search" size={20} accessibilityLabel="Search" />
}
```

The picture source loader accepts inline SVG, data URIs, local paths, file URIs,
bundle-relative `~/` paths, registered GResource names through `res://`, and
HTTP(S) URLs. HTTP loading requires the Soup 3 GI typelib; SVG decoding requires
the installed GdkPixbuf SVG loader (librsvg on the qualified Ubuntu host).
The loader cancels stale requests and disposes textures with their widget.
The Image component's wider sizing/placeholder contract is still unqualified.

```tsx
// A custom icon set can point to an asset beside the emitted app.js bundle.
import { Icon, createIconRegistry } from '@octane-xplat/ui'

const icons = createIconRegistry()
icons.registerIcon('brand', { src: '~/brand.svg' })
export function BrandGlyph() {
  return <Icon name="brand" registry={icons} size={24} />
}
```

## Textfield refs

A textfield ref keeps its real Gtk.Entry identity while adding focus(), blur()
and a controlled .text setter. Read-only entries keep focus and selection;
isEnabled=false disables interaction. Programmatic text writes preserve Unicode
cursor/selection ranges and do not echo through onTextChange. A blur only releases
focus inside its own widget.

```tsx
import { useRef } from 'octane'
import type { HostElement } from '@octane-xplat/jsx/intrinsics'
import { Pressable, Text, View } from '@octane-xplat/ui'

export function FocusableField() {
  const field = useRef<HostElement | null>(null)
  return (
    <View>
      <textfield ref={field} text="Copy this text" editable={false} />
      <Pressable onPress={() => { field.current?.focus() }}>
        <Text>Focus the field</Text>
      </Pressable>
      <Pressable onPress={() => { field.current?.blur() }}>
        <Text>Release focus</Text>
      </Pressable>
    </View>
  )
}
```

## Text entry

TextInput is available from the GTK UI root. Use value with onChange to keep
the text in your component's state, or defaultValue for an input that manages
its own text. Pressing Return calls onSubmit; hasClear adds a keyboard-accessible
clear action.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { TextInput, Text, View } from '@octane-xplat/ui'

export function AccountEntry() {
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  return (
    <View>
      <TextInput
        label="Account"
        placeholder="Work account"
        value={value}
        onChange={setValue}
        hasClear
        onSubmit={() => setSubmitted(true)}
      />
      <Text>{submitted ? 'Return received' : ''}</Text>
    </View>
  )
}
```

keyboardType is a hint for the input method, not validation. A controlled
parent can reject an edit by keeping its value unchanged. This example accepts
digits and shows a validation tooltip while empty. Status messages, labels
and leading content can change without replacing the editor.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { TextInput } from '@octane-xplat/ui'

export function ReferenceEntry() {
  const [value, setValue] = useState('')
  return (
    <TextInput
      label="Reference"
      value={value}
      onChange={(next) => { if (/^\d*$/.test(next)) setValue(next) }}
      keyboardType="number"
      isRequired
      status={value ? undefined : { type: 'error', message: 'Enter digits' }}
      statusVariant="tooltip"
    />
  )
}
```

GTK Entry has no per-field Return-key caption selector in the inspected API.
returnKeyType therefore keeps Return submission working and emits one diagnostic
that its caption hint is unavailable. It does not move focus for next.
TextArea, IME, assistive-technology clients, Wayland and visual parity remain
outside this qualification.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { TextInput } from '@octane-xplat/ui'

export function SearchEntry(props: { search: () => void }) {
  return <TextInput placeholder="Search" returnKeyType="search" onSubmit={props.search} />
}
```

These raw-ref methods do not provide a general NativeScript View facade.
\n
### Low-level multiline editor

The GTK textview intrinsic supports multiline text, Unicode selection,
read-only editing, focus and change events. Return inserts a newline;
done or send with an onReturnPress handler submits instead. Shift+Return
keeps a newline. Tab moves focus to the next control.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function NotesEditor() {
  return (
    <textview
      text="First line\nSecond line"
      returnKeyType="done"
      onTextChange={(event) => console.log(event.value)}
      onReturnPress={() => console.log('Submitted')}
      style={{ width: 260, height: 120 }}
    />
  )
}
```

This is renderer support, not the public TextArea component. Placeholder,
row sizing, bounded growth and maximum length remain unqualified. GTK
TextView has no per-field Return-caption property; the renderer reports
that limit once when returnKeyType is supplied.

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

For a focused maintained runtime fixture, pass its file through Turbo so
dependency builds and declaration generation still run first:

```sh
xvfb-run -a pnpm exec turbo run test:runtime --filter=@octane-xplat/linux-gtk -- test/ui-icon.test.mjs
```

## Portal targets

Universal portals retain their original context and state while rendering into
a local multi-child GTK layout target. External Box, Fixed and Grid targets
retain caller-owned children; an owned Mason or viewless layout ref joins its
existing layout graph. Keep the target alive until portal removal. See the
[host integration example](../../docs/platform/linux-gtk.md#portals-for-gtk-host-integrations).

```tsx
import { Text } from '@octane-xplat/ui'
import { createPortal, type UniversalRenderable } from '@octane-xplat/linux-gtk'

export function PortalContent(props: { target: unknown }) {
  return createPortal(
    <Text>Content in the target container</Text> as UniversalRenderable,
    props.target,
  )
}
```

Other overlays need their own focus, dismissal and geometry integration; Tooltip is covered below. Transported targets and single-child
widgets are rejected explicitly. CSS follows physical target ancestry. The
maintained ui-portal fixture checks preparation/abort, ordering, retargeting,
context/state, CSS refresh and disposal in GJS; it does not prove OS input,
accessibility-client behavior or pixels.

## Native tooltips

The curated GTK UI root now exports Tooltip, TooltipProps and PopoverPlacement.
The GTK leaf uses same-root universal portals into a renderer-owned GtkPopover.
Pointer intent has open/close delays; focus on a focusable child opens immediately.
Blur, Escape, ancestor scrolling, disabling and disposal dismiss and clean up.
Native popup coordinates follow anchor allocation changes without a second root.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Tooltip } from '@octane-xplat/ui'

export function DeliveryHelp() {
  return (
    <Tooltip
      trigger={<button text="Delivery details" />}
      content="Orders ship on the next business day."
      placement="right"
      openDelay={300}
    />
  )
}
```

GTK 4.14+ is required for the accessible-list reference used by DESCRIBED_BY;
older GTK is rejected explicitly when mounting Tooltip. The panel exposes the
native TOOLTIP role and accepts contentClassName/contentStyle. The native surface
is noninteractive and retains trigger focus. Plain generic views are not given
an extra tab stop; use a focusable trigger when keyboard access is required.
The maintained ui-tooltip fixture separates real X11 pointer/Tab/Escape evidence
from controller dispatch and checks native metadata, not pixels or an AT client.

## Accessibility state records

accessibilityState now preserves independent disabled, selected, checked,
pressed, busy, expanded, hidden, invalid and visited state. checked/pressed also
accept 'mixed'; invalid accepts true/false, 'grammar' or 'spelling'. required and
readOnly are native accessible properties. The legacy selected/checked/unchecked/
disabled strings are still accepted because existing native callers send them.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function AccountField(props: { required: boolean; loading: boolean; invalid: boolean }) {
  return (
    <textfield
      accessibilityLabel="Account"
      accessibilityState={{ required: props.required, busy: props.loading, invalid: props.invalid }}
      text=""
    />
  )
}
```

Apply interaction through widget props, not metadata. GtkEditable editability,
widget sensitivity and accessible=false remain authoritative when they would
contradict metadata. Removing an explicit checked override on a native switch
restores its actual active value. Removing other managed flags/properties clears
their old GTK storage. Shared TextInput now forwards resolved read-only, required,
loading and error state through the GTK adapter; it remains a direct-source
fixture while the rest of its field/prop contract is qualified.

The maintained ui-accessibility fixture compares native stored values using
fixed-signature bindings of GTK's variadic test helpers. Rebuild XplatMason after
updating the facade: older typelibs do not contain those check functions. This is
stronger than attribute-presence checks and does not claim AT-client or pixel
qualification.

## Keyboard press actions

A Pressable with accessibilityRole="button" accepts Tab focus and activates on
Return or Space release. With accessibilityRole="link", it activates on Return.
Press-in runs once when the key goes down; press-out runs before activation.
Moving focus, disabling the action or removing it cancels a held key.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Pressable, Text } from '@octane-xplat/ui'

export function SaveAction(props: { disabled: boolean; save: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Save" disabled={props.disabled} onPress={props.save}>
      <Text>Save</Text>
    </Pressable>
  )
}
```

A Pressable without a button or link role keeps its existing pointer behavior
and adds no keyboard stop. Keyboard events from a focused child textfield do
not activate its parent Pressable.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Pressable, Text } from '@octane-xplat/ui'

export function PointerAction(props: { disabled: boolean; save: () => void }) {
  return (
    <Pressable disabled={props.disabled} onPress={props.save}>
      <Text>Save</Text>
    </Pressable>
  )
}
```

Maintainer qualification now includes the [field-chrome runtime fixture](https://github.com/octane-xplat/octane-xplat/blob/main/packages/linux-gtk-renderer/test/fixtures/src/ui-field-chrome.gtk.tsrx).
The fixture also checks editor retention while labels or validation messages change.
TextInput is available from the curated root. Field remains a source-only
fixture; its complete contract is not established by this qualification.
