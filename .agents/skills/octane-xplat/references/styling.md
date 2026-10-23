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

Mason core `1.0.0-beta.1` automatically supplies owning-window safe-area
`env()` values to loaded Mason container roots and re-evaluates styles when
insets change. The installed package advertises `owning-window-v1`; the preset
keeps a qualification warning because native dispatch/layout has only headless
adapter coverage. Do not describe that as device-tested. Ordinary NativeScript
controls and older/full engines still need `useSafeAreaInsets()` inline styles.
See [safe-area styling](../../../../docs/app/styling.md#safe-area-insets).

```css
.chrome { padding-top: env(safe-area-inset-top, 0px); }
```

For engines without the resolver, keep browser-only `env()` rules conditional:

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
- The experimental macOS AppKit renderer supports a smaller set of named
  styles — check `docs/testing/known-limits.md` before promising a property.

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
