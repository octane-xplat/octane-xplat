# Styling screens

> Put reusable appearance in CSS classes and tokens; use inline style values
> only when the value changes while the app runs.

## The everyday rule

```tsx
<View className="card">
	<Text className="card-title">Profile</Text>
	<View style={{ opacity: disabled ? 0.5 : 1 }} />
</View>
```

- `className` is for layout, colors, typography, borders, and other stable
  choices.
- `style` is for runtime values such as an animated position or a measured
  size.
- Shared styles must use properties supported by both targets.

## Build a small token layer

Keep colors, spacing, and type sizes in tokens instead of repeating raw values
through every component. A theme can then change the whole app without
rewriting screens.

```css
:root {
	--color-surface: #fffdf5;
	--color-ink: #000;
	--space-4: 16px;
}

.card {
	background: var(--color-surface);
	color: var(--color-ink);
	padding: var(--space-4);
}
```

## Font-family tokens

`packages/ui/src/theme/tokens.css` provides `--font-sans` and `--font-mono`
as portable fallback lists. The framework cannot derive one family name from a
font file: the web face name, the iOS name, and the Android name are different
identifiers. Apps own the registration and override the token at the stylesheet
boundary:

| Target | Register the font | Token value |
| --- | --- | --- |
| Web | `@font-face { font-family: 'Acme Sans'; src: ... }`, or use an installed family | `'Acme Sans', system-ui, sans-serif` |
| iOS | Ship the file in the app fonts directory; use its internal/PostScript font name | `'AcmeSans-Regular', sans-serif` |
| Android | Ship the file in the app fonts directory; use the filename without `.ttf`/`.otf` | `'acme-sans-regular', sans-serif` |

For a bundled face with different file and internal names, put both native
names in the platform-specific family list. NativeScript's `ns fonts` command
can print the CSS names for a font directory. Keep the token name (`--font-sans`)
stable in shared components; only the registered family value changes per
target. See the [NativeScript fonts guide](https://beta.docs.nativescript.org/project-structure/src/fonts).
*Token defaults verified on both targets; bundled-font registration pending
an on-device check.*

## Keep layouts honest

Flex layouts are the safest common starting point. Prefer `Row`, `View`, and
spacing classes over target-specific positioning. Check a screen at a narrow
browser width and on a native device before adding a platform split.

## Wrap text on native

NativeScript uses `white-space: wrap` to let `Text`/`Label` content flow onto
multiple lines. It rejects the web value `pre-wrap`. If web also needs
`pre-wrap` to preserve whitespace, set the values in platform-specific styles:
use `pre-wrap` on web and `wrap` on native. Native `wrap` enables line
wrapping, but does not preserve repeated spaces and newlines like web
`pre-wrap`.

## No Tailwind yet

Do not add `tailwindcss`/`@nativescript/tailwind` to an app. The native
plugin currently diverges from web Tailwind in ways that fail silently
(blocked upstream:
[NativeScript/tailwind#226](https://github.com/NativeScript/tailwind/issues/226)).
Write the same vocabulary yourself as plain classes, like the token example
above — `className` keeps working identically on both targets.

For theme propagation, supported CSS differences, and the cases where a
platform leaf is necessary, see the [styling notes](styling-notes.md) and the
[CSS support notes](css-support-notes.md).
