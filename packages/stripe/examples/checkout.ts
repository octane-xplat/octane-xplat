import { initPaymentSheet, presentPaymentSheet, resetPaymentSheet } from '@octane-xplat/stripe'
import type { PresentPaymentSheetResult } from '@octane-xplat/stripe'

/** Call after initStripe. Supply an Intent created by the authenticated app backend. */
export async function checkoutPaymentIntent(
	paymentIntentClientSecret: string,
	returnURL: string,
): Promise<PresentPaymentSheetResult> {
	const initialized = await initPaymentSheet({
		merchantDisplayName: 'Example store',
		paymentIntentClientSecret,
		returnURL,
	})
	if (initialized.error) {
		return initialized
	}
	try {
		return await presentPaymentSheet()
	} finally {
		await resetPaymentSheet()
	}
}
