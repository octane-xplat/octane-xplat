/** Firebase Analytics façade over the native SDKs and the web SDK.
 *  Event names follow the GA4/Firebase prescribed-event spellings. */
export interface FirebaseAnalyticsService {
	/** Synchronous fast check — a Firebase analytics backend exists. */
	readonly supported: boolean
	/** Web only: initialize the Firebase app (native config comes from the
	 *  app's google-services files). */
	init(config?: Record<string, unknown>): Promise<void>
	/** Log a custom or prescribed event; params must be primitives
	 *  (string/number/boolean) per the GA4 contract. */
	logEvent(name: string, params?: Record<string, string | number | boolean>): Promise<void>
	/** Attach a stable user id to subsequent events; null clears it. */
	setUserId(id: string | null): Promise<void>
	/** Set one user property; null value clears it. */
	setUserProperty(name: string, value: string | null): Promise<void>
	/** Set several user properties in one call; null values clear. */
	setUserProperties(props: Record<string, string | null>): Promise<void>
	/** Master switch for analytics collection — persists across launches. */
	setAnalyticsCollectionEnabled(enabled: boolean): Promise<void>
	/** Log a screen_view event; screenClass defaults to screenName. */
	logScreenView(screenName: string, screenClass?: string): Promise<void>
	/** Engagement session timeout in milliseconds. No-op on web; unsupported
	 *  on desktop leaves. */
	setSessionTimeoutDuration(ms: number): Promise<void>
	/** Prescribed `login` event; `method` is e.g. 'password', 'google'. */
	logLogin(method: string): Promise<void>
	/** Prescribed `sign_up` event; `method` matches logLogin. */
	logSignUp(method: string): Promise<void>
	/** Prescribed `add_to_cart` ecommerce event — pass GA4 item params. */
	logAddToCart(params: Record<string, unknown>): Promise<void>
	/** Prescribed `view_item` ecommerce event — pass GA4 item params. */
	logViewItem(params: Record<string, unknown>): Promise<void>
	/** Prescribed `purchase` ecommerce event — pass GA4 item params. */
	logPurchase(params: Record<string, unknown>): Promise<void>
}

export declare const firebaseAnalytics: FirebaseAnalyticsService
