# Sell and restore an in-app purchase

> Show a store price, sell a one-time unlock, verify it on your backend, and recover unfinished purchases.

Start by displaying **Premium** with the price supplied by the phone's store.
Then add **Buy Premium** and **Restore purchases**. Access changes only after
your backend verifies the purchase and records the account's entitlement — its
right to use Premium.

This guide uses a non-consumable product: buy it once and retain access. You need
a working iOS/Android app, a signed-in account and an app-owned backend. The
[authentication guide](../app/authentication.md) supplies the account transport;
the purchase-verification endpoints below are additional backend work. Web and
desktop billing are unavailable. Real store transactions require your own store
registration and test accounts; the framework's mocked tests do not replace them.

## Register one product

Choose a product ID such as `com.example.packing.premium`. Keep the same ID in
the app and each store's product record. It identifies the product, not its price.

For iOS:

1. Use the app's registered bundle ID and matching signing profile. Add the
   **In-App Purchase** capability to its Xcode target when configuring that target.
2. In App Store Connect, open the app's In-App Purchases section and create a
   **Non-Consumable**. Set its product ID, localized display name and price.
3. Complete the required paid-app agreement, tax/banking and product metadata
   for your account. Follow Apple's [product creation instructions](https://developer.apple.com/help/app-store-connect/manage-in-app-purchases/create-consumable-or-non-consumable-in-app-purchases/).
