// Crashlytics — native leaf. Shares the firebase-core app bootstrap with
// firebase-analytics and push; fatal reports upload on next launch.
import { firebase } from '@nativescript/firebase-core'
// Registers `firebase().crashlytics()` — the accessor is installed by the
// module's import side effect.
import '@nativescript/firebase-crashlytics'
import type { CrashlyticsService } from './types'

const instance = () => {
	const c = (firebase() as any).crashlytics?.()
	if (!c) {
		throw new Error(
			'unsupported: firebase crashlytics is not available — is the Firebase app configured?',
		)
	}
	return c
}

/** Crashlytics service — see CrashlyticsService. */
export const crashlytics: CrashlyticsService = {
	supported: true,

	log: (message) => instance().log(message),
	recordError: (error, jsErrorName) => instance().recordError(error, jsErrorName),
	setUserId: async (id) => instance().setUserId(id),
	setAttribute: async (name, value) => instance().setAttribute(name, value),
	setAttributes: async (attrs) => instance().setAttributes(attrs),
	setCrashlyticsCollectionEnabled: async (enabled) =>
		instance().setCrashlyticsCollectionEnabled?.(enabled),
	checkForUnsentReports: async () => !!(await instance().checkForUnsentReports?.()),
	sendUnsentReports: async () => instance().sendUnsentReports?.(),
	deleteUnsentReports: async () => instance().deleteUnsentReports?.(),
	didCrashOnPreviousExecution: async () => !!instance().didCrashOnPreviousExecution(),
	crash: () => instance().crash(),
}
