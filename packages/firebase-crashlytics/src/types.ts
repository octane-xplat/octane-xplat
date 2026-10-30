/** Firebase Crashlytics façade — breadcrumbs, non-fatals, user/context
 *  attributes, and unsent-report management. */
export interface CrashlyticsService {
	/** Synchronous fast check — a Crashlytics backend exists (false on web). */
	readonly supported: boolean
	/** Write a breadcrumb line into the next crash report. */
	log(message: string): void
	/** Record a non-fatal error. `jsErrorName` labels the JS-side origin on
	 *  platforms that distinguish it from the error's own name. */
	recordError(error: Error, jsErrorName?: string): void
	/** Attach a user id to subsequent reports. */
	setUserId(userId: string): Promise<void>
	/** Set one custom key on subsequent reports. */
	setAttribute(name: string, value: string | number | boolean): Promise<void>
	/** Set several custom keys in one call. */
	setAttributes(attrs: Record<string, string | number | boolean>): Promise<void>
	/** Master switch for crash collection — persists across launches. */
	setCrashlyticsCollectionEnabled(enabled: boolean): Promise<void>
	/** True when a crash report is queued for upload. */
	checkForUnsentReports(): Promise<boolean>
	/** Upload queued reports (call after checkForUnsentReports, typically
	 *  gated on user consent). */
	sendUnsentReports(): Promise<void>
	/** Discard queued reports without sending. */
	deleteUnsentReports(): Promise<void>
	/** True when the previous run ended in a crash. */
	didCrashOnPreviousExecution(): Promise<boolean>
	/** Force a native crash — test-only. */
	crash(): void
}

export declare const crashlytics: CrashlyticsService
