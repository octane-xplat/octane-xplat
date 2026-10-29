### Keep native PIN cells in one field

Native PinInput now uses one field label and honours the field width. Each
editor keeps its own numbered accessible name and identity.

```tsx
import { PinInput } from '@octane-xplat/ui'

export function CodeEntry() {
  return <PinInput label="Code" width={280} length={4} />
}
```

[PIN entry](https://octane-xplat.goddardai.org/linux-gtk#pin-entry)
