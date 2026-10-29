# Collect a guest payment with Stripe

ID: stripe-checkout
Targets: web, ios, android, macos
Related APIs: @octane-xplat/stripe, initStripe, initPaymentSheet, presentPaymentSheet, resetPaymentSheet, handleURLCallback, useStripe

## Starting point

An existing Xplat app and authenticated server owning orders, Stripe PaymentIntents
and webhook fulfilment. Use a test-mode backend before release qualification.

## Requirements

- Install and configure the official SDKs with publishable credentials only.
- Present secure guest checkout and distinguish cancellation, failures and completion.
- Recover through backend order state rather than interpreting a client callback as settlement.
- Own one checkout, return-URL handling and idle cleanup across screen/account changes.

## Acceptance criteria

- AC1: A reader can install the package, configure a supported native build/browser, initialize with a publishable key, and identify unavailable hosts and the supported API subset.
- AC2: A reader can obtain an authorized PaymentIntent from the app backend, present secure checkout, distinguish cancellation/failure/client completion, and verify the order on the server before fulfilment or retry.
- AC3: A reader can register a native return scheme, route iOS Stripe callbacks before app navigation, and recover a web redirect or Android process restart through server order state.
- AC4: A reader can configure Apple Pay and Google Pay on their respective native platforms, distinguish merchant prerequisites/test environments from package installation, and identify unverified wallet behavior and web wallet limits.
- AC5: A reader can preserve app-scoped configuration, avoid overlapping presentations or stale-order reuse, keep the action owner alive, retry safely and release idle checkout state before changing accounts.

## Documentation

- AC1: [First setup](../../../packages/stripe/README.md), [native configuration](../../../packages/stripe/README.md#configure-native-builds-and-return-urls) and [supported subset](../../../packages/stripe/README.md#supported-subset-and-verification).
- AC2: [Open checkout](../../../packages/stripe/README.md#open-checkout) and [maintained action](../../../packages/stripe/examples/checkout.ts).
- AC3: [Native and URL setup](../../../packages/stripe/README.md#configure-native-builds-and-return-urls) and [web lifecycle](../../../packages/stripe/README.md#web-setup-and-lifecycle).
- AC4: [Native wallets](../../../packages/stripe/README.md#use-native-wallets) and [qualification record](../notes/stripe.md).
- AC5: [App-scoped lifecycle](../../../packages/stripe/README.md#web-setup-and-lifecycle) and [verification limits](../../../packages/stripe/README.md#supported-subset-and-verification).
