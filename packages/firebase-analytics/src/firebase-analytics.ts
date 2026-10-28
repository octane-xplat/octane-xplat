// Firebase Analytics — native leaf. Shares the @nativescript/firebase-core
// app bootstrap with push (firebase-messaging) and firebase-crashlytics —
// one Firebase app per process, configured by the app's google-services files.
import { firebase } from '@nativescript/firebase-core'
import type { FirebaseAnalyticsService } from './types'

const analytics = () => {
	const a = (firebase() as any).analytics?.()
	if (!a) {
		throw new Error(
			'unsupported: firebase analytics is not available — is the Firebase app configured?',
		)
	}
	return a
}

export const firebaseAnalytics: FirebaseAnalyticsService = {
	supported: true,

	async init(): Promise<void> {
		// Native firebase-core initializes from bundled google-services files.
	},

	logEvent: async (name, params) => analytics().logEvent(name, params),
	setUserId: async (id) => analytics().setUserId(id),
	setUserProperty: async (name, value) => analytics().setUserProperty(name, value),
	setUserProperties: async (props) => {
		for (const [name, value] of Object.entries(props)) {
			analytics().setUserProperty(name, value)
		}
	},
	setAnalyticsCollectionEnabled: async (enabled) =>
		analytics().setAnalyticsCollectionEnabled(enabled),
	logScreenView: async (screenName, screenClass) =>
		analytics().logEvent('screen_view', {
			screen_name: screenName,
			screen_class: screenClass ?? screenName,
		}),
	setSessionTimeoutDuration: async (ms) => analytics().setSessionTimeoutInterval(ms),
	logLogin: async (method) => analytics().logEvent('login', { method }),
	logSignUp: async (method) => analytics().logEvent('sign_up', { method }),
	logAddToCart: async (params) => analytics().logEvent('add_to_cart', params),
	logViewItem: async (params) => analytics().logEvent('view_item', params),
	logPurchase: async (params) => analytics().logEvent('purchase', params),
}
