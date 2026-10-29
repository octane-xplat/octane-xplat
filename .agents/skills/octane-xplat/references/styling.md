# Styling

One CSS pipeline, both targets: authored classes → PostCSS/lightningcss →
CSS vars + utility classes. Native layout uses the Mason engine through the
patched driver; DOM layout uses browser CSS. Platform style support still needs
qualification; sharing a CSS property name does not establish parity. The `vx-*` class namespace is the
component layer; design tokens are CSS custom properties.

```css
/* App stylesheet: one static class can reference shared tokens. */
.trip-card {
	background-color: var(--color-surface);
	color: var(--color-text);
}
```

## Rules

1. **Static styling = `className` only.** No `<style>` blocks (web-only),
   no inline style strings.
2. **Dynamic styling = `style` objects** — the leaf forwards them to the
   element's `style` on both targets.
3. `className` arrays compose (`['vx-pressable', props.className]`) —
   `clsx`-style, falsy entries drop. Nested readonly arrays and conditional
   objects are supported. Use upstream `ClassValue` (re-exported by UI);
   `ClassName` has been removed. Numeric conditions such as `count && 'active'`
   are accepted; truthy numbers stringify, while `0` and `NaN` drop out.
4. **Utility classes are a shared vocabulary** (`flex-1`, `gap-4`,
   `bg-primary`, `text-onprimary`...) — the curated shared set lives in
   `packages/ui/src/theme/tokens.css`; app-only selectors live in
   `packages/app/src/app.css`. Read the [styling guide](../../../../docs/app/styling.md) for supported
   composition and the [CSS notes](../../../docs/notes/css-support-notes.md)
   when investigating native property support.
   Prefer the existing pipeline; adding another utility/CSS engine requires
   proving the same rules work on each intended target.
5. Per-platform selector hooks exist: `.ns-root`, `.ns-ios`, `.ns-android`,
   `.ns-dark`, `.ns-light`, `.ns-landscape`, `.ns-modal` on native ≈
   `:root`/`.dark` on web.

When maintaining AppKit leaves, preserve the public style value before the host
boundary. The renderer now normalizes declaration strings and ordered arrays
before validation and mutation using the existing CSS-tree parser. This closes
a source prerequisite that previously rejected forwarded strings; earlier
component forwarding alone was not native proof. Invalid lists fail explicitly.
Native !important has no extra priority; normalization does not add property,
unit, shorthand or variable support beyond inline object styles. Keep the authoring
rules above; actual native layout/painting/removal still needs qualification.

```tsx
// Leaf forwarding: use the standard merge helper without extracting styleRecord.
const style = mergeStyle({ opacity: disabled ? 0.38 : 1 }, props.style)
<label style={style} text="Status" />
```

## Native layout styles

