# Sell and restore an in-app purchase

ID: in-app-purchases
Targets: ios, android
Related APIs: @octane-xplat/billing, billing.connect, billing.fetchProducts, billing.onPurchase, billing.requestPurchase, billing.getAvailablePurchases, billing.finishTransaction

## Starting point

A signed-in native app, store products/test accounts and an app-owned backend
that can verify store evidence and durably record account entitlements.

## Requirements

Show a localized store price, initiate a purchase, verify/grant before completion,
and recover unfinished transactions or restored access without duplicate grants.
Keep unsupported purchase types and store/device qualification explicit.

## Acceptance criteria

- AC1: The reader configures a product and sandbox/test account, owns the connection and observes its real title/localized price, with unavailable/readiness recovery.
- AC2: Purchase initiation installs listeners first and handles cancellation, pending, errors and duplicate updates without granting from a request result or unverified event.
- AC3: The backend contract authenticates the account, verifies app/product/environment and completed store evidence, binds ownership and commits an idempotent grant before completion; sensitive proof stays out of logs.
- AC4: Restoration and relaunch recover purchases through the same verification path; failed completion can retry without duplicate grants, while closing an owner retires late UI work and removes listeners.
- AC5: Consumable completion and server-ledger recovery are distinct from non-consumables; subscription initiation/renewal limits and unsupported targets are explicit, with concrete store/device qualification steps.

## Documentation

- AC1: [Store registration](../../../docs/platform/in-app-purchases.md#register-one-product), [connection/screen](../../../docs/platform/in-app-purchases.md#own-the-store-connection-and-screen) and [billing README](../../../packages/billing/README.md) provide setup, awaitable `connect()` readiness and manual readiness retry. Service-initiated connection drops are not observable — `canMakePayments()` remains the post-connect authority.
- AC2: [Purchase lifecycle](../../../docs/platform/in-app-purchases.md#buy-finish-and-recover), [maintained controller](../../../packages/demos/src/billing-guide/purchases.ts) and [controlled regressions](../../../packages/billing/tests/purchase-guide.test.mjs).
- AC3: [Backend contract](../../../docs/platform/in-app-purchases.md#implement-the-backend-contract-before-buying) specifies the required verification, ownership and ledger invariants; store integration and database deployment are explicit starting prerequisites, not a supplied server.
- AC4: [Purchase recovery](../../../docs/platform/in-app-purchases.md#buy-finish-and-recover) and [controller regressions](../../../packages/billing/tests/purchase-guide.test.mjs) cover finish retry, restoration, repeated delivery and disposal.
- AC5: [Purchase types and limits](../../../docs/platform/in-app-purchases.md#buy-finish-and-recover) and [sandbox checks](../../../docs/platform/in-app-purchases.md#check-the-complete-sandbox-journey) describe boundaries. Subscription initiation forwards a `'subs'`-fetched product — Play applies its first offer and plan changes are unexposed; no real store transaction or provider-verification journey is qualified by mocked checks.
