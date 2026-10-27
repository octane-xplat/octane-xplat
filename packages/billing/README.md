# `@octane-xplat/billing`

```sh
pnpm add @octane-xplat/billing
```

In-app purchases and subscriptions — StoreKit 2 and Play Billing through
`@nativescript/payments`. Owns the store transaction loop; paywall UI and
server-side receipt validation stay in the app.

```ts
import { billing } from '@octane-xplat/billing'

billing.connect()
const unsubscribe = billing.onPurchase(async (purchases) => {
	for (const p of purchases) {
		await grantEntitlement(p)
		await billing.finishTransaction(p)
	}
})

const products = await billing.fetchProducts(['com.app.pro'], 'subs')
await billing.requestPurchase('com.app.pro')
const owned = await billing.getAvailablePurchases() // restore
```

Mirrors `expo-iap`/`react-native-iap` naming (fetchProducts, requestPurchase,
finishTransaction, getAvailablePurchases). Web/desktop report
`supported: false`.
