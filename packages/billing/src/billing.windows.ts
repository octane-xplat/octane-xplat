// Windows leaf — no store backend; report unsupported.
import type { Billing } from './types'

const unsupported = () =>
	Promise.reject(new Error('unsupported: billing is not available on windows'))

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
