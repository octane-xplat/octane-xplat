// Billing — native leaf over @nativescript/payments (StoreKit 2 + Play
// Billing). One Payment client behind the flat service; purchase outcomes
// fan out to registered listeners.
import { Payment, type Product as NativeProduct, type Transaction } from '@nativescript/payments'
import type { Billing, Product, Purchase, RequestPurchaseOptions } from './types'

let client: Payment | null = null
let ready = false
const readyWaiters = new Set<() => void>()
const purchaseListeners = new Set<(purchases: Purchase[]) => void>()
const errorListeners = new Set<(error: { code: string; message: string }) => void>()

function asProduct(p: NativeProduct): Product {
	return {
		id: p.id,
		title: p.localizedTitle ?? p.title ?? p.name,
		description: p.description,
		type: p.type,
		displayPrice: p.priceFormatted,
		priceMicros: p.priceAmountMicros,
		native: p,
	}
}

function asPurchase(t: Transaction): Purchase {
	return {
		productId: t.productId,
		transactionId: t.orderId,
		transactionDate: t.orderDate ?? null,
		state: t.state,
		type: t.type,
		isAcknowledged: t.isAcknowledged,
		receiptToken: t.receiptToken,
		native: t,
	}
}

function getClient(): Payment {
	if (!client) {
		client = new Payment()
		client.onReady = () => {
			ready = true
			for (const resolve of readyWaiters) {
				resolve()
			}
			readyWaiters.clear()
		}
		client.onPurchaseUpdate = (purchases, error) => {
			if (error) {
				const out = {
					code: (error as any)?.code ?? 'ERROR',
					message: error.message ?? String(error),
				}

				for (const listener of errorListeners) {
					listener(out)
				}

				return
			}
			const mapped = (purchases ?? []).map(asPurchase)
			for (const listener of purchaseListeners) {
				listener(mapped)
			}
		}
	}
	return client
}

/** Store billing service — Play Billing / StoreKit. */
export const billing: Billing = {
	supported: Payment.isSupported(),

	connect(): Promise<void> {
		const c = getClient()
		if (ready) {
			return Promise.resolve()
		}
		const pending = new Promise<void>((resolve) => readyWaiters.add(resolve))
		c.connect()
		return pending
	},

	disconnect(): void {
		ready = false
		client?.disconnect()
		// @nativescript/payments 4.0.1 never re-fires onReady on a manually
		// disconnected Payment (its internal flag stays set), so reconnecting
		// needs a fresh client — a new Payment's init reconnects and re-arms
		// the callback.
		client = null
	},

	canMakePayments(): boolean {
		return getClient().canMakePayments()
	},

	async fetchProducts(productIds: string[], type: 'inapp' | 'subs' = 'inapp'): Promise<Product[]> {
		const products = await getClient().fetchProducts(productIds, type)
		return (products ?? []).map(asProduct)
	},

	async requestPurchase(
		product: Product | string,
		options?: RequestPurchaseOptions,
	): Promise<void> {
		const c = getClient()
		const { type, ...purchaseOptions } = options ?? {}
		let native: NativeProduct | undefined
		if (typeof product === 'string') {
			const [fetched] = await c.fetchProducts([product], type ?? 'inapp')
			if (!fetched) {
				throw Object.assign(new Error(`billing.requestPurchase: product '${product}' not found`), {
					code: 'PRODUCT_UNAVAILABLE',
				})
			}
			native = fetched
		} else {
			native = product.native as NativeProduct | undefined
			if (!native) {
				throw new Error('billing.requestPurchase: product lacks its native store reference')
			}
		}
		await c.purchaseProduct(native, purchaseOptions)
	},

	onPurchase(listener: (purchases: Purchase[]) => void): () => void {
		purchaseListeners.add(listener)
		return () => purchaseListeners.delete(listener)
	},

	onPurchaseError(listener): () => void {
		errorListeners.add(listener)
		return () => errorListeners.delete(listener)
	},

	async getAvailablePurchases(): Promise<Purchase[]> {
		const transactions = await getClient().fetchPurchases()
		return (transactions ?? []).map(asPurchase)
	},

	async finishTransaction(purchase: Purchase, options?: { consume?: boolean }): Promise<void> {
		const native = purchase.native as Transaction | undefined
		if (!native) {
			throw new Error('billing.finishTransaction: purchase lacks its native transaction')
		}
		await native.finish(options)
	},

	async showManageSubscriptions(options?: { subscriptionGroupId?: string }): Promise<void> {
		await getClient().showSubscriptionsManagement({
			ios: { subscriptionGroupID: options?.subscriptionGroupId },
		})
	},
}
