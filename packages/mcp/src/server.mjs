// MCP server assembly: registers the package-A contract tools against the
// workspace context. Later packages add their own tools/providers through the
// same context — one coherent entry point.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { contractError } from './contracts/errors.mjs'
import { EVIDENCE_KINDS } from './contracts/evidence.mjs'
import { PLATFORMS } from './contracts/identity.mjs'
import { PERMISSION_SCOPES } from './contracts/policy.mjs'
import { discoverWorkspace } from './discovery.mjs'
import { bindApp, buildProjectStatus, SERVER_NAME, SERVER_VERSION } from './status.mjs'

const INSTRUCTIONS =
	'MCP server for Octane Xplat apps. Call xplat_project_status first — it reports detected apps, framework versions, guidance, prerequisites, and capabilities. ' +
	'If several apps are detected, ask the developer which to use and bind it with xplat_select_app; never guess. ' +
	'Results always say what was actually checked; a successful build is not proof of behavior.'

const respond = (outcome) => ({
	structuredContent: outcome,
	isError: outcome.ok === false,
	content: [{ type: 'text', text: JSON.stringify(outcome, null, 2) }],
})

const ok = (data) => respond({ ok: true, data })
const fail = (error) => respond({ ok: false, error })

export function createXplatMcpServer(context) {
	const server = new McpServer(
		{ name: SERVER_NAME, version: SERVER_VERSION },
		{ instructions: INSTRUCTIONS },
	)

	// Wire the policy elicitation channel now that the protocol exists. The
	// client must advertise elicitation support; without it, grants fall back
	// to developer-side configuration with an honest recovery message.
	context.policy.setElicitor(async (scope, reason) => {
		try {
			if (!server.server.getClientCapabilities()?.elicitation) {
				return 'denied'
			}

			const answer = await server.server.elicitInput({
				message: `Octane Xplat MCP requests permission "${scope}": ${reason}`,
				requestedSchema: {
					type: 'object',
					properties: {
						grant: { type: 'boolean', description: 'Grant this permission for the current task' },
					},
					required: ['grant'],
				},
			})

			return answer.action === 'accept' && answer.content?.grant === true ? 'granted' : 'denied'
		} catch {
			return 'denied'
		}
	})

	server.registerTool(
		'xplat_project_status',
		{
			description:
				'Report detected project identity, framework versions, guidance, docs/code-index status, declared platforms, runtime prerequisites, and the capability summary. Call first; call again after changing workspaces or installing dependencies.',
			inputSchema: {
				refresh: z
					.boolean()
					.optional()
					.describe('Re-scan the workspace instead of using the startup snapshot'),
			},
		},
		async ({ refresh }) => {
			if (refresh) {
				context.discovery = discoverWorkspace(context.workspaceRoot)
				// A previously bound app may have moved or vanished; re-resolve.
				if (context.boundApp) {
					const still = context.discovery.apps.find((a) => a.id === context.boundApp.id)
					context.boundApp = still ?? null
					context.selectionReason = still ? 'explicit' : null
				}
			}

			return ok(await buildProjectStatus(context))
		},
	)

	server.registerTool(
		'xplat_select_app',
		{
			description:
				'Bind an explicit app for subsequent work. Required when several apps are detected — the server never picks silently. Pass the app id, relative path, or package name from the status report.',
			inputSchema: {
				app: z.string().describe('App id, workspace-relative path, or package name'),
			},
		},
		async ({ app }) => {
			const result = bindApp(context, app)
			if (result.error) {
				if (result.error === 'ambiguous_selection') {
					return fail(
						contractError('ambiguous_selection', `"${app}" matches several apps.`, {
							recovery: { action: 'Ask the developer which app to use, then pass its id.' },
							context: { candidates: result.candidates },
						}),
					)
				}

				return fail(
					contractError('invalid_selection', `No app matches "${app}".`, {
						recovery: { action: 'Pick an id from candidates, or check the workspace root.' },
						context: { candidates: result.candidates },
					}),
				)
			}

			return ok({ bound: result.app, reason: 'explicit' })
		},
	)

	server.registerTool(
		'xplat_capability_matrix',
		{
			description:
				'Per-platform capability matrix: build, launch, logs, UI inspection, screenshot, and interaction are separate capabilities. Unsupported or missing capabilities come with an explanation and a usable alternative when one exists.',
			inputSchema: {
				platform: z.enum(PLATFORMS).optional().describe('Limit to one platform'),
			},
		},
		async ({ platform }) => {
			const status = await buildProjectStatus(context)
			const matrices = platform
				? status.capabilities.filter((m) => m.platform === platform)
				: status.capabilities

			return ok({ capabilities: matrices })
		},
	)

	server.registerTool(
		'xplat_permissions',
		{
			description:
				'Report permission grants and their states. Workspace scope and ordinary runtime actions reuse the task authorization; screenshots require an explicit per-task developer grant checked at action time.',
			inputSchema: {
				scope: z.enum(PERMISSION_SCOPES).optional(),
			},
		},
		async ({ scope }) => {
			const grants = context.policy.list()
			if (!scope) {
				return ok({ grants })
			}

			const grant = grants.find((g) => g.scope === scope)
			const check = context.policy.require(scope)
			return ok({
				grant,
				check: check.granted ? { granted: true } : { granted: false, error: check.error },
			})
		},
	)

	server.registerTool(
		'xplat_sessions',
		{
			description:
				'List bound sessions: owned sessions the server started and attached user-owned sessions. Runtime tools bind one app to one target; attached sessions are preserved on end.',
			inputSchema: {},
		},
		async () => ok({ sessions: context.sessions.list() }),
	)

	server.registerTool(
		'xplat_job_status',
		{
			description: 'Bounded status query for a job started by a runtime tool.',
			inputSchema: { jobId: z.string() },
		},
		async ({ jobId }) => {
			const job = context.jobs.status(jobId)
			return job
				? ok({ job })
				: fail(
						contractError('not_found', `No job "${jobId}".`, {
							recovery: { action: 'Start a job first; finished history is bounded.' },
						}),
					)
		},
	)

	server.registerTool(
		'xplat_job_cancel',
		{
			description:
				'Cooperatively cancel a job. Cancelling signals only that job — it never kills an unrelated app or another user\u2019s process.',
			inputSchema: { jobId: z.string() },
		},
		async ({ jobId }) => {
			const job = context.jobs.cancel(jobId)
			return job ? ok({ job }) : fail(contractError('not_found', `No job "${jobId}".`))
		},
	)

	server.registerTool(
		'xplat_session_end',
		{
			description:
				'End a session with ownership-safe cleanup: owned sessions release their resources; attached user-owned sessions are detached and preserved.',
			inputSchema: { sessionId: z.string() },
		},
		async ({ sessionId }) => {
			const usable = context.sessions.requireUsable(sessionId)
			if (!usable.usable && usable.error.code === 'not_found') {
				return fail(usable.error)
			}

			return ok({ result: await context.sessions.end(sessionId) })
		},
	)

	server.registerTool(
		'xplat_evidence',
		{
			description:
				'List, retain, or delete evidence artifacts. Evidence is session-scoped and deleted when the MCP session ends; retain needs an explicit expiration or manual deletion. Deletion cannot erase an external client transcript.',
			inputSchema: {
				op: z.enum(['list', 'retain', 'delete']),
				id: z.string().optional().describe('Evidence record id (required for retain/delete)'),
				expiresAt: z
					.string()
					.optional()
					.describe('ISO expiration for retain; omit for manual deletion only'),
				kind: z.enum(EVIDENCE_KINDS).optional().describe('Filter for list'),
			},
		},
		async ({ op, id, expiresAt, kind }) => {
			if (op === 'list') {
				return ok({ evidence: context.evidence.list({ kind }) })
			}

			if (!id) {
				return fail(contractError('invalid_selection', `op "${op}" requires an evidence id.`))
			}

			if (op === 'retain') {
				const result = context.evidence.retain(id, { expiresAt: expiresAt ?? null })
				return result.error ? fail(result.error) : ok(result)
			}

			const result = context.evidence.delete(id)
			return result.error ? fail(result.error) : ok(result)
		},
	)

	return {
		server,
		context,
		/** Ownership-safe teardown: end owned sessions, delete session-scoped evidence. */
		async shutdown() {
			const sessions = await context.sessions.shutdown()
			const evidence = context.evidence.closeSession()
			return { sessions, evidence }
		},
	}
}
