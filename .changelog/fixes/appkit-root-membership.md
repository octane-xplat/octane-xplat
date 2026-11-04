### Retire macOS roots without leaving stale ownership

Unmounting an AppKit root now clears its inherited font and debug membership, including when cleanup throws. Creating a second live root on the same native view reports an error; reuse the existing root, or unmount it before creating its replacement.

```ts
import { createMacOSRoot } from '@octane-xplat/macos-appkit'

const root = createMacOSRoot(host)
root.unmount()
const replacement = createMacOSRoot(host)
```

[Experimental macOS renderer](https://octane-xplat.goddardai.org/package-macos-appkit)
