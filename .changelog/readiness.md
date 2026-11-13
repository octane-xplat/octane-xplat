### Observe screen readiness in every build

Use `ReadinessScope`, `useReadinessTask` and `useReadiness$` to share screen-owned loading and failure state through context. Shared queries register automatically in production and development. Refreshes with usable data keep ordinary UI ready; dev actions wait for background work too and reject failures promptly.

```tsx
import { ReadinessScope } from '@octane-xplat/platform/readiness'
import { Checkout } from './Checkout'

export function CheckoutScreen() {
  return <ReadinessScope label="Checkout"><Checkout /></ReadinessScope>
}
```

Use `/readiness/controller` for owned services. Snapshot pending/failure entries contain `{ label, blocking }`; raw errors are omitted. Readiness covers registered work and does not certify native frame presentation. See [readiness](https://octane-xplat.goddardai.org/app/readiness) and [development actions](https://octane-xplat.goddardai.org/testing/development-actions).
