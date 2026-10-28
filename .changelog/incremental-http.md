### Read HTTP responses as they arrive

The optional network package adds incremental response bytes on web,
iOS, Android, and experimental AppKit. Cancellation releases the request;
unread native data is bounded. This is a byte-stream API with an explicit
request subset, not a replacement for global fetch.

```ts
import { requestStream } from '@octane-xplat/network'
const response = await requestStream('https://example.com/api/events')
const reader = response.body.getReader()
try { console.log((await reader.read()).value?.byteLength) }
finally { await reader.cancel(); reader.releaseLock() }
```

[Network documentation](https://github.com/octane-xplat/octane-xplat/tree/main/packages/network)
