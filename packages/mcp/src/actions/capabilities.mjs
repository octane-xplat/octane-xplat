// dev_actions capability reporting: a platform supports discovery/invocation
// only while a live app instance announces a registry on it. A reachable
// bridge without an announced instance is partial coverage — the wiring works
// but the app side has not come up. Anything else is unavailable with the
// concrete recovery, never hidden.

import { PLATFORMS } from '../contracts/identity.mjs'

const RUN_ALTERNATIVES = {
	web: 'xplat dev --target web',
	ios: 'xplat dev --target ios',
	android: 'xplat dev --target android',
	macos: 'xplat dev --target macos',
	linux: 'xplat dev --target linux',
	windows: 'xplat dev --target windows',
}

/**
 * Register a dev_actions provider for every platform. `service` is the
 * createDevActionsService instance; describe() polls the app's bridges, so
 * the matrix reflects live state.
 */
export function registerDevActionProviders({ capabilities, service }) {
	for (const platform of PLATFORMS) {
		capabilities.register({
			platform,
			async describe(app) {
				const view = await service.list(app)
				const hasPlatformInstance = view.instances.some((i) => i.platform === platform)

				if (hasPlatformInstance) {
					return [
						{
							capability: 'dev_actions',
							status: 'supported',
							detail: `${view.instances.filter((i) => i.platform === platform).length} live app instance(s) announcing a registry.`,
						},
					]
				}

				if (view.state === 'live' || view.state === 'no-instance') {
					return [
						{
							capability: 'dev_actions',
							status: 'partial',
							detail:
								'A development bridge is reachable for this app but no instance on this platform has announced a registry. Discovery and invocation work once the app runs on this target in dev mode.',
						},
					]
				}

				return [
					{
						capability: 'dev_actions',
						status: 'unavailable',
						detail: view.detail ?? 'No development bridge is running for this app.',
						alternative: {
							description:
								'Run the app in dev mode; the dev bridge is included in the xplatNative preset and the scaffolded web config (xplatDevBridge from @octane-xplat/cli/vite).',
							command: RUN_ALTERNATIVES[platform],
						},
					},
				]
			},
		})
	}
}
