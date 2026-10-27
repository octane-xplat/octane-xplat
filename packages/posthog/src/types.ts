export interface PostHogInitOptions {
	apiKey: string
	/** PostHog Cloud region or self-hosted URL — 'https://us.i.posthog.com' default. */
	host?: string
	/** Events buffered before an automatic flush. */
	flushAt?: number
	/** Milliseconds between automatic flushes. */
	flushInterval?: number
}

export interface PostHogService {
	readonly supported: boolean
	init(options: PostHogInitOptions): void
	capture(event: string, properties?: Record<string, unknown>): void
	identify(distinctId: string, properties?: Record<string, unknown>): void
	screen(name: string, properties?: Record<string, unknown>): void
	group(type: string, key: string, properties?: Record<string, unknown>): void
	getFeatureFlag(key: string): string | boolean | undefined
	isFeatureEnabled(key: string): boolean
	reloadFeatureFlags(): Promise<void>
	/** Log out — clears the distinct id and starts a new anonymous one. */
	reset(): void
	flush(): Promise<void>
	optOut(): void
	optIn(): void
}

export declare const posthog: PostHogService
