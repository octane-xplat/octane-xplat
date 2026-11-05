---
hype: 50
---

### Keep macOS apps stable when views and event monitors retire

The AppKit renderer continues independent cleanup when a subscription, nested view, or native release throws. Retired controls ignore held callbacks, cleanup errors preserve the original construction error, and removed keyboard or pointer event monitors no longer crash the host during garbage collection.

Unmounting a root clears its inherited font and debug membership even when cleanup throws. A second live root on the same native view reports an error; reuse the existing root or unmount it before creating its replacement.

```ts
import { createMacOSRoot } from '@octane-xplat/macos-appkit'

const root = createMacOSRoot(host)
root.unmount()
const replacement = createMacOSRoot(host)
```

[Experimental macOS renderer](https://octane-xplat.goddardai.org/package-macos-appkit)
