### Highlight a working surface with BorderBeam

`BorderBeam` adds a traveling light around a card, input, or other surface. Set `active` from your app's work state. People who prefer reduced motion see a steady highlight. Available on web, iOS, Android, and macOS.

```tsx
import { Text } from '@octane-xplat/ui'
import { BorderBeam } from '@octane-xplat/ui/border-beam'

<BorderBeam active={exporting} radius={12}>
  <Text>{exporting ? 'Exporting report…' : 'Ready to export'}</Text>
</BorderBeam>
```

[Highlight a working surface with BorderBeam](https://octane-xplat.goddardai.org/components#highlight-a-working-surface-with-borderbeam)
