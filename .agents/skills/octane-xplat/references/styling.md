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
   `clsx`-style, falsy entries drop.
4. **Utility classes are a shared vocabulary** (`flex-1`, `gap-4`,
   `bg-primary`, `text-onprimary`...) — the curated shared set lives in
   `packages/ui/src/theme/tokens.css`; app-only selectors live in
   `packages/app/src/app.css`. See docs/css-support-matrix.md for what
   NativeScript actually honors.
   - **Do not add Tailwind** (web `@tailwindcss/vite` or native
     `@nativescript/tailwind`): blocked on
     [NativeScript/tailwind#226](https://github.com/NativeScript/tailwind/issues/226) —
     its stale allowlist strips core-supported props incl. `gap`, deletes all
     `@media`, and rewrites `invisible`→`collapse`, so the same class
     silently diverges across targets.
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

## Tokens

CSS vars (`--color-primary` etc.) in `packages/ui/src/theme/tokens.css` —
imported once by the app entry. Values resolve at **app stylesheet scope**:
`getCssVariable('--color-primary')` returns the same value inside every
native root. See `styling/tokens.md` for the inventory.

```ts
// Import once in the app entry.
import '@octane-xplat/ui/theme/tokens.css'
```

- **`tokens.css` is required structure**, not decoration — it carries the
  normalization and layout rules components rely on, and omitting it breaks
  geometry. `chrome.css` is the optional decoration layer (default colors,
  borders, fonts); import it after `tokens.css`, before the app's own CSS.
- **Use JS `import` for stylesheets.** CSS `@import` bypasses the native
  preset's px-to-DIP rewrite, so rules pulled in that way land unscaled.
- The experimental macOS AppKit renderer supports a smaller set of named
  styles — check `docs/verify/known-limits.md` before promising a property.

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

`styled(Base, { base?, variants? })` → component taking Base's props plus
boolean flags for class variants or option-name unions for enumerated
variants. `defaultVariants` selects omitted values; classes compose with the
base component and the caller's `className`.

```tsx
import { styled, Pressable, Text } from '@octane-xplat/ui'

const DangerButton = styled(Pressable, { base: 'trip-button', variants: { danger: 'bg-danger' } })
export function Remove() {
	return (
		<DangerButton danger className="extra">
			<Text>Remove</Text>
		</DangerButton>
	)
}
```
