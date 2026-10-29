import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { StripeBackend } from './backend-types'
const unavailable = async (): Promise<never> => {
	throw new UnavailabilityError('Stripe PaymentSheet on this host')
}
export const backend: StripeBackend = {
	available: () => false,
	initialize: unavailable,
	prepare: unavailable,
	present: unavailable,
	reset: async () => {},
	handleURL: async () => false,
}
