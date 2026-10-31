### Subscription checkout reaches the store sheet

`billing.requestPurchase` no longer re-fetches every product as `inapp`,
which blocked Google Play subscription checkout. Pass the product returned
by `fetchProducts(ids, 'subs')` so its offer details reach the store, or
pass an id with `{ type: 'subs' }` to select the catalog. Play applies the
product's first offer; choosing between offers and changing an active
subscription are not exposed.

```ts
import { billing } from '@octane-xplat/billing'

const [plan] = await billing.fetchProducts(['com.example.plan.monthly'], 'subs')
if (plan) await billing.requestPurchase(plan)
```

[Billing](https://github.com/octane-xplat/octane-xplat/blob/main/packages/billing/README.md)
