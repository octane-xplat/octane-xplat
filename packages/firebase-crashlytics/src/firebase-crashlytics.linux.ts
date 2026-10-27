// Unsupported leaf — Crashlytics has no JS/desktop SDK (route app errors to
// @octane-xplat/sentry or posthog instead).
import type { CrashlyticsService } from './types'

const reject = () => Promise.reject(new Error('unsupported: no Crashlytics SDK on this platform'))

export const crashlytics: CrashlyticsService = {
	supported: false,
	log: () => {},
	recordError: () => {},
	setUserId: reject,
	setAttribute: reject,
	setAttributes: reject,
	setCrashlyticsCollectionEnabled: reject,
	checkForUnsentReports: async () => false,
	sendUnsentReports: reject,
	deleteUnsentReports: reject,
	didCrashOnPreviousExecution: async () => false,
	crash: () => {},
}