Raw native layout uses `masonview`. Put CSS layout keys in its style bag or
classes, rather than attributes such as `flexDirection`, `rows`, or `row`.
Component-level layout props remain supported and are translated by their leaves.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// Columns.mobile.tsx — raw host example, not shared DOM JSX.
export function Columns() {
	return (
		<masonview style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
			<label text="Bag" style={{ gridColumn: '1' }} />
			<label text="Packed" style={{ gridColumn: '2' }} />
		</masonview>
	)
}
```

For driver work and the distinction between JSX tags and imperative native
hosts, read [driver semantics](primitives/driver-semantics.md#leaf-shape).

## Safe-area CSS

On iOS and Android, Mason container roots automatically resolve owning-window
safe-area `env()` values and re-evaluate styles when insets change. The preset
keeps a qualification warning because native dispatch/layout has only headless
adapter coverage. Do not describe that as device-tested. Ordinary NativeScript
controls and the Windows preview still need `useSafeAreaInsets()` inline
styles; there `env()` stays unresolved. See
[safe-area styling](../../../../docs/app/styling.md#safe-area-insets).

```css
.chrome { padding-top: env(safe-area-inset-top, 0px); }
```

For controls without the Mason resolver, keep browser-only `env()` rules
conditional:

```css
@platform web {
  .chrome { padding-top: env(safe-area-inset-top); }
}
```

## Native leaf sizes

On iOS/Android, class-authored dimensions and centering use the same cascade
as inline overrides, including foreign native hosts such as SVGView. Keep
static sizes in classes; do not add a Mason wrapper just to carry width and
height. The renderer patch bridges resolved leaf layout styles. See the
[implementation and evidence boundary](../../../docs/notes/masonkit-layout-evaluation.md#foreign-leaf-layout-regression-issue-31).

```tsx
<Image src={svgMarkup} className="profile-icon" alt="Profile" />
```

```css
.profile-icon { width: 31px; height: 36px; }
```

## Tokens

CSS vars (`--color-primary` etc.) in `packages/ui/src/theme/tokens.css` —
imported once by the app entry. Load the required structural stylesheet in each app entry. Read
[token definitions](styling/tokens.md) when adding or overriding tokens; native
host classes still need separate application across host boundaries.

```ts
// Import once in the app entry.
import '@octane-xplat/ui/theme/tokens.css'
```

- **`tokens.css` is required structure**, not decoration — it carries the
  normalization and layout rules components rely on, and omitting it breaks
  geometry. `chrome.css` is the optional decoration layer (default colors,
  borders, fonts); import it after `tokens.css`, before the app's own CSS.
- **Prefer JS stylesheet imports.** Platform CSS selection and build-time
  conditions belong to the configured preset. See
  [CSS variants](../../../../docs/platform/module-resolution.md#css-file-variants)
  before relying on browser-only transforms or import ordering.
- The experimental macOS AppKit and Linux GTK renderers apply the same
  stylesheets through the shared NativeScript selector engine. On AppKit
  linear-gradient backgrounds support direction keywords, degree angles and
  percentage stops (no image URLs or multiple layers). Labels honor padding,
  letter-spacing and italic; `visibility` hides or collapses; `cursor` and
  `user-select` apply. Both match `:hover`, `:focus` and the NativeScript
  visual states and re-check media queries on window resize. AppKit derives
  focus states from the first responder, evaluates media queries against the
  largest window for every window, and has not runtime-qualified state
  delivery. GTK plays `@keyframes`; AppKit keyframes are a source path only.
  Both ignore some properties. Check each renderer's
  [Apply stylesheets](../../../../packages/macos-renderer/README.md#apply-stylesheets)
  ([GTK](../../../../packages/linux-gtk-renderer/README.md#apply-stylesheets))
  limits before promising a property or pseudo-class. Note `className` is
  never forwarded to GTK widget classes — it only feeds the cascade.

AppKit formatted runs accept finite numeric `style.letterSpacing` in points,
inherit host/ancestor spacing and reset to default with `0` or `normal`.
Rich hosts also pass computed line height to paragraph composition.
Do not promise arbitrary CSS units, native text measurement or pixel parity
from the source cases; see the [renderer contract](../../../../packages/macos-renderer/README.md#apply-stylesheets).

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function Caption() {
	return <label><formattedstring style={{ letterSpacing: 1 }}>
		<span text="Spaced " /><span text="default" style={{ letterSpacing: 0 }} />
	</formattedstring></label>
}
```

```css
.multiline-caption { line-height: 24px; }
```

## Dark mode

System-driven by default (`prefers-color-scheme` / NS system appearance
via `useColorScheme()`), class-override on top (`dark ns-dark` on the app
root view). **Critical:** the class does not cross native root boundaries —
see `styling/root-boundaries.md` before building a theme toggle.

```tsx
import { useColorScheme, View, Text } from '@octane-xplat/ui'

export function ThemedScreen() {
	const scheme = useColorScheme()
	return (
		<View className={scheme === 'dark' ? 'dark ns-dark' : 'ns-light'}>
			<Text>Trip notes</Text>
		</View>
	)
}
```

## `:pressed` pseudo

