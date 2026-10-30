// Billing — native leaf over @nativescript/payments (StoreKit 2 + Play
// Billing). One Payment client behind the flat service; purchase outcomes
// fan out to registered listeners.
import { Payment, type Product as NativeProduct, type Transaction } from '@nativescript/payments'
import type { Billing, Product, Purchase, PurchaseOptions } from './types'

let client: Payment | null = null
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

	connect(): void {
		getClient().connect()
	},

	disconnect(): void {
		client?.disconnect()
	},

	canMakePayments(): boolean {
		return getClient().canMakePayments()
	},

	async fetchProducts(productIds: string[], type: 'inapp' | 'subs' = 'inapp'): Promise<Product[]> {
		const products = await getClient().fetchProducts(productIds, type)
		return (products ?? []).map(asProduct)
	},

	async requestPurchase(productId: string, options?: PurchaseOptions): Promise<void> {
		const c = getClient()
		const [product] = await c.fetchProducts([productId], 'inapp')
		if (!product) {
			throw Object.assign(new Error(`billing.requestPurchase: product '${productId}' not found`), {
				code: 'PRODUCT_UNAVAILABLE',
			})
		}
		await c.purchaseProduct(product, options as any)
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
