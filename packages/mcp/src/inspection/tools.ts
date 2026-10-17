// Inspection tool registration (MCP adapter). The service lives in the
// shared layer at @octane-xplat/cli/mcp/inspection/service; this file only
// binds it to MCP tools.
import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Respond, WorkspaceContext } from '../context.ts'

export function registerInspectionTools(
	server: McpServer,
	context: WorkspaceContext,
	respond: Respond,
) {
	const control = z.object({ kind: z.enum(['id', 'testID']), name: z.string().min(1).max(200) })
	const run =
		(method: 'inspect' | 'interact' | 'screenshot') =>
		async (args: any): Promise<ReturnType<Respond>> => {
			const data = await context.inspection[method](args)
			return data.error ? respond({ ok: false, error: data.error }) : respond({ ok: true, data })
		}

	server.registerTool(
		'xplat_inspect',
		{
			description:
				'Bounded main-document named DOM hosts in the owned Chromium session. Explicit id/testID selector; duplicates fail. Password/private values are redacted. Includes document/session/build identity and coverage.',
			inputSchema: {
				sessionId: z.string(),
				control: control.optional(),
				offset: z.number().int().min(0).optional(),
				limit: z.number().int().min(1).max(100).optional(),
			},
		},
		run('inspect'),
	)

	server.registerTool(
		'xplat_interact',
		{
			description:
				'Send scoped input to one stable control from an inspected document. dom-event sends a CDP mouse click; os-input sends Space/Enter via the macOS event system to owned headed Chromium. Reserve desktop input for OS actions. Input delivery is not an app assertion.',
			inputSchema: {
				sessionId: z.string(),
				documentId: z.string(),
				control,
				mechanism: z.enum(['dom-event', 'os-input']),
				key: z.enum(['Space', 'Enter']).optional().default('Space'),
			},
		},
		run('interact'),
	)

	server.registerTool(
		'xplat_screenshot',
		{
			description:
				'Capture the owned Chromium viewport only with a current visual-capture grant. Returns a session-scoped artifact and provenance; capability discovery never grants approval.',
			inputSchema: { sessionId: z.string() },
		},
		run('screenshot'),
	)
}
