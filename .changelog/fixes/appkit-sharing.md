### Wait for native macOS sharing to complete

Native AppKit sharing now uses the package's compiled picker bridge, accepts
local file URLs and forwards text subjects and link titles. Rebuild the native
host after updating. A picker opening no longer counts as shared; outcomes wait
for completion or cancellation. Keep shared files alive until the promise settles.
Actual OS picker and transfer qualification remains pending.

```ts
import { share } from '@octane-xplat/share'
const outcome = await share.file('file:///tmp/trip%20notes.txt')
```

See [native AppKit sharing](https://github.com/octane-xplat/octane-xplat/tree/main/packages/share#native-appkit-sharing).
