# @octane-xplat/billing

Offer in-app products and subscriptions on iOS and Android through StoreKit
and Google Play Billing. The package owns store communication; your app owns
the purchase screen, backend verification, and access to purchased features.
Web and desktop report `supported: false`.

## Read a product

Install in an existing Xplat app:

```sh
pnpm add @octane-xplat/billing
```

Create the product in App Store Connect or Google Play Console first. Use a
store test account and the matching app identity. Follow the
[NativeScript Payments prerequisites](https://github.com/NativeScript/payments#prerequisites)
for the platform setup. Call this with the registered product ID:

```ts
import { billing } from '@octane-xplat/billing'

export async function readSubscription(productId: string) {
	if (!billing.supported || !billing.canMakePayments()) return null
	billing.connect()
	try {
		const products = await billing.fetchProducts([productId], 'subs')
		return products[0] ?? null
	} finally {
		billing.disconnect()
	}
}
```

The result should contain the store's title and localized price. If it is
absent, check product status, app identity, test account, and the product ID.
Use an app-owned connection for a full purchase flow instead of disconnecting
after each read.

## Complete verified purchases

Listen before requesting a purchase. Only finish a purchased transaction after
your backend verifies it and your app records the entitlement. The callback
below is an app-supplied verification operation; it must return `true` only
after both succeed. Pending or failed verification leaves the transaction
unfinished for recovery:

```ts
import { billing, type Purchase } from '@octane-xplat/billing'

export function listenForPurchases(
	verifyAndGrant: (purchase: Purchase) => Promise<boolean>,
	onError: (error: unknown) => void,
) {
	const offError = billing.onPurchaseError(onError)
	const offPurchase = billing.onPurchase(async (purchases) => {
		for (const purchase of purchases) {
			if (purchase.state !== 'purchased') continue
			try {
				if (await verifyAndGrant(purchase)) await billing.finishTransaction(purchase)
			} catch (error) {
				onError(error)
			}
		}
	})
	return () => {
		offPurchase()
		offError()
	}
}
```

Keep the listeners for the billing owner's lifetime and call the returned
cleanup when it ends. Do not use a successful purchase request as proof of an
entitlement. See the [public contract](https://github.com/octane-xplat/octane-xplat/blob/main/packages/billing/src/types.ts)
for requesting, restoring, and consumable completion options.
