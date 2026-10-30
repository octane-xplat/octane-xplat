# @octane-xplat/billing

Display store products and manage verified one-time purchases on iOS and Android
through StoreKit and Google Play Billing. Your app owns the screen, backend
verification and entitlement ledger. Web and desktop report `supported: false`.
For the complete purchase/restore path, follow [Sell and restore an in-app purchase](https://octane-xplat.goddardai.org/in-app-purchases).

## Show a store product

Install in an existing Xplat app:

```sh
bun add @octane-xplat/billing
```

Register a non-consumable product and test account first, following the
[guide's store setup](https://octane-xplat.goddardai.org/in-app-purchases#register-one-product).
Use its exact product ID in a screen action. The result contains the store's
title and localized price; keep the connection for the billing owner's lifetime:

```ts
import { billing } from '@octane-xplat/billing'

export async function readProduct(productId: string) {
	if (!billing.supported) return { status: 'unavailable' as const }
	billing.connect()
	if (!billing.canMakePayments()) return { status: 'retry' as const }
	const products = await billing.fetchProducts([productId], 'inapp')
	return { status: 'loaded' as const, product: products[0] ?? null }
}

export function closeBillingOwner() {
	billing.disconnect()
}
```

Handle a rejected read in your screen's error state. A `retry` result can mean
that Android is still connecting, or payments are restricted; offer Reload store
after checking the store account. Connection readiness is not currently awaitable
([#70](https://github.com/octane-xplat/octane-xplat/issues/70)). If a loaded product
is absent, check its ID, app identity, availability and tester setup. Release the
owner when it ends; do not disconnect immediately after initiating a purchase.

## Complete and restore safely

Use the [maintained controller and screen](https://octane-xplat.goddardai.org/in-app-purchases#own-the-store-connection-and-screen)
for listeners installed before purchase initiation, authenticated verification,
pending/cancelled states, duplicate events, restore and disposal. A returned
purchase request is not proof of payment. The backend must verify and durably
grant before the app finishes a purchased transaction:

```ts
import { billing, type Purchase } from '@octane-xplat/billing'

export async function finishVerifiedPurchase(purchase: Purchase) {
	// Only after server verification and durable entitlement commit.
	await billing.finishTransaction(purchase, { consume: false })
}
```

The purchase object must retain its native transaction reference. Query the
store again after restart instead of persisting this object as JSON. The guide
specifies the [backend contract](https://octane-xplat.goddardai.org/in-app-purchases#implement-the-backend-contract-before-buying)
and recovery checks; the package supplies neither a server verifier nor an
entitlement database.

Subscription listing exists, but checkout currently re-fetches every product
as `inapp`; [#69](https://github.com/octane-xplat/octane-xplat/issues/69) tracks
subscription initiation. Listing a subscription does not qualify its checkout.
Use the guide's [support and recovery boundaries](https://octane-xplat.goddardai.org/in-app-purchases#buy-finish-and-recover)
before choosing consumables or subscriptions.
