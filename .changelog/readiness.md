### Show when a screen is ready

Use `ReadinessScope`, `useReadinessTask`, and `useReadiness$` to show loading and failed work for a screen in development and production. Shared queries register automatically. A refresh can keep existing content ready while development actions wait for background work too.

```tsx
import 'octane/signals'
import { ReadinessScope, useReadinessTask, useReadiness$ } from '@octane-xplat/platform/readiness'
import { Text } from '@octane-xplat/ui'

type CheckoutStatus = { loading: boolean; error?: Error }

function Status({ loading, error }: CheckoutStatus) {
  useReadinessTask({ label: 'Loading checkout', pending: loading, error })
  const readiness$ = useReadiness$()
  const message = { pending: 'Loading checkout…', blocked: 'Checkout unavailable', ready: 'Checkout ready' }
  return <Text>{message[readiness$.get().status]}</Text>
}

export function Checkout(status: CheckoutStatus) {
  return <ReadinessScope label="Checkout"><Status {...status} /></ReadinessScope>
}
```

[Screen readiness](https://octane-xplat.goddardai.org/readiness) · [Wait in a development action](https://octane-xplat.goddardai.org/development-actions#wait-for-a-screens-registered-work)
