### New package: `@octane-xplat/billing`

In-app purchases and subscriptions via `@nativescript/payments` (StoreKit 2 +
Play Billing) — product fetch, purchase events, transaction finish, restore,
subscription management.

```ts
billing.connect()
billing.onPurchase(async (purchases) => { /* grant + finishTransaction */ })
await billing.requestPurchase('com.app.pro')
```

Web/desktop report `supported: false`.
