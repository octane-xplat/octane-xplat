/** One breadcrumb attached to subsequent events — a trail of what happened
 *  before a crash or error. */
export interface SentryBreadcrumb {
	/** Human-readable description. */
	message?: string
	/** Dotted grouping such as 'ui.click' or 'navigation'. */
	category?: string
	/** Severity hint ('debug' | 'info' | 'warning' | 'error' | 'fatal'). */
	level?: string
	/** Arbitrary structured context attached to the crumb. */
	data?: unknown
}

/** Identity attached to events for user-scoped search in Sentry. */
export interface SentryUser {
	/** Stable user id — the primary lookup key. */
	id?: string
	/** User email. */
	email?: string
	/** Display username. */
	username?: string
}

/** Options for sentry.init(). */
export interface SentryInitOptions {
	/** Project DSN from Sentry project settings. */
	dsn: string
	/** Deployment environment tag ('production', 'staging', …). */
	environment?: string
	/** Release identifier — pair with `dist` for source-map matching. */
	release?: string
	/** Build/distribution identifier. */
	dist?: string
	/** 0..1 error sampling. */
	sampleRate?: number
	/** 0..1 performance-traces sampling. */
	tracesSampleRate?: number
	/** Native session tracking (launch/close) where the SDK offers it. */
	enableAutoSessionTracking?: boolean
}

/** Sentry error-reporting façade. Calls before init() are dropped. */
export interface SentryService {
	/** Synchronous fast check — a Sentry backend exists. */
	readonly supported: boolean
	/** Initialize the SDK; call once at app startup. */
	init(options: SentryInitOptions): void
	/** Report an error/exception to Sentry. */
	captureException(error: unknown, context?: Record<string, unknown>): void
	/** Report a plain message at the given level. */
	captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void
	/** Append a breadcrumb to the trail sent with the next event. */
	addBreadcrumb(breadcrumb: SentryBreadcrumb): void
	/** Attach (or clear, with null) the user identity on future events. */
	setUser(user: SentryUser | null): void
	/** Set a searchable tag on future events. */
	setTag(key: string, value: string): void
	/** Set (or remove, with null) a named context object on future events. */
	setContext(key: string, context: Record<string, unknown> | null): void
}

export declare const sentry: SentryService
