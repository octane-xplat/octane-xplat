// Billing — web leaf. No web store backend exists yet (a delegated-checkout
// seam like RevenueCat Web Billing is a possible future). supported: false;
// calls throw rather than silently doing nothing.
import type { Billing } from './types'

const unsupported = () => Promise.reject(new Error('unsupported: no store backend on web'))

export const billing: Billing = {
	supported: false,
	connect: () => {},
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
