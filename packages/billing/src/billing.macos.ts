// Billing — macOS leaf. StoreKit is bridgeable through the AppKit host but
// not wired; report unsupported.
import type { Billing } from './types'

const unsupported = () => Promise.reject(new Error('unsupported: billing is not wired on macOS'))

/** Store billing service — Play Billing / StoreKit. */
export const billing: Billing = {
	supported: false,
	connect: () => Promise.resolve(),
	disconnect: () => {},
	canMakePayments: () => false,
	fetchProducts: unsupported,
	requestPurchase: unsupported,
	onPurchase: () => () => {},
	onPurchaseError: () => () => {},
	getAvailablePurchases: unsupported,
	finishTransaction: unsupported,
	showManageSubscriptions: unsupported,
}
