# Styling

Use classes for static styling and inline style objects for values that change
while the app runs. Put the CSS in `src/style.css` and the component in a
`.tsrx` file.

```css
.trip-card {
	padding: 16px;
	border-radius: 12px;
}
```

```tsrx
import { View, Text } from '@octane-xplat/ui'

export function TripCard(props: { opacity: number }) {
  return <View className="trip-card" style={{ opacity: props.opacity }}>
    <Text>Your next adventure</Text>
  </View>
}
```

## Shared CSS

Shared CSS compiles for web and native. Prefer flex layouts, padding, and
supported transforms. The native build warns when it drops declarations such
as `position: fixed`, `margin: auto`, or `box-shadow`; resolve the warning
before depending on that style.

```css
.trip-card {
	display: flex;
	flex-direction: column;
	padding: 16px;
}
.trip-actions {
	display: flex;
	flex-direction: row;
	justify-content: center;
}
```

## Tokens and dark mode

The starter imports the framework's tokens. They provide shared layout rules; the starter
defines its app palette in `src/style.css`. Use the palette tokens in your CSS.

```ts
import '@octane-xplat/ui/theme/tokens.css'
```

```css
.trip-card {
	background-color: var(--color-surface);
	color: var(--color-text);
}
```

Use `useColorScheme()` to follow the system theme. Apply the matching class to
the root so the token colors follow the theme; a user preference can override
this in the starter's `src/App.tsrx`.

```tsrx
import { View, Text, useColorScheme } from '@octane-xplat/ui'

export function ThemePreview() {
  const scheme = useColorScheme()
  return <View className={scheme === 'dark' ? 'dark' : 'light'}>
    <Text>Ready for your next trip</Text>
  </View>
}
```

## Fonts

System fonts are the default. Add a custom font when your app needs one.

`pnpm xplat fonts add <file>` registers a font everywhere: stages a `.ttf`
into `src/fonts` (iOS/Android pick it up from there; `.woff`/`.woff2` inputs
are converted), writes the web `@font-face` into `src/fonts.css`, and wires
`--font-sans` (or another token via `--token mono|none|<name>`) in
`style.css`. Fontsource packages work too —
`pnpm xplat fonts add @fontsource-variable/inter --install` imports the
package's own CSS on web and stages its converted files natively (upright
faces only — italic files are skipped). Variable
fonts carry their weight range — `font-weight` on `Text` selects the matching
instance. Family names differ per target; the command reads them from the
file itself. See the styling guide at
https://octane-xplat.goddardai.org/styling for the per-target table.

```sh
pnpm xplat fonts add ./Inter.ttf
pnpm xplat fonts add @fontsource-variable/inter --install
```
