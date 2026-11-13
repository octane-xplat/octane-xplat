# Show when a screen is ready

> Observe screen-owned loading, failures and background work through shared readiness scopes.

Use readiness to show loading and failure messages for work owned by a screen. A scope groups that work through Octane context, so child components do not pass status callbacks through every parent. It works in production and development. Start in a running app with `@octane-xplat/platform` installed, and put this in `src/Checkout.tsrx`:

```tsx
import 'octane/signals'
import { Text } from '@octane-xplat/ui'
import {
  ReadinessScope, useReadinessTask, useReadiness$,
} from '@octane-xplat/platform/readiness'

function CheckoutContent(props: { loading: boolean }) {
  useReadinessTask({ label: 'Loading checkout', pending: props.loading })
  const readiness$ = useReadiness$()
  return <Text>{readiness$.get().status === 'pending' ? 'Loading checkout…' : 'Checkout ready'}</Text>
}

export function Checkout(props: { loading: boolean }) {
  return <ReadinessScope label="Checkout"><CheckoutContent loading={props.loading} /></ReadinessScope>
}
```

Render `Checkout` with `loading={true}`, then change it to `false`. The message changes from “Loading checkout…” to “Checkout ready”. The scope never hides content, suspends rendering or disables controls. Place it around the smallest screen or panel whose work belongs together; nested scopes contribute to their parent.

```tsx
export function LoadingCheckout() { return <Checkout loading={true} /> }
export function ReadyCheckout() { return <Checkout loading={false} /> }
```

## Report work and recover from errors

`useReadinessTask` reports one component-owned task. Updating its props updates that task, and unmounting removes it. `pending` means running or paused work; `error` records failure separately. Clear the error when retrying. A required failure gives the scope status `blocked`, even if other required work is still pending. With no required failures, status is `pending` while required work runs and `ready` once it succeeds.

```tsx
import { useReadinessTask } from '@octane-xplat/platform/readiness'

function PreviewWork(props: { loading: boolean; error?: unknown }) {
  useReadinessTask({
    label: 'Preparing preview',
    pending: props.loading,
    error: props.error,
  })
  return null
}
```

`useReadiness$` returns a read-only Octane signal for the nearest scope. Read its status to choose your own loading or recovery UI. Import `octane/signals` in each module that reads the signal. Reading without a scope throws a configuration error; reporting work outside a scope is inert. The [loading](../../examples/readiness/loading.tsrx) and [recovery](../../examples/readiness/recovery.tsrx) examples show complete compositions.

```tsx
import 'octane/signals'
import { Text } from '@octane-xplat/ui'
import { useReadiness$ } from '@octane-xplat/platform/readiness'

export function ReadinessMessage() {
  const readiness$ = useReadiness$()
  const state = readiness$.get()
  return <Text>{state.status === 'blocked' ? 'Something failed. Try again.' : state.status === 'pending' ? 'Loading…' : 'Ready'}</Text>
}
```

## Keep usable content during background work

Shared `useQuery$` readers from [the query cache](data.md#the-shared-query-cache) register automatically inside a scope in every build mode. An initial load without data blocks readiness. Refreshing with usable data records background work; a refresh failure records a background failure while keeping the screen ready. Initial failures block readiness but stop counting as pending. Paused requests remain pending. Query keys, data and raw errors never enter readiness snapshots.

```tsx
import 'octane/signals'
import { Text } from '@octane-xplat/ui'
import { createQueryClient, defineQuery, useQuery$ } from '@octane-xplat/ui/data'

const client = createQueryClient()
const greeting = defineQuery(['greeting'], async (name: string) => `Hello ${name}`)

export function Greeting() {
  const reader = useQuery$(client, greeting, 'Ada')
  return <Text>{reader ? reader.data$.get() : 'Loading…'}</Text>
}
// Mount Greeting inside ReadinessScope. Dispose client when its app/account ends.
```

For custom refreshes, set `blocking: false` when existing content remains usable. The snapshot lists all pending and failed work with a `blocking` flag, while its status describes required work. Use static labels without customer data: null/undefined error means no failure, and other error values record failure without retaining the value.

```tsx
useReadinessTask({
  label: 'Refreshing preview',
  pending: refreshing,
  error: refreshError,
  blocking: false,
})
```

## Wait from an owned service

Services can use the renderer-free controller entry point. Register a task, update the same registration on success, failure or retry, and dispose it when its owner ends. A normal wait requires blocking work to succeed; `includeBackground: true` also requires background work to succeed. Failures reject promptly with `readiness_failed`; deadlines, caller cancellation and owner disposal have distinct error codes. Waiting never cancels the underlying work for other callers.

```ts
import { createReadinessScope } from '@octane-xplat/platform/readiness/controller'

const scope = createReadinessScope('Preview service')
const task = scope.register({ label: 'Preparing preview', pending: true })
try {
  task.update({ label: 'Preparing preview', pending: false })
  const ready = await scope.wait({ timeoutMs: 1000, includeBackground: true })
  console.log(ready.status)
} finally {
  task.dispose()
  scope.dispose()
}
```

Successful waits require the selected work to stay complete across an event-loop turn. This covers registered work only: it does not prove foreground route identity, image decoding, animations, native frame presentation or future work. Register custom resources explicitly. [Development actions](../testing/development-actions.md#wait-for-a-screens-registered-work) automatically use a strict wait on their nearest scope after their handler returns.

```tsx
useReadinessTask({ label: 'Decoding preview image', pending: decoding, error: decodeError })
```
