import { useMemo } from 'octane'
import {
	initPaymentSheet,
	presentPaymentSheet,
	resetPaymentSheet,
	handleURLCallback,
} from './service'
/** Stable app-scoped Stripe operations. The component does not own or reconfigure the global SDK. */
export function useStripe() {
	return useMemo(
		() => ({ initPaymentSheet, presentPaymentSheet, resetPaymentSheet, handleURLCallback }),
		[],
	)
}
