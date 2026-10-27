export interface CrashlyticsService {
	readonly supported: boolean
	log(message: string): void
	recordError(error: Error, jsErrorName?: string): void
	setUserId(userId: string): Promise<void>
	setAttribute(name: string, value: string | number | boolean): Promise<void>
	setAttributes(attrs: Record<string, string | number | boolean>): Promise<void>
	setCrashlyticsCollectionEnabled(enabled: boolean): Promise<void>
	checkForUnsentReports(): Promise<boolean>
	sendUnsentReports(): Promise<void>
	deleteUnsentReports(): Promise<void>
	didCrashOnPreviousExecution(): Promise<boolean>
	/** Force a native crash — test-only. */
	crash(): void
}

export declare const crashlytics: CrashlyticsService
