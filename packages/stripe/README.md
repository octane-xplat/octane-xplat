# Collect a payment with Stripe

Use `@octane-xplat/stripe` for guest PaymentIntent checkout with Stripe's secure
payment form. It follows the `initStripe`, `initPaymentSheet`,
`presentPaymentSheet` and `useStripe` shapes familiar from Expo's Stripe library.
iOS and Android use the official PaymentSheet; web uses Stripe.js Payment Element
inside an app-owned dialog. Card details stay inside Stripe's UI.

```sh
pnpm add @octane-xplat/stripe
```

Start with a running Xplat app and an authenticated server that creates
PaymentIntents. Your server chooses the order, amount, currency and allowed
payment methods. Keep Stripe secret keys there. Return a publishable key and a
PaymentIntent client secret only to the customer who owns that order. Use test
mode until your integration has been qualified. Follow Stripe's
[server setup](https://docs.stripe.com/payments/mobile/accept-payment?platform=react-native)
for that part; installing this package does not create a backend.

## Open checkout

Initialize the SDK once at app startup. Use your Stripe publishable key in place
of the placeholder. Register the native URL scheme before using it; a browser
checkout uses an HTTPS return route on your own site instead.

```ts
import { initStripe, Stripe } from '@octane-xplat/stripe'

export async function configurePayments(publishableKey: string) {
	if (!Stripe.supported) return false
	await initStripe({ publishableKey, urlScheme: 'myapp' })
	return true
}
```

Put the checkout action in a `.tsx` component inside your renderer include glob.
This example receives your backend functions as props: `getCheckout` returns an
existing or newly created Intent for this order, and `verifyOrder` reads its
status from your authenticated server. Neither function is provided by the
package. Keep order fulfilment on the server, based on Stripe webhooks.

```tsx
import { useState } from 'octane'
import { Button, Text, VStack } from '@octane-xplat/ui'
import { Stripe, useStripe } from '@octane-xplat/stripe'

type CheckoutProps = {
	returnURL: string
	getCheckout: () => Promise<{ paymentIntentClientSecret: string }>
	verifyOrder: () => Promise<'paid' | 'pending' | 'failed'>
}

export function Checkout({ returnURL, getCheckout, verifyOrder }: CheckoutProps) {
	const { initPaymentSheet, presentPaymentSheet, resetPaymentSheet } = useStripe()
	const [busy, setBusy] = useState(false)
	const [message, setMessage] = useState('Ready for checkout')
	async function pay() {
		if (busy || !Stripe.supported) return
		setBusy(true)
		try {
			const session = await getCheckout()
			const initialized = await initPaymentSheet({
				merchantDisplayName: 'Example store',
				paymentIntentClientSecret: session.paymentIntentClientSecret,
				returnURL,
			})
			if (initialized.error) {
				setMessage(initialized.error.message)
				return
			}
			const result = await presentPaymentSheet()
			if (result.error?.code === 'Canceled') {
				setMessage('Checkout canceled')
				return
			}
			if (result.error) {
				setMessage(result.error.message)
				return
			}
			const status = await verifyOrder()
			setMessage(
				status === 'paid' ? 'Payment confirmed' : 'Check the order status before trying again',
			)
		} catch {
			setMessage('Could not open checkout. Check the order status before retrying.')
		} finally {
			await resetPaymentSheet()
			setBusy(false)
		}
	}
	return (
		<VStack>
			<Button
				label={busy ? 'Checkout open…' : 'Pay'}
				disabled={busy || !Stripe.supported}
				clickAction={() => {
					void pay()
				}}
			/>
			<Text>{Stripe.supported ? message : 'Checkout is unavailable on this host'}</Text>
		</VStack>
	)
}
```

A successful result means the client flow finished, which can include a payment
awaiting capture or processing. It does not prove that funds settled. Cancellation
returns `error.code: 'Canceled'`; SDK failures return `Failed`. Keep the same
server order and verify its status before creating another Intent after a
network error. The maintained [checkout action](examples/checkout.ts) shows the
same resource cleanup without UI.

```ts
import { presentPaymentSheet } from '@octane-xplat/stripe'

// After a successful initPaymentSheet:
export async function presentPreparedCheckout() {
	const result = await presentPaymentSheet()
	if (result.error?.code === 'Canceled') return 'canceled'
	return result.error ? 'failed' : 'verify-on-server'
}
```

## Configure native builds and return URLs

Installing a native SDK requires your app's normal native rebuild. A JavaScript
refresh cannot add it. This package ships an iOS Swift bridge and declares
Stripe 26.15.1 through plugin-level NativeScript Swift Package Manager settings.
The iOS deployment target must be 15.0 or newer. Set this in your app's
`App_Resources/iOS/build.xcconfig` if it currently targets an older OS.

```xcconfig
IPHONEOS_DEPLOYMENT_TARGET = 15.0
```

Register your app's scheme in `App_Resources/iOS/Info.plist`. Use a scheme owned
by your app in place of `myapp` and merge this entry with existing URL types.
Forward incoming URLs from the app's existing linking listener; do not forward
every link directly into your router without giving Stripe a chance to handle it.

```xml
<key>CFBundleURLTypes</key>
<array><dict>
 <key>CFBundleURLSchemes</key><array><string>myapp</string></array>
</dict></array>
```

```ts
import { handleURLCallback } from '@octane-xplat/stripe'

export async function dispatchIncomingURL(url: string, routeURL: (url: string) => void) {
	if (!(await handleURLCallback(url))) routeURL(url)
}
```

Android includes Stripe 23.25.1 and a private checkout Activity that registers
Stripe's result handler before the Activity starts. Use Android API 23+ and a
current compile SDK (36 in the matching Stripe React Native configuration).
The SDK owns Android authentication callbacks; `handleURLCallback` returns false
there. The request is held only in process memory. If Android kills the process,
reopen the order and read its status from the server before another checkout.

```ts
import { initPaymentSheet } from '@octane-xplat/stripe'

export function prepareNativeCheckout(paymentIntentClientSecret: string) {
	return initPaymentSheet({
		merchantDisplayName: 'Example store',
		paymentIntentClientSecret,
		returnURL: 'myapp://stripe-redirect',
	})
}
```

## Use native wallets

For Apple Pay, configure a merchant ID and payment-processing certificate in
Apple's and Stripe's dashboards, then add that merchant ID to the app's Apple
Pay entitlement. Pass the same merchant ID to SDK initialization. Stripe handles
the wallet UI; entitlement and payment-method eligibility remain app setup.

```xml
<key>com.apple.developer.in-app-payments</key>
<array><string>merchant.com.example.store</string></array>
```

```ts
import { initStripe, initPaymentSheet } from '@octane-xplat/stripe'

export async function prepareApplePay(publishableKey: string, paymentIntentClientSecret: string) {
	await initStripe({
		publishableKey,
		merchantIdentifier: 'merchant.com.example.store',
		urlScheme: 'myapp',
	})
	return initPaymentSheet({
		merchantDisplayName: 'Example store',
		paymentIntentClientSecret,
		returnURL: 'myapp://stripe-redirect',
		applePay: { merchantCountryCode: 'US' },
	})
}
```

For Google Pay, enable it in your Stripe account and complete Google's production
approval before using its production environment. The package's Android manifest
enables the wallet API. Use `testEnv: true` for a Google Pay test integration;
it defaults to false. Supply the country and, when required, currency matching
your merchant/Intent configuration. Wallet options apply only to their native
platform and are ignored on the other hosts, following the SDK convention.

```ts
import { initPaymentSheet } from '@octane-xplat/stripe'

export function prepareGooglePay(paymentIntentClientSecret: string) {
	return initPaymentSheet({
		merchantDisplayName: 'Example store',
		paymentIntentClientSecret,
		returnURL: 'myapp://stripe-redirect',
		googlePay: { merchantCountryCode: 'US', currencyCode: 'USD', testEnv: true },
	})
}
```

## Web setup and lifecycle

Web checkout requires a secure browser with native dialog support, an HTTPS
return URL (HTTP is allowed only for loopback development), and a server-created Intent restricted to `payment_method_types:
['card']`. The adapter rejects other payment-method sets. Apple Pay and Google
Pay are disabled in this web form; the native wallet options do not enable web
wallets. Follow Stripe's [CSP requirements](https://docs.stripe.com/security/guide#content-security-policy)
and allow Stripe.js and its secure frames to load.

```ts
import { initPaymentSheet } from '@octane-xplat/stripe'

export function prepareWebCheckout(paymentIntentClientSecret: string) {
	return initPaymentSheet({
		merchantDisplayName: 'Example store',
		paymentIntentClientSecret,
		returnURL: 'https://store.example.com/checkout-return',
	})
}
```

Stripe.js loads when you call `initStripe`, not when an unavailable host imports
the package. A browser decline stays in the dialog for retry; closing the form
releases its Elements instance and returns cancellation. The cancel action is
disabled during confirmation because a pending payment cannot safely be treated
as canceled. A redirect can leave the page, so the return route must restore the
order and verify it with the server. `handleURLCallback` returns false on web.

```ts
import { resetPaymentSheet } from '@octane-xplat/stripe'

// After checkout finishes, or when abandoning an idle prepared checkout:
export async function leaveIdleCheckout() {
	const result = await resetPaymentSheet()
	if (result.error) throw new Error(result.error.message)
}
```

The SDK configuration and checkout are app-scoped. `useStripe` returns stable
operations; mounting or unmounting a component does not reconfigure or dismiss
another owner's checkout. Keep the action owner alive until presentation ends.
One initialization/preparation/presentation runs at a time; overlapping calls
fail. Cancellation and failures permit retry of the prepared Intent. Completion
and reset clear it. Replacing a sheet, including an invalid replacement, prevents
presentation of the earlier order. Do not store or log client secrets.

```ts
import { initStripe, resetPaymentSheet } from '@octane-xplat/stripe'

export async function switchIdleMerchant(publishableKey: string) {
	const released = await resetPaymentSheet()
	if (released.error) throw new Error(released.error.message)
	await initStripe({ publishableKey })
}
```

## Supported subset and verification

The public contract covers guest PaymentIntents, a merchant display name, return
URLs, a primary button label, and native wallet configuration. Customer sessions,
SetupIntents, customFlow, manual card APIs, standalone confirmations and custom
appearance are not exported. Unknown options reject instead of being silently
accepted. No provider component is needed; initialize once and use the hook or
functions. `Stripe.supported` reports an adapter, not a ready merchant account.

```ts
import { Stripe } from '@octane-xplat/stripe'

export function canOfferCheckout() {
	return Stripe.supported
}
```

Source typechecks, ten coordinator/dialog tests with a mocked Stripe boundary,
packed consumer checks and Swift bridge API checks pass. The iOS26.2 smoke on
skymac.local passed ten assertions for initialization, concurrency,
invalid-credential SDK failure and presenter cleanup using the official binary
SDK. A separate packed consumer now validates the public SPM products and builds
the SDK26.15.1 source and packaged Swift bridge into an unsigned simulator app.
Twelve installed-consumer assertions also pass for initialization, concurrency,
actual SDK loading-controller presentation, invalid-credential failure,
return-URL rejection and presenter cleanup. That
run reuses the executable with refreshed JavaScript; it does not prove a payment.

A successful test payment, loaded-sheet cancellation/retry, redirects, wallets
and signed installed consumers remain unverified. Android runtime is explicitly
unverified. Native AppKit, GTK and Windows exports report unavailable: Stripe's
PaymentSheet uses UIKit or Android UI, and a native desktop payment backend is
not wired. A web app can use the web adapter in a supported browser.

See [implementation evidence](../../.agents/docs/notes/stripe.md) for the remaining
qualification work and [Expo's Stripe integration](https://docs.expo.dev/versions/latest/sdk/stripe/)
for the upstream API family.
