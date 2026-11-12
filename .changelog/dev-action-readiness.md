### Wait for development screens to finish registered work

Development actions can now wait for context-owned work with `DevActionScope`. Shared queries join the nearest scope automatically in development; custom work reports a pending boolean. Outcomes name handler participants and pending work, making partial failures easier to diagnose. Readiness covers registered work and does not certify that a native frame is visible.

```tsx
import { DevActionScope } from '@octane-xplat/platform/dev-actions/readiness'
import { Checkout } from './Checkout'

export function DevelopmentCheckout() {
  if (import.meta.env.DEV) {
    return <DevActionScope label="Checkout"><Checkout /></DevActionScope>
  }
  return <Checkout />
}
```

Keep the wrapper behind your development gate. See [development actions](https://octane-xplat.goddardai.org/testing/development-actions).