`.vx-pressable:pressed` is a NativeScript pseudo — lightningcss warns it's
unrecognized on web builds; the rule is dead weight on web and real on
native. Both sides' dead rules are expected.

```css
.vx-pressable:pressed {
	opacity: 0.7;
}
```

## styled()

The factory supports boolean class variants and option-name variants, with
`defaultVariants` for omitted selections. The public declarations define the
inferred variant props; this example defines a boolean variant.

```ts
import { styled, Pressable } from '@octane-xplat/ui'

export const DangerButton = styled(Pressable, {
	base: 'trip-button',
	variants: { danger: 'bg-danger' },
})
```

The v0.16.0 native factory declaration returns a callable with a required
second `context` argument, which the shared JSX facade rejects as a JSX tag.
Until that contract is corrected, compose classes on a shared component rather
than casting away the mismatch. This is a declaration check, not a runtime
failure claim; see the [native factory note](../../../docs/notes/styled-jsx-contract.md).

```tsx
import { Pressable, Text } from '@octane-xplat/ui'

export function Remove() {
	return (
		<Pressable className="trip-button bg-danger extra">
			<Text>Remove</Text>
		</Pressable>
	)
}
```

For custom Vite builders (including Cloudflare SPA + Worker builds) that leave
configured environments unused, declare every actual build target with `buildEnvironments`. Never remove real SSR targets merely because
they emit no CSS. See the [participation example](../../../../packages/bamboo/README.md#custom-builders-with-unused-environments)
and [upstream limitation](../../../docs/bamboo-build-environments.md).

```ts
import { xplatBamboo } from '@octane-xplat/bamboo/vite'

const plugins = xplatBamboo({ buildEnvironments: ['api', 'client'] })
```

Bamboo token names mirror the ui theme variables — every `--color-*`,
`--radius-*`, and `--space-*` in `chrome.css`'s default theme is a valid token
(`color: 'warning'` → `var(--color-warning)`). A token only resolves when the
app imports `chrome.css` or defines that variable itself; otherwise the
generated declaration has no effect. The starter defines only `primary`,
`onprimary`, `surface`, and `text`.

## AppKit label overflow CSS

For ordinary native macOS labels, CSS normal/nowrap and clip/ellipsis now reach
the existing AppKit cell path when the corresponding explicit host prop is
absent. maxLines remains a host prop; one forces one line. Preserve cascade
inheritance: white-space inherits, text-overflow does not. Do not forward a
container's ellipsis to all descendants or describe the Table container rule
as complete table ellipsis support. Shared Text forwards these style values;
its explicit maxLines-derived modes stay authoritative.

```css
.compact-title { width: 180px; white-space: nowrap; text-overflow: ellipsis; }
```

Removal refreshes the native mode and releases an implicit one-line height.
Attributed paragraphs must retain mode/alignment even when only decoration or
letter spacing caused attribution. Unsupported CSS modes warn and default;
unsupported direct host props keep their existing validation error. This is
source coverage, not native measurement/painting/VoiceOver/installed evidence.
The idle fixture and seven source cases remain unrun. Keep CSS preservation,
text-wrap balance/pretty, per-span whitespace and CSS line-clamp outside claims.
See [the guide](../../../../docs/app/styling.md#appkit-text-wrapping).

```tsx
// maxLines is a public Text prop; this explicit limit keeps one line.
import { Text } from '@octane-xplat/ui'
export function LimitedTitle() { return <Text maxLines={1}>Complete title</Text> }
```

## AppKit label alignment

AppKit labels now resolve CSS left/right/center/justify and start/end after all
style declarations settle. Logical edges use inherited CSS direction, default
ltr; they do not map to native Natural, which follows native script/localization
semantics. Direction-only changes and removal refresh the paragraph alignment
and retain the sheet-grabber default. Unchanged native alignment is not rewritten.
Unsupported values warn by property and default. See [the guide](../../../../docs/app/styling.md#appkit-text-alignment).

```css
.amount { text-align: end; }
.rtl-copy { direction: rtl; }
```

This is a renderer prerequisite for table columns using logical alignment,
including the maintained invoice example. CSS direction controls this label
alignment subset only: do not claim a UI-provider-to-CSS bridge, CSS bidi
overrides, vertical writing or per-span paragraph alignment. Five source cases,
an existing spacing paragraph assertion and idle fixture controls are authored
but unrun; native shaping/justification/measurement/selection/AX/installed/pixels
remain unqualified. Keep native/visual authorization boundaries separate.

```tsx
// Dynamic host example; static app alignment belongs in classes.
export function Amount(props: { value: string; rtl: boolean }) {
  return <label text={props.value} style={{ textAlign: 'end', direction: props.rtl ? 'rtl' : 'ltr' }} />
}
```

## AppKit patterned borders

Native border-style now paints dashed/dotted through CAShapeLayer with NSNumber
dash arrays: one closed rounded path for uniform patterns, clipped side strokes
for mixed widths/colors/styles. None/hidden sides paint and consume zero border
width in Mason; width-only native styling still defaults solid when the style
is removed. The maintained FileInput dropzone uses this path. Box-frame ownership
captures cleanup, guards retired/replaced callbacks and releases late handles;
failed setup/update remains retryable. Do not equate this source path with native
pixel/scale/NSNumber/resize/shadow/clipping/memory/installed qualification.
Double/groove/ridge/inset/outset paint as per-side filled bands (double needs
width ≥ 3; 3D shades use Chromium's darkening; inner band edges stay straight
at rounded corners); unknown styles warn and draw solid. Non-solid outlines
remain outside this implementation. See [border subset](../../../../docs/app/styling.md#appkit-borders).

```css
.attachment-target { border-width: 2px; border-style: dashed; border-radius: 8px; }
.mixed-edges { border-width: 2px; border-style: dotted solid; border-right-width: 4px; }
.no-border { border-style: none; }
```

Twelve source cases and an idle AppKit fixture are authored but unrun. Static
fixture styles stay in its CSS sibling; dynamic width/radius/style controls use
style objects. Running it requires this task's native verification authorization,
and visual comparison requires separate visual authorization. Mounting alone
qualifies no native layer or presentation behavior.

## Experimental AppKit overflow clipping

The renderer now sets NSView.clipsToBounds for two clipped axes (`hidden` or
`clip`) and clears it for two `visible` axes. Removed styles/classes restore the
original native value, including per-class/OS defaults; native replacement owns
a new baseline. Rounded CALayer masks remain independent.

```tsx
<masonview style={{ width: 160, height: 48, overflow: 'hidden' }}>
	<label text="Content remains inside this native view's bounds" />
</masonview>
```

Mixed axes and auto/scroll values restore the native baseline and warn once per
unsupported property; use scroll view APIs for scrolling. Six source-slice cases
and the manual fixture are authored, unrun. Native drawing/hit-testing/AX/shadows
and packaging remain unqualified. This renderer prerequisite does not itself fix
Tokenizer's legacy geometry, duplicate layer row refs or counter layout.
See [the renderer subset](../../../../packages/macos-renderer/README.md#clip-appkit-container-overflow).

## Windows media-query boundary

The experimental [Windows media-query leaf](../../../../docs/platform/windows-setup.md#media-query-candidate)
uses DIP window metrics and sampled input/animation capabilities. Use queries
for conditional behavior in a compiled component or custom hook. Primary input
prefers mouse, then pen, then touch; `any-pointer` preserves hybrid input.
Unknown capabilities and unsupported features do not match, even under `not`.
Updates follow root layout and app resize/launch/resume; hotplug/settings events,
secondary windows and actual NativeScript execution remain unqualified.

```tsx
import { useMediaQuery } from '@octane-xplat/ui'

export function useCompactTouchLayout() {
  return useMediaQuery('(max-width: 1024px) and (pointer: coarse) and (hover: none)')
}
```
