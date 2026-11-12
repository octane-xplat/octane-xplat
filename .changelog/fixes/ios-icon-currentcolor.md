### Tint SVG icon shapes on iOS

Registered SVG markup now applies `Icon.color` to `currentColor` fills and strokes on iOS instead of leaving them black. Nested color scopes, fixed colors, and unpainted shapes keep their authored behavior. External icon files keep their own colors.

```tsx
import { createIconRegistry, Icon } from '@octane-xplat/ui'
const icons = createIconRegistry()
icons.registerIcon('ring', {
  markup: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor"/>',
})
export function Ring() {
  return <Icon name="ring" registry={icons} color="#2563eb" />
}
```

[Icon documentation](https://octane-xplat.goddardai.org/components#content)
