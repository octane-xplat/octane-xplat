---
hype: 40
---

### Keep Linux GTK app settings between launches

On Linux GTK, values written through platform `storage` or GTK’s `ApplicationSettings` now persist when the app closes. The UI query cache can also use persistent storage on GTK.

```ts
import { storage } from '@octane-xplat/platform'

export function selectBag(name: string) {
  storage.setString('selected-bag', name)
}

export function readSavedBag() {
  return storage.getString('selected-bag') // Call on startup.
}
```

[Local storage](https://octane-xplat.goddardai.org/local-storage)
