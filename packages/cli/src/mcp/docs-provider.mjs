// One installed-version binding per selected consumer app, never the workspace root.
import { createDocsService } from './docs-service.mjs'
import { PLATFORMS } from './contracts/identity.mjs'

export function createDocsProvider(context, options = {}) {
	const services = new Map()
	const serviceFor = (app) => {
		if (!services.has(app.root)) {
			services.set(app.root, createDocsService({ ...options, workspaceRoot: app.root }))
		}

		return services.get(app.root)
	}

	for (const platform of PLATFORMS) {
		context.capabilities.register({
			platform,
			describe: () => [
				{
					capability: 'docs',
					status: 'supported',
					detail:
						'Installed-version retrieval; missing release snapshots are reported per package with installed-source fallback.',
				},
				{ capability: 'guidance', status: 'supported' },
			],
		})
	}

	return {
		serviceFor,
		async status(app) {
			if (!app) {
				return {
					state: 'unavailable',
					detail: 'Select an app before retrieving installed-version documentation.',
				}
			}

			const service = serviceFor(app)
			await service.refresh()
			const binding = await service.status()
			return {
				state: binding.identity.packages.length ? 'ready' : 'unavailable',
				detail:
					'Provider ready; snapshot availability is checked on retrieval. No latest-version fallback.',
				binding,
			}
		},
	}
}
