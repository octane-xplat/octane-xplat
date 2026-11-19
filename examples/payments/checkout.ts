import { initPaymentSheet, presentPaymentSheet, resetPaymentSheet } from '@octane-xplat/stripe'
import type { PresentPaymentSheetResult } from '@octane-xplat/stripe'

/** Call after initStripe. Supply an Intent created by the authenticated app backend. */
export async function checkoutPaymentIntent(
  paymentIntentClientSecret: string,
  returnURL: string,
): Promise<PresentPaymentSheetResult> {
  // 1. Initialize the sheet with a payment intent from your backend.
  const initialized = await initPaymentSheet({
    merchantDisplayName: 'Example store',
    paymentIntentClientSecret,
    returnURL,
  })

  // 2. Stop if the sheet could not initialize.
  if (initialized.error) {
    return initialized
  }

  // 3. Show checkout and release the sheet when it finishes.
  try {
    return await presentPaymentSheet()
  } finally {
    await resetPaymentSheet()
  }
}
