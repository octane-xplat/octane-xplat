import { backend } from './backend'
import { createStripeClient } from './client'
const client = createStripeClient(backend)
/** Initialize the app's Stripe SDK with a publishable key before checkout. Reconfiguration requires idle checkout. */
export const initStripe = client.initStripe
/** Prepare guest PaymentIntent checkout. Native wallet options require platform merchant setup.
 * @example
 * ```ts
 * import { initPaymentSheet } from '@octane-xplat/stripe'
 * export function prepare(clientSecret: string, returnURL: string) {
 *   return initPaymentSheet({ merchantDisplayName: 'Store', paymentIntentClientSecret: clientSecret, returnURL })
 * }
 * ```
 */
export const initPaymentSheet = client.initPaymentSheet
/** Present SDK-owned secure input. A successful client flow still requires backend payment verification. */
export const presentPaymentSheet = client.presentPaymentSheet
/** Release an idle prepared sheet and its client secret. Active checkout must finish or be canceled by the user. */
export const resetPaymentSheet = client.resetPaymentSheet
/** Forward app-scheme callbacks to the iOS SDK; false means this module did not handle the URL. */
export const handleURLCallback = client.handleURLCallback
/** Availability is independent from SDK initialization, merchant setup and payment authorization. */
export const Stripe = {
	get supported() {
		return client.supported
	},
	initStripe,
	initPaymentSheet,
	presentPaymentSheet,
	resetPaymentSheet,
	handleURLCallback,
}
