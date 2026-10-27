// Firebase Analytics — web leaf over the Firebase JS SDK. The app's Firebase
// config is injected via init() since web has no google-services metadata.
import { initializeApp, getApps } from 'firebase/app'
import {
	getAnalytics,
	isSupported as fbIsSupported,
	logEvent,
	setUserId,
	setUserProperties,
	setAnalyticsCollectionEnabled,
	setCurrentScreen,
} from 'firebase/analytics'
import type { FirebaseAnalyticsService } from './types'

let analytics: any = null

export const firebaseAnalytics: FirebaseAnalyticsService = {
	supported: typeof window !== 'undefined',

	async init(config?: Record<string, unknown>): Promise<void> {
		if (!(await fbIsSupported())) {
			return
		}
		const app = getApps().length ? getApps()[0] : initializeApp(config as any)
		analytics = getAnalytics(app)
	},

	logEvent: async (name, params) => logEvent(analytics, name as any, params),
	setUserId: async (id) => setUserId(analytics, id),
	setUserProperty: async (name, value) => setUserProperties(analytics, { [name]: value }),
	setUserProperties: async (props) => setUserProperties(analytics, props as any),
	setAnalyticsCollectionEnabled: async (enabled) => setAnalyticsCollectionEnabled(analytics, enabled),
	logScreenView: async (screenName) => setCurrentScreen(analytics, screenName),
	setSessionTimeoutDuration: async () => {},
	logLogin: async (method) => logEvent(analytics, 'login' as any, { method }),
	logSignUp: async (method) => logEvent(analytics, 'sign_up' as any, { method }),
	logAddToCart: async (params) => logEvent(analytics, 'add_to_cart' as any, params),
	logViewItem: async (params) => logEvent(analytics, 'view_item' as any, params),
	logPurchase: async (params) => logEvent(analytics, 'purchase' as any, params),
}
