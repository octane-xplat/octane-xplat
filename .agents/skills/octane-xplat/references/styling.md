# Styling

One CSS pipeline, both targets: authored classes → PostCSS/lightningcss →
CSS vars + utility classes → NativeScript's CSS engine applies the subset it
supports, DOM gets the whole thing. The `vx-*` class namespace is the
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

## Tokens

CSS vars (`--color-primary` etc.) in `packages/ui/src/theme/tokens.css` —
imported once by the app entry. Values resolve at **app stylesheet scope**:
`getCssVariable('--color-primary')` returns the same value inside every
native root. See `styling/tokens.md` for the inventory.

```ts
// Import once in the app entry.
import '@octane-xplat/ui/theme/tokens.css'
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

`styled(Base, { base?, variants? })` → component taking Base's props plus
each variant name as a boolean flag → composes `className`. Verified: the
variant prop composes `bg-danger` + `extra` classes on native.

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
