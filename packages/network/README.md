# Incremental HTTP responses

Read a response while the server is still sending it. This leaf uses browser
fetch, NSURLSession on iOS/AppKit, and OkHttp on Android; it does not replace
the global fetch implementation. It is a byte-stream API, not a drop-in Fetch
implementation or a Coreframe/Rouzer client adapter.

```sh
pnpm add @octane-xplat/network
```

Read non-2xx status before consuming the body. For small JSON responses, the
text/JSON helpers decode UTF-8 and reject beyond 1 MiB; consume the byte stream
incrementally for larger responses. Calls to the convenience helpers consume
the body once.

```ts
import { requestStream } from '@octane-xplat/network'
const response = await requestStream('https://example.com/api/status')
if (!response.ok) {
  await response.body.cancel()
  throw new Error(`HTTP ${response.status}`)
}
console.log(await response.json())
```

A reader receives chunks before response completion. Cancel it when its owner
ends; cancellation and abort release the native request. Always release the
reader lock. Consumer parsers must handle records and UTF-8 characters split
across chunks. Rouzer's `decodeNdjson` is covered by a maintained consumer and
split-character test; it still needs the target's streaming TextDecoder. This
package uses its own codec for text/JSON and does not install global polyfills.

```ts
import { requestStream } from '@octane-xplat/network'
const response = await requestStream('https://example.com/api/events')
const reader = response.body.getReader()
try {
  const first = await reader.read()
  console.log(first.value?.byteLength)
} finally {
  await reader.cancel()
  reader.releaseLock()
}
```

Send text or bytes with explicit content type and authorization headers. The
supported methods are GET, HEAD, OPTIONS, POST, PUT, PATCH, and DELETE. GET/HEAD
bodies reject. Native push transports cancel when unread data exceeds
`maxBufferedBytes` (default 1 MiB); browser readers use pull-based backpressure
and reject an individual chunk larger than that limit. This bounds transport
queues, not bytes retained by application code. Native idle timeout is 30 seconds;
browser network timeout remains browser-owned.

```ts
import { requestStream } from '@octane-xplat/network'
const response = await requestStream('https://example.com/api/upload', {
  method: 'PUT',
  headers: { 'content-type': 'application/octet-stream' },
  body: new Uint8Array([0, 255, 1]),
  maxBufferedBytes: 1024 * 1024,
})
await response.body.cancel()
```

Abort an outstanding request or reader with the target's AbortController.
Native network errors are sanitized; inspect status for HTTP failures, which
remain readable responses. Redirects reject on every target; ambient cookies,
Cookie/Host/hop-by-hop headers, FormData, Blob/Request inputs, streaming request
bodies, and automatic authentication retry are outside this contract.

```ts
import { requestStream } from '@octane-xplat/network'
const controller = new AbortController()
const pending = requestStream('https://example.com/api/events', { signal: controller.signal })
controller.abort()
try { await pending } catch (error) { console.log('Request cancelled or failed') }
```

## Native setup and evidence

Rebuild after installing the leaf. iOS needs the package module map so native
metadata exposes its NSURLSession delegate. Android packages the Java bridge
and its OkHttp dependency. AppKit compiles the package-owned Foundation bridge.
HTTP on development hosts still follows the app's ATS/Android network policy;
use HTTPS in production. Do not weaken app-wide TLS settings for this API.

The [readiness record](../../.agents/docs/notes/still-native-readiness.md)
separates source, unit, packaged, and runtime evidence. Physical background
execution is not implied by an open network stream. Windows and native Linux
are unqualified; those native entries reject explicitly. A missing mobile/AppKit bridge asks for a rebuild.

## Run the maintained checks

From the framework root, run the package checks through Turbo. The native/AppKit runtime fixture starts a synthetic server on port 19687 and
uses the repository probe runner. Keep that port free. The web target runs a
headless Chromium fixture on an ephemeral local port; it checks expected HTTP
error bodies without treating them as page-load failures. Neither fixture
calls a private backend or captures images. Device runs
need an owned, booted device and the normal broker reservation. Turbo forwards
the native SDK variables for this task.

```sh
pnpm exec turbo run test typecheck --filter=@octane-xplat/network
pnpm exec turbo run test:runtime --filter=@octane-xplat/network -- --target web
```
