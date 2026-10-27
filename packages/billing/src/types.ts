export type ProductType = 'inapp' | 'subs' | 'unknown'

export interface Product {
	id: string
	/** Store-localized title. */
	title: string
	description: string
	type: ProductType
	/** Localized price string ('$4.99') — null until the store reports it. */
	displayPrice: string | null
	/** Price in micros (1_000_000 = 1 unit) — null on iOS, which reports
	 *  formatted price only at this API level. */
	priceMicros: number | null
}

export type PurchaseState = 'pending' | 'purchased' | 'unknown'

export interface Purchase {
	productId: string
	/** Play order id / StoreKit transaction id. */
	transactionId: string
	transactionDate: Date | null
	state: PurchaseState
	type: ProductType
	isAcknowledged: boolean
	/** Receipt token for server-side verification (Play purchase token /
	 *  StoreKit receipt data). */
	receiptToken: string
	/** Underlying plugin transaction — pass to finishTransaction internals
	 *  when holding the raw reference is required. */
	native?: unknown
}

export interface PurchaseOptions {
	/** Android obfuscated account/profile ids. */
	accountId?: string
	android?: { accountId?: string; profileId?: string; isOfferPersonalized?: boolean }
	ios?: { quantity?: number; simulatesAskToBuyInSandbox?: boolean }
}

export interface PurchaseError {
	code: string
	message: string
}

export interface Billing {
	/** StoreKit/Play Billing client exists (false on web/desktop leaves). */
	readonly supported: boolean
	/** Connect the store client — call once at app start, before other calls. */
	connect(): void
	disconnect(): void
	/** The device can make payments (parental controls off, store reachable). */
	canMakePayments(): boolean
	fetchProducts(productIds: string[], type?: 'inapp' | 'subs'): Promise<Product[]>
	/** Kick the OS purchase sheet for `productId` — the product is fetched
	 *  internally first. Outcomes arrive on onPurchase/onPurchaseError and
	 *  must be completed with finishTransaction. */
	requestPurchase(productId: string, options?: PurchaseOptions): Promise<void>
	/** Purchase-update listener; returns the unsubscribe function. */
	onPurchase(listener: (purchases: Purchase[]) => void): () => void
	onPurchaseError(listener: (error: PurchaseError) => void): () => void
	/** Owned/unconsumed purchases — the "restore" query on both stores. */
	getAvailablePurchases(): Promise<Purchase[]>
	/** Consume/acknowledge a completed purchase (Play: consume or
	 *  acknowledge; StoreKit: finish). Options.consume = consumable flow. */
	finishTransaction(purchase: Purchase, options?: { consume?: boolean }): Promise<void>
	/** Native subscription management UI. */
	showManageSubscriptions(options?: { subscriptionGroupId?: string }): Promise<void>
}

export declare const billing: Billing
