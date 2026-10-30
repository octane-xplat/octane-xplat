// PostHog — native leaf over posthog-js-lite, the official isomorphic core
// that posthog-react-native itself wraps. Native persistence rides
// ApplicationSettings (sync KV, what js-lite's custom storage expects).
import { ApplicationSettings } from '@nativescript/core'
import PostHog from 'posthog-js-lite'
import type { PostHogInitOptions, PostHogService } from './types'

const storage = {
	getItem: (key: string) => ApplicationSettings.getString(key) ?? null,
	setItem: (key: string, value: string) => ApplicationSettings.setString(key, value),
	removeItem: (key: string) => ApplicationSettings.remove(key),
}

let client: PostHog | null = null

function getClient(): PostHog {
	if (!client) {
		throw new Error('posthog.init() must run before capture/flags')
	}
	return client
}

/** PostHog analytics service — see PostHogService. */
export const posthog: PostHogService = {
	supported: true,

	init(options: PostHogInitOptions): void {
		client = new PostHog(options.apiKey, {
			host: options.host,
			flushAt: options.flushAt,
			flushInterval: options.flushInterval,
			persistence: 'customLocalStorage',
			customStorage: storage as any,
		} as any)
	},

	capture: (event, properties) => getClient().capture(event, properties as any),
	identify: (distinctId, properties) => getClient().identify(distinctId, properties as any),
	screen: (name, properties) => (getClient() as any).screen?.(name, properties as any),
	group: (type, key, properties) => getClient().group(type, key, properties as any),
	getFeatureFlag: (key) => getClient().getFeatureFlag(key) as string | boolean | undefined,
	isFeatureEnabled: (key) => !!getClient().isFeatureEnabled(key),
	reloadFeatureFlags: async () => (getClient() as any).reloadFeatureFlagsAsync?.(),
	reset: () => getClient().reset(),
	flush: async () => (getClient() as any).flushAsync?.(),
	optOut: () => getClient().optOut(),
	optIn: () => getClient().optIn(),
}
