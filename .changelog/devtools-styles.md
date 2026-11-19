### Edit running-app styles in devtools

The Styles tab lets you preview edits to inline style objects and Bamboo `css()` calls. In a web app, pick an element on screen to find its styles, then filter by property. Save or revert style changes separately from Tweaks edits. Each tab includes its own edits to components that have left the screen.

```tsx
import { Text, View } from '@octane-xplat/ui'

export function Card() {
  return <View style={{ padding: 16 }}><Text>Try changing the padding in Styles.</Text></View>
}
```

[Edit styles](https://octane-xplat.goddardai.org/package-tweaks#edit-styles)
