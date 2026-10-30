// Firebase Analytics — no macOS JS SDK upstream; unsupported leaf.
import type { FirebaseAnalyticsService } from './types'

const unsupported = () =>
	Promise.reject(new Error('unsupported: firebase analytics is not available on macOS'))

/** Firebase Analytics service — see FirebaseAnalyticsService. */
export const firebaseAnalytics: FirebaseAnalyticsService = {
	supported: false,
	init: unsupported,
	logEvent: unsupported,
	setUserId: unsupported,
	setUserProperty: unsupported,
	setUserProperties: unsupported,
	setAnalyticsCollectionEnabled: unsupported,
	logScreenView: unsupported,
	setSessionTimeoutDuration: unsupported,
	logLogin: unsupported,
	logSignUp: unsupported,
	logAddToCart: unsupported,
	logViewItem: unsupported,
	logPurchase: unsupported,
}
