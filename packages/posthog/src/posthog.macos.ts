// macOS — the JS host has fetch, so the same posthog-js-lite client works;
// ApplicationSettings does not, so persistence is in-memory.
import PostHog from 'posthog-js-lite'
import type { PostHogInitOptions, PostHogService } from './types'

let client: PostHog | null = null
const getClient = () => {
	if (!client) {
		throw new Error('posthog.init() must run before capture/flags')
	}
	return client
}

export const posthog: PostHogService = {
	supported: true,
	init(options: PostHogInitOptions): void {
		client = new PostHog(options.apiKey, {
			host: options.host,
			flushAt: options.flushAt,
			flushInterval: options.flushInterval,
			persistence: 'memory',
		} as any)
	},
	capture: (event, properties) => getClient().capture(event, properties as any),
	identify: (id, props) => getClient().identify(id, props as any),
	screen: (name, props) => (getClient() as any).screen?.(name, props as any),
	group: (t, k, props) => getClient().group(t, k, props as any),
	getFeatureFlag: (k) => getClient().getFeatureFlag(k) as string | boolean | undefined,
	isFeatureEnabled: (k) => !!getClient().isFeatureEnabled(k),
	reloadFeatureFlags: async () => (getClient() as any).reloadFeatureFlagsAsync?.(),
	reset: () => getClient().reset(),
	flush: async () => (getClient() as any).flushAsync?.(),
	optOut: () => getClient().optOut(),
	optIn: () => getClient().optIn(),
}
