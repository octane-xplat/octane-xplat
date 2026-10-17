// Docs tool registration (MCP adapter). The provider itself lives in the
// shared service layer at @octane-xplat/cli/mcp/docs-provider — the CLI's
// `docs`/`guidance` commands project the same service.
import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { contractError, toContractError } from './contracts/errors.ts'
import { PLATFORMS } from './contracts/identity.ts'
import { resolveSelection } from './status.ts'
import type { Respond, Selection, WorkspaceContext } from './context.ts'
import type { Platform } from '../types/contracts/identity'

export function registerDocsTools(server: McpServer, context: WorkspaceContext, respond: Respond) {
	const run =
		(method: 'search' | 'read' | 'guidance') =>
		async (args: any): Promise<ReturnType<Respond>> => {
			const permission = context.policy.require('workspace')
			if (!permission.granted) {
				return respond({ ok: false, error: permission.error })
			}

			const selection = resolveSelection(context) as Selection
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
				platform: z.enum(PLATFORMS as Platform[]).optional(),
				corpus: z
					.enum(['guide', 'recipe', 'design-note', 'implementation-note'])
					.optional()
					.default('guide'),
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
