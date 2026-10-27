export interface FirebaseAnalyticsService {
	readonly supported: boolean
	/** Web only: initialize the Firebase app (native config comes from the
	 *  app's google-services files). */
	init(config?: Record<string, unknown>): Promise<void>
	logEvent(name: string, params?: Record<string, string | number | boolean>): Promise<void>
	setUserId(id: string | null): Promise<void>
	setUserProperty(name: string, value: string | null): Promise<void>
	setUserProperties(props: Record<string, string | null>): Promise<void>
	setAnalyticsCollectionEnabled(enabled: boolean): Promise<void>
	logScreenView(screenName: string, screenClass?: string): Promise<void>
	setSessionTimeoutDuration(ms: number): Promise<void>
	logLogin(method: string): Promise<void>
	logSignUp(method: string): Promise<void>
	logAddToCart(params: Record<string, unknown>): Promise<void>
	logViewItem(params: Record<string, unknown>): Promise<void>
	logPurchase(params: Record<string, unknown>): Promise<void>
}

export declare const firebaseAnalytics: FirebaseAnalyticsService
