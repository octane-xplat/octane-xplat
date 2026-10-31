/** Store product kind: one-time 'inapp' or 'subs' subscription; 'unknown'
 *  when the store reports something else. */
export type ProductType = 'inapp' | 'subs' | 'unknown'

/** A store product as fetched from the app store. Prices are null until
 *  the store reports them (and priceMicros stays null on iOS). */
export interface Product {
	/** Store product identifier as registered in the console. */
	id: string
	/** Store-localized title. */
	title: string
	/** Store-localized description. */
	description: string
	/** 'inapp' or 'subs' as queried. */
	type: ProductType
	/** Localized price string ('$4.99') — null until the store reports it. */
	displayPrice: string | null
	/** Price in micros (1_000_000 = 1 unit) — null on iOS, which reports
	 *  formatted price only at this API level. */
	priceMicros: number | null
	/** Underlying plugin product — pass the fetched Product back to
	 *  requestPurchase so subscription offer details reach checkout. */
	native?: unknown
}

/** Transaction lifecycle: 'pending' awaits external payment action
 *  (ask-to-buy, deferred); 'unknown' covers unmapped store states. */
export type PurchaseState = 'pending' | 'purchased' | 'unknown'

/** One store transaction returned by purchase updates or restore queries. */
export interface Purchase {
	/** The Product.id this transaction is for. */
	productId: string
	/** Play order id / StoreKit transaction id. */
	transactionId: string
	/** When the store recorded the transaction; null when unreported. */
	transactionDate: Date | null
	/** Normalized transaction state. */
	state: PurchaseState
	/** 'inapp' or 'subs'. */
	type: ProductType
	/** Play: acknowledged; StoreKit: finished. Unacknowledged consumables
	 *  are re-delivered by the store until finishTransaction completes them. */
	isAcknowledged: boolean
	/** Receipt token for server-side verification (Play purchase token /
	 *  StoreKit receipt data). */
	receiptToken: string
	/** Underlying plugin transaction — pass to finishTransaction internals
	 *  when holding the raw reference is required. */
	native?: unknown
}

/** Options for requestPurchase(); platform bags pass through to the store. */
export interface PurchaseOptions {
	/** Android obfuscated account/profile ids. */
	accountId?: string
	/** Play Billing overrides — obfuscated ids plus the EU personalized-price flag. */
	android?: { accountId?: string; profileId?: string; isOfferPersonalized?: boolean }
	/** StoreKit overrides — quantity and sandbox ask-to-buy simulation. */
	ios?: { quantity?: number; simulatesAskToBuyInSandbox?: boolean }
}

/** requestPurchase() options: store options plus the product kind used to
 *  fetch an id before checkout. */
export interface RequestPurchaseOptions extends PurchaseOptions {
	/** Product kind fetched when `requestPurchase` receives an id rather than
	 *  a fetched Product; defaults to 'inapp'. Use 'subs' for subscriptions. */
	type?: 'inapp' | 'subs'
}

/** A store-reported failure. */
export interface PurchaseError {
	/** Normalized store error code (Play Billing response / StoreKit error
	 *  mapped to shared spellings where possible). */
	code: string
	/** Human-readable store message. */
	message: string
}

/** Store billing façade — Play Billing on Android, StoreKit on iOS.
 *  False `supported` on web/desktop leaves. */
export interface Billing {
	/** StoreKit/Play Billing client exists (false on web/desktop leaves). */
	readonly supported: boolean
	/** Connect the store client — call once at app start, before other calls.
	 *  Resolves once the store reports ready; check canMakePayments() after it
	 *  resolves. A call after disconnect() awaits the next readiness signal. */
	connect(): Promise<void>
	/** Release the store client connection. */
	disconnect(): void
	/** The device can make payments (parental controls off, store reachable). */
	canMakePayments(): boolean
	/** Fetch store metadata for console-registered product ids. */
	fetchProducts(productIds: string[], type?: 'inapp' | 'subs'): Promise<Product[]>
	/** Kick the OS purchase sheet. Pass the Product returned by fetchProducts —
	 *  required for subscriptions, whose 'subs' fetch carries the store's offer
	 *  details — or a product id, fetched internally as options.type
	 *  (default 'inapp'). Outcomes arrive on onPurchase/onPurchaseError and
	 *  must be completed with finishTransaction. */
	requestPurchase(product: Product | string, options?: RequestPurchaseOptions): Promise<void>
	/** Purchase-update listener; returns the unsubscribe function. */
	onPurchase(listener: (purchases: Purchase[]) => void): () => void
	/** Purchase-failure listener; returns the unsubscribe function. */
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
