### Compose option content on GTK

GTK apps can use SelectorOption for a label, description and decorative icon.
Box layout keeps margins outside authored dimensions and restores physical
child order when a direction override is removed.

```tsx
import { SelectorOption, Text } from '@octane-xplat/ui'

export function SmallRoom() {
  return <SelectorOption label="Small" description="Fits a day bag"
    icon={<Text>+</Text>} style={{ width: 240, margin: 8 }} />
}
```

[GTK option content and layout](https://octane-xplat.goddardai.org/linux-gtk#present-option-content)