4. Create a Sandbox Apple Account. Use a development-signed app on a device with
   Developer Mode enabled, or distribute the app through TestFlight. Follow
   [Apple's sandbox setup](https://developer.apple.com/documentation/storekit/testing-in-app-purchases-with-sandbox).

For Android:

1. Create the matching application in Play Console and upload a signed build to
   an internal testing track. Use the same package name as the phone app.
2. Create and activate a **one-time product**, including its purchase option,
   availability and localized price. Use the product ID chosen above.
3. Add the intended Google account as a license tester and as an internal-track
   tester. Install from that track and confirm which account the store uses.
4. Use a license tester's test payment method. An internal-track installation by
   itself does not prevent real charges; see [Google's testing instructions](https://developer.android.com/google/play/billing/test).

Use the [native release guide](../start/native-release.md) for signing and test
distribution. Follow the [installed payment plugin's prerequisites](https://docs.nativescript.org/plugins/payments#prerequisites)
when store configuration changes. Product propagation can take time; an absent
product is not a reason to substitute a hardcoded price.

## Own the store connection and screen

Install the billing package in your app:

```sh
bun add @octane-xplat/billing
```

Copy [purchases.ts](../../packages/demos/src/billing-guide/purchases.ts) and
[PurchaseScreen.tsx](../../packages/demos/src/billing-guide/PurchaseScreen.tsx)
into `src/billing/`, keeping their filenames. The controller owns listeners,
serialized verification, restoration and cleanup. It uses your authenticated
transport rather than a public endpoint that trusts a posted user ID.

Render this screen only inside the signed-in account's route owner. For example,
add `src/billing/Purchases.tsx`, replacing the product ID with your store value:

```tsx
import { useEffect, useMemo } from 'octane'
import { billing } from '@octane-xplat/billing'
import { device } from '@octane-xplat/platform'
import { auth } from '../auth/client'
import { createPurchaseSession } from './purchases'
import { PurchaseScreen } from './PurchaseScreen'

export function Purchases() {
  const purchases = useMemo(() => createPurchaseSession({
    store: billing,
    request: auth.fetch,
    platform: device.os === 'ios' ? 'ios' : 'android',
    productId: 'com.example.packing.premium',
  }), [])
  useEffect(() => {
    void purchases.start()
    return () => purchases.close()
  }, [purchases])
  return <PurchaseScreen purchases={purchases} />
}
```

Use one active billing owner in the app. Closing it removes listeners and
releases the connection; late verification cannot update that closed owner's
screen or finish a transaction. Account replacement must retire this owner, as
shown in [account-owned routing](../app/authentication.md#retire-protected-routes-when-the-account-changes).
If you share purchases across several screens, lift this owner to their common
account parent and pass it down instead of creating a controller on each screen.

On a configured device, expect the product title and localized price. If the
store is still connecting, press **Reload store**. The current wrapper cannot
await connection readiness; [issue #70](https://github.com/octane-xplat/octane-xplat/issues/70)
tracks that gap. Reload performs a new readiness check and product query; it
does not assume that an arbitrary delay made the connection ready.

The controller checks availability before opening a connection. On an unsupported
target it displays an unavailable message. The component subscribes to its store
so changes reach retained native components:

```tsx
import { Text } from '@octane-xplat/ui'
import { useStore } from '@octane-xplat/ui/data'
import type { createPurchaseSession } from './purchases'

export function PurchaseStatus({ purchases }: {
  purchases: ReturnType<typeof createPurchaseSession>
}) {
  const state = useStore(purchases.state)
  return <Text>{state.message}</Text>
}
```

## Implement the backend contract before buying

The copied controller calls two authenticated endpoints. Implement them in your
backend; the authentication guide's example API supplies neither purchase
verification nor an entitlement database. The server derives the account from
its verified session and uses server-owned store credentials and app IDs.

| Operation | Request | Successful response |
| --- | --- | --- |
| Read account access | `GET /api/entitlements` | `{"premium":false}` or `{"premium":true}` |
| Verify and durably grant | `POST /api/purchases/verify` with the JSON below | `{"granted":true,"transactionId":"verified-id","productId":"com.example.packing.premium"}` |

The request contains untrusted purchase evidence, never an account ID or a
client decision to grant access:

```json
{
  "platform": "android",
  "productId": "com.example.packing.premium",
  "transactionId": "store-transaction-id",
  "receiptToken": "opaque-store-evidence"
}
```

Your endpoint must complete these operations before returning `granted: true`:

1. Authenticate the request, enforce body limits, and allowlist the product and
   platform. Never use request-supplied app identity or environment as authority.
2. Verify with the appropriate store using server credentials. Require a completed
   purchase for the configured app/product/environment, with no refund or
   revocation. Reject a pending payment. Use the store's verified transaction
   identity and quantity, not the app's claimed fields.
3. Bind the verified purchase to the authenticated account under an explicit
   ownership policy. Reject replay against another account; support account
   recovery through an audited server policy rather than silently transferring it.
4. In one database transaction, record the verified purchase and grant the account
   its entitlement. A repeated request from that same account returns the same
   successful result without granting twice. Do not return success before commit.
5. Return the matching verified product/transaction IDs. Use 401 for an invalid
   app session, 4xx for rejected evidence, and 5xx for temporary verification or
   persistence failures. The example leaves those transactions unfinished.

A minimal data model makes those rules concrete:

| Record | Important fields and invariant |
| --- | --- |
| Purchase | Store, verified purchase identity, account, verified product, status; store identity is unique across accounts |
| Entitlement | Account, feature, active state, source purchase; updated atomically with purchase processing |
| Notification event | Store event ID and processing state; duplicate refund/renewal notifications have one durable effect |

For Android, `receiptToken` is the Play purchase token. Query the
[Google Play product-purchase API](https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.productsv2/getproductpurchasev2)
using the server's configured package name and authorized service credentials.
Use the returned purchase state and product lines to verify the claim. Choose a
unique purchase-token identity in your ledger; a client order ID alone is not
the server's idempotency rule.

On iOS 15+, the installed plugin returns StoreKit 2 transaction **JSON**, not a
signed JWS proof. Treat it as untrusted input. Query Apple's
[Get Transaction Info](https://developer.apple.com/documentation/appstoreserverapi/get-transaction-info)
with the transaction ID and verify Apple's signed response, including the
expected bundle/product/environment and revocation state. Apple's
[server library](https://github.com/apple/app-store-server-library-node) supplies
API and signed-data verification support. On older iOS, the plugin may supply a
base64 app receipt instead; implement and qualify that verification path before
supporting those OS versions. Never decode client JSON and call it verified.

Protect receipt values like credentials. Keep store API keys and service-account
secrets on the backend. Do not log receipts, purchase tokens or complete provider
responses. Process store notifications and reconciliation on the backend so
refunds or revoked access do not depend on the app remaining open.

## Buy, finish and recover

The app requests the store sheet; this request is not a grant. On Android its
promise can resolve as soon as the sheet opens. Purchase updates decide the
next action, and the maintained controller routes them through verification:

```ts
import type { createPurchaseSession } from './purchases'

export async function buyPremium(purchases: ReturnType<typeof createPurchaseSession>) {
  await purchases.buy()
  // Read purchases.state for the outcome; this return does not mean paid.
}
```

| Update or failure | App behavior |
| --- | --- |
| User cancels | Show cancellation and retain a retryable screen; grant nothing |
| Pending payment or Ask to Buy | Show pending/awaiting approval; grant nothing and leave it unfinished |
| Purchased | Verify and commit on the backend, refresh account access, then finish |
| Verification is rejected/unavailable | Show recovery and leave the transaction unfinished |
| Finish fails after the server commit | Keep the durable grant; retry completion through Restore purchases |
| Duplicate update | Reverify idempotently; avoid repeating completion in this owner |
| Account owner closes during verification | Ignore its late UI result; recover unfinished store transactions in the next owner |

Restoration queries store-owned purchases and runs the same verification path;
it does not grant from the store query alone. The example also reads server
entitlements, which can outlive an app reinstall:

```ts
import type { createPurchaseSession } from './purchases'

export async function restorePremium(purchases: ReturnType<typeof createPurchaseSession>) {
  await purchases.restore()
}
```

Keep the original purchase object while finishing it: the framework requires
its native transaction reference. Do not serialize that object to settings and
expect to finish it after restart. Query the store again and reconcile it with
the backend. This is the underlying completion call used by the example:

```ts
import { billing, type Purchase } from '@octane-xplat/billing'

export async function finishVerifiedNonConsumable(purchase: Purchase) {
  // Call only after verification and durable server grant, as above.
  await billing.finishTransaction(purchase, { consume: false })
}
```

For a consumable, grant the verified quantity exactly once in a server ledger,
then consume it with `finishTransaction(purchase, { consume: true })`. A consumed
purchase is not a durable Restore-purchases history; restore remaining credit
from the account's server ledger. The supplied example deliberately sells a
non-consumable and always uses `consume: false`. This alternative completion
call belongs in a separate, fully implemented consumable workflow:

```ts
import { billing, type Purchase } from '@octane-xplat/billing'

export async function finishVerifiedConsumable(purchase: Purchase) {
  // The backend has already verified and durably credited the quantity once.
  await billing.finishTransaction(purchase, { consume: true })
}
```

Subscriptions need server handling for renewal, expiry, grace periods and
revocation. Although products can be fetched with `fetchProducts(ids, 'subs')`,
the wrapper currently re-fetches every purchase request as `inapp`.
[Issue #69](https://github.com/octane-xplat/octane-xplat/issues/69) tracks this
subscription-initiation gap. Do not ship subscription checkout using this guide
or imply that listing a subscription proves it can be purchased. A catalog
read alone is only this operation:

```ts
import { billing } from '@octane-xplat/billing'

export async function readSubscriptionCatalog(productIds: string[]) {
  return billing.fetchProducts(productIds, 'subs')
}
```

Call that within an already-connected billing owner. It does not initiate or
verify a subscription.

## Check the complete sandbox journey

Run these checks on each configured store/device, using test payments:

1. Load the real product and compare its title/price with the store record.
2. Cancel a purchase; confirm no entitlement or completion was recorded.
3. Complete a purchase. Confirm server verification and a single durable grant
   happen before completion; the app then shows **Premium unlocked**.
4. Repeat delivery/Restore purchases. Confirm the backend ledger has one grant.
5. Simulate a pending payment and approve or decline it later. Confirm access
   appears only after store completion and server verification.
6. Make verification or completion fail. Restart, restore, and confirm recovery
   without losing or duplicating the grant. Restore after reinstall as well.
7. Sign out during verification. Confirm the old screen retires, then verify
   that another account cannot claim the same purchase.
8. Test refund/revocation handling on the backend and a fresh account-access read.

The maintained Node regressions cover ordering, duplicate delivery, pending and
cancelled states, backend rejection, finish retry, owner disposal and readiness
retry using controlled store/network doubles. They do not execute StoreKit,
Google Play, provider verification, store notifications or real payment sheets.
Record those store/device checks separately before release.
