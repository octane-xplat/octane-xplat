// One installed-version binding per selected consumer app, never the workspace root.
import { createDocsService } from '@octane-xplat/cli/mcp/docs-service'
import { z } from 'zod'
import { contractError, toContractError } from './contracts/errors.mjs'
import { PLATFORMS } from './contracts/identity.mjs'
import { resolveSelection } from './status.mjs'

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

export function registerDocsTools(server, context, respond) {
	const run = (method) => async (args) => {
		const permission = context.policy.require('workspace')
		if (!permission.granted) {
			return respond({ ok: false, error: permission.error })
		}

		const selection = resolveSelection(context)
		if (selection.state !== 'bound') {
			return respond({
				ok: false,
				error: contractError(
					selection.state === 'ambiguous' ? 'ambiguous_selection' : 'invalid_selection',
					'Bind an app with xplat_select_app before retrieving docs.',
				),
			})
		}

		try {
			const data = await context.docs.serviceFor(selection.app)[method](args)
			return respond({ ok: true, data })
		} catch (error) {
			return respond({ ok: false, error: toContractError(error) })
		}
	}

	server.registerTool(
		'xplat_docs_search',
		{
			description:
				'Search the selected app’s installed-version docs. Results include version/snapshot provenance, unavailable packages, conflicts, and separately labeled project guidance.',
			inputSchema: {
				query: z.string().trim().min(1).max(500),
				package: z.string().optional(),
				version: z
					.string()
					.optional()
					.describe('Explicit comparison version, visibly outside the installed binding.'),
				platform: z.enum(PLATFORMS).optional(),
				corpus: z.enum(['guide', 'recipe', 'design-note']).optional().default('guide'),
				limit: z.number().int().min(1).max(50).optional(),
			},
		},
		run('search'),
	)

	server.registerTool(
		'xplat_docs_read',
		{
			description:
				'Read a bounded documentation page from a search ref, or package and path, preserving its version binding.',
			inputSchema: {
				ref: z.string().optional(),
				package: z.string().optional(),
				path: z.string().optional(),
				version: z.string().optional(),
				offset: z.number().int().min(0).optional(),
				limit: z.number().int().min(1).max(20000).optional(),
			},
		},
		run('read'),
	)

	server.registerTool(
		'xplat_guidance',
		{
			description:
				'Retrieve tailored guidance for the selected app’s actual installed package versions.',
			inputSchema: {},
		},
		run('guidance'),
	)
}
