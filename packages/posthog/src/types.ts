/** Options for posthog.init(). */
export interface PostHogInitOptions {
	/** Project API key from the PostHog project settings. */
	apiKey: string
	/** PostHog Cloud region or self-hosted URL — 'https://us.i.posthog.com' default. */
	host?: string
	/** Events buffered before an automatic flush. */
	flushAt?: number
	/** Milliseconds between automatic flushes. */
	flushInterval?: number
}

/** PostHog product-analytics façade — capture, identity, and feature flags.
 *  Calls before init() are buffered or dropped per the SDK. */
export interface PostHogService {
	/** Synchronous fast check — a PostHog backend exists. */
	readonly supported: boolean
	/** Initialize the client; call once at app startup. */
	init(options: PostHogInitOptions): void
	/** Record an analytics event. */
	capture(event: string, properties?: Record<string, unknown>): void
	/** Attach a distinct id and optional person properties to future events. */
	identify(distinctId: string, properties?: Record<string, unknown>): void
	/** Record a $screen event. */
	screen(name: string, properties?: Record<string, unknown>): void
	/** Associate the user with a group (e.g. type 'company'). */
	group(type: string, key: string, properties?: Record<string, unknown>): void
	/** Read a feature flag's value; undefined while flags are unloaded or the
	 *  key does not exist. */
	getFeatureFlag(key: string): string | boolean | undefined
	/** True when the flag is truthy — never throws for missing flags. */
	isFeatureEnabled(key: string): boolean
	/** Refetch feature flags from the server. */
	reloadFeatureFlags(): Promise<void>
	/** Log out — clears the distinct id and starts a new anonymous one. */
	reset(): void
	/** Force-send queued events now. */
	flush(): Promise<void>
	/** Stop capturing events (persisted). */
	optOut(): void
	/** Resume capturing after optOut(). */
	optIn(): void
}

export declare const posthog: PostHogService
