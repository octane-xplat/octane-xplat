// PostHog — web leaf over posthog-js (the full web SDK; autocapture and
// session replay are web-only upstream — the asymmetry is documented, not
// shimmed).
import posthogJs from 'posthog-js'
import type { PostHogInitOptions, PostHogService } from './types'

/** PostHog analytics service — see PostHogService. */
export const posthog: PostHogService = {
	supported: typeof window !== 'undefined',

	init(options: PostHogInitOptions): void {
		posthogJs.init(options.apiKey, {
			api_host: options.host ?? 'https://us.i.posthog.com',
		} as any)
	},

	capture: (event, properties) => posthogJs.capture(event, properties as any),
	identify: (distinctId, properties) => posthogJs.identify(distinctId, properties as any),
	screen: (name, properties) =>
		(posthogJs as any).capture('$screen', { $screen_name: name, ...(properties as any) }),
	group: (type, key, properties) => posthogJs.group(type, key, properties as any),
	getFeatureFlag: (key) => posthogJs.getFeatureFlag(key) as string | boolean | undefined,
	isFeatureEnabled: (key) => !!posthogJs.isFeatureEnabled(key),
	reloadFeatureFlags: async () => posthogJs.reloadFeatureFlags(),
	reset: () => posthogJs.reset(),
	flush: async () => (posthogJs as any).flush?.(),
	optOut: () => posthogJs.opt_out_capturing(),
	optIn: () => posthogJs.opt_in_capturing(),
}
