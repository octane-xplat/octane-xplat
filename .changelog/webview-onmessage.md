### WebView page-to-host messaging

`WebView` gains a bounded `onMessage` channel: the embedded document calls
`postToHost` (exported from `@octane-xplat/ui`) with a JSON-serializable
value, and the host's `onMessage` receives `{ data, url?, origin? }` —
ordered, at-least-once, with no reply. This is the supported way for trusted,
app-embedded content to signal readiness or events; it is not a general
script bridge. Delivery is immediate over `postMessage` on web and
poll-drained (~200 ms) on native; origin and payload validation stay with
the app.

```tsx
import { WebView, postToHost } from '@octane-xplat/ui'

// Host:
;<WebView src="https://example.com/widget" onMessage={(e) => console.log(e.data)} />

// Inside the embedded document:
postToHost({ type: 'ready' })
```

Host→page evaluation and request/reply remain on the `native` handle or the
platform escape bags. See [WebView content sizing and messaging](https://octane-xplat.goddardai.org/app/primitives).
