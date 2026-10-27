export interface SentryBreadcrumb {
	message?: string
	category?: string
	level?: string
	data?: unknown
}

export interface SentryUser {
	id?: string
	email?: string
	username?: string
}

export interface SentryInitOptions {
	dsn: string
	environment?: string
	release?: string
	dist?: string
	/** 0..1 error sampling. */
	sampleRate?: number
	/** 0..1 performance-traces sampling. */
	tracesSampleRate?: number
	enableAutoSessionTracking?: boolean
}

export interface SentryService {
	readonly supported: boolean
	init(options: SentryInitOptions): void
	captureException(error: unknown, context?: Record<string, unknown>): void
	captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void
	addBreadcrumb(breadcrumb: SentryBreadcrumb): void
	setUser(user: SentryUser | null): void
	setTag(key: string, value: string): void
	setContext(key: string, context: Record<string, unknown> | null): void
}

export declare const sentry: SentryService
