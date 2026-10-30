import { useMemo } from 'octane'
import {
	initPaymentSheet,
	presentPaymentSheet,
	resetPaymentSheet,
	handleURLCallback,
} from './service'

import type {
	PaymentSheetSetupParams,
	InitPaymentSheetResult,
	PresentPaymentSheetResult,
} from './types'

/** Stable app-scoped Stripe operations. The component does not own or reconfigure the global SDK. */
export function useStripe(): {
	initPaymentSheet: (options: PaymentSheetSetupParams) => Promise<InitPaymentSheetResult>
	presentPaymentSheet: () => Promise<PresentPaymentSheetResult>
	resetPaymentSheet: () => Promise<InitPaymentSheetResult>
	handleURLCallback: (url: string) => Promise<boolean>
} {
	return useMemo(
		() => ({ initPaymentSheet, presentPaymentSheet, resetPaymentSheet, handleURLCallback }),
		[],
	)
}
