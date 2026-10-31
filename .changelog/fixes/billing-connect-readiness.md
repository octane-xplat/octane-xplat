### Billing connect() is awaitable

`billing.connect()` now resolves once the store reports ready, so a first
product fetch or purchase no longer races Android store setup. Await it
before checking `canMakePayments()` — a resolved connect can still mean
restricted payments or a failed setup. Reconnects after `disconnect()`
await the next readiness signal.

```ts
import { billing } from '@octane-xplat/billing'

await billing.connect()
if (billing.canMakePayments()) {
	const products = await billing.fetchProducts(['com.example.premium'], 'inapp')
}
```

[Billing](https://github.com/octane-xplat/octane-xplat/blob/main/packages/billing/README.md)
