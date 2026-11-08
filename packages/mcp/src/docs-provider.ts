// @ts-nocheck — restored docs provider; annotations pending (transitional)
// One installed-version binding per selected consumer app, never the workspace root.
import { createDocsService } from '@octane-xplat/cli/mcp/docs-service'

export function createDocsProvider(context, options = {}) {
  const services = new Map()
  const serviceFor = (app) => {
    if (!services.has(app.root)) {
      services.set(app.root, createDocsService({ ...options, workspaceRoot: app.root }))
    }

    return services.get(app.root)
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
