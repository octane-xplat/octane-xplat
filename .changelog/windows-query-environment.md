### Use native connectivity for Windows query clients

Experimental Windows query clients now select the NativeScript environment
instead of the browser adapter. Network availability follows the WinRT connection
level, so an unknown transport no longer implies offline state. App activity
uses suspension and window visibility. App reconnect delivery and lifecycle
refresh still need runtime qualification.

```ts
import { createQueryClient } from '@octane-xplat/ui/data'

const queries = createQueryClient({ namespace: 'travel' })
```

[Query lifecycle](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/data.md#the-shared-query-cache)
