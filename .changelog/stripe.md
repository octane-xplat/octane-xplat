### Add guest checkout with Stripe

The new stripe package provides Expo-shaped PaymentSheet operations using the
official native SDKs and a Stripe-hosted web payment form. Your server owns
PaymentIntent creation and payment verification. Test-mode success and wallets
still require qualification; Android runtime remains unverified.

```ts
import { initPaymentSheet, presentPaymentSheet } from '@octane-xplat/stripe'

// After initStripe, using a client secret created by your app's backend:
export async function pay(paymentIntentClientSecret: string, returnURL: string) {
	const initialized = await initPaymentSheet({
		merchantDisplayName: 'Example store',
		paymentIntentClientSecret,
		returnURL,
	})
	return initialized.error ? initialized : presentPaymentSheet()
}
```

[Stripe setup, server ownership and platform limits](https://github.com/octane-xplat/octane-xplat/blob/main/packages/stripe/README.md)
