// MCP server assembly: registers the package-A contract tools against the
// workspace context. Later packages add their own tools/providers through the
// same context — one coherent entry point.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { contractError, toContractError } from './contracts/errors.mjs'
import { EVIDENCE_KINDS } from './contracts/evidence.mjs'
import { PLATFORMS } from './contracts/identity.mjs'
import { PERMISSION_SCOPES } from './contracts/policy.mjs'
import { discoverWorkspace } from './discovery.mjs'
import { registerRuntimeTools } from './runtime/tools.mjs'
import { registerDocsTools } from './docs.mjs'
import { registerInspectionTools } from './inspection/service.mjs'
import {
	bindApp,
	buildProjectStatus,
	resolveSelection,
	SERVER_NAME,
	SERVER_VERSION,
} from './status.mjs'

const INSTRUCTIONS =
	'MCP server for Octane Xplat apps. Call xplat_project_status first — it reports detected apps, framework versions, guidance, prerequisites, and capabilities. ' +
	'If several apps are detected, ask the developer which to use and bind it with xplat_select_app; never guess. ' +
	'With a dev-mode app running, xplat_dev_actions lists the app-declared action registry and xplat_dev_action_invoke runs one against an exact instance and registry revision. ' +
	'For runtime work, check xplat_capability_matrix then xplat_targets; xplat_launch starts an owned session as a job and xplat_attach binds a session you already run. ' +
	'Results always say what was actually checked; a successful build is not proof of behavior.'

const respond = (outcome) => ({
	structuredContent: outcome,
	isError: outcome.ok === false,
	content: [{ type: 'text', text: JSON.stringify(outcome, null, 2) }],
})

const ok = (data) => respond({ ok: true, data })
const fail = (error) => respond({ ok: false, error })

/** The bound app for runtime tools — explicit, configured, or sole-app. */
const boundApp = (context) => {
	const selection = resolveSelection(context)
	return selection.state === 'bound' ? selection.app : null
}

const NO_APP = () =>
	contractError('invalid_selection', 'No app is bound.', {
		recovery: { action: 'Bind an app with xplat_select_app first.' },
	})

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

	// Work item C: a code provider wired into the context makes code
	// search/read a server-side capability — supported on every platform,
	// independent of runtime adapters.
	if (context.code) {
		for (const platform of PLATFORMS) {
			context.capabilities.register({
				platform,
				describe: () => [
					{
						capability: 'code_search',
						status: 'supported',
						detail:
							'Exact search reads the bound app and its installed framework sources directly. An optional local semantic index accelerates intent-style queries and never blocks exact retrieval.',
					},
				],
			})
		}
	}

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

			return ok({ result: await context.runtime.endSession(sessionId) })
		},
	)

	server.registerTool(
		'xplat_dev_actions',
		{
			description:
				"List the bound app's declared development actions — the live registry announced by a running dev app: stable ids, titles, input/result contracts, effects, availability with reasons, and the registry revision. Never executes an action. An empty registry is reported distinctly from a disconnected app.",
			inputSchema: {},
		},
		async () => {
			const app = boundApp(context)
			return app ? ok(await context.devActions.list(app)) : fail(NO_APP())
		},
	)

	server.registerTool(
		'xplat_dev_action_invoke',
		{
			description:
				'Invoke an app-declared development action against a specific app instance and registry revision. Input is validated against the declared contract before anything runs; stale revisions, unavailable actions and saturated queues are rejected up front. Returns a job — poll xplat_job_status, cancel with xplat_job_cancel. Successful setup does not prove app behavior; verify separately.',
			inputSchema: {
				appInstanceId: z
					.string()
					.optional()
					.describe('Target app instance from xplat_dev_actions; required when several instances are live'),
				actionId: z.string().describe('Stable action id from the registry'),
				input: z
					.record(z.string(), z.unknown())
					.optional()
					.describe('Named inputs matching the declared input contract'),
				registryRevision: z
					.number()
					.optional()
					.describe('The revision returned by xplat_dev_actions — stale revisions are rejected'),
				requestKey: z
					.string()
					.optional()
					.describe('Idempotence key: a retry with the same key returns the live job instead of re-running'),
			},
		},
		async ({ appInstanceId, actionId, input, registryRevision, requestKey }) => {
			const app = boundApp(context)
			if (!app) {
				return fail(NO_APP())
			}

			const result = await context.devActions.invoke(app, {
				appInstanceId,
				actionId,
				input: input ?? {},
				registryRevision,
				requestKey,
			})

			return result.error ? fail(result.error) : ok(result)
		},
	)

	server.registerTool(
		'xplat_dev_action_status',
		{
			description:
				'Status of a development-action invocation: job state, structured result or failure, and disclosed partial effects. Same data as xplat_job_status, restricted to dev-action jobs.',
			inputSchema: { jobId: z.string() },
		},
		async ({ jobId }) => {
			const described = context.devActions.describeJob(jobId)
			if (!described) {
				return fail(
					contractError('not_found', `No job "${jobId}".`, {
						recovery: { action: 'Invoke an action first; finished history is bounded.' },
					}),
				)
			}

			if (described.job.kind !== 'dev-action') {
				return fail(
					contractError('invalid_selection', `Job "${jobId}" is a ${described.job.kind} job, not a dev-action invocation.`, {
						recovery: { action: 'Use xplat_job_status for other job kinds.' },
					}),
				)
			}

			return ok(described)
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

	// Code retrieval (work item C). Results are leads with provenance and
	// freshness — exact search reads live files, semantic hits are
	// revalidated against current source before serving.
	const boundAppForCode = () => {
		const selection = resolveSelection(context)
		if (selection.state === 'ambiguous') {
			return {
				error: contractError(
					'ambiguous_selection',
					'Several apps are detected — code retrieval targets the bound app and its installed packages, never a guessed one.',
					{
						recovery: {
							action: 'Ask the developer which app to use, then call xplat_select_app.',
						},
						context: { candidates: selection.candidates.map((a) => a.id) },
					},
				),
			}
		}

		// 'none' stays usable for framework-repo workspaces (framework corpus
		// needs no bound app); the provider reports when an app is required.
		return { app: selection.state === 'bound' ? selection.app : null }
	}

	const noCodeProvider = () =>
		fail(
			contractError(
				'unavailable',
				'No code-search provider is wired into this server (work item C integration absent).',
				{
					recovery: {
						action: 'Use your normal file tools; report the missing provider to the developer.',
					},
				},
			),
		)

	const codeResult = (result) => {
		if (!result?.status) {
			return ok(result)
		}

		const code = result.status === 'unavailable' ? 'unavailable' : 'invalid_selection'

		return fail(
			contractError(code, result.detail ?? result.reason ?? result.status, {
				context: {
					status: result.status,
					reason: result.reason,
					corpus: result.corpus,
					path: result.path,
				},
			}),
		)
	}

	server.registerTool(
		'xplat_code_search',
		{
			description:
				'Search current source. mode=exact (default auto includes it) finds identifiers/tokens by exact match over live files; mode=semantic uses an optional local index that never blocks exact retrieval. Corpora stay labeled: app = the bound app, framework = its installed @octane-xplat packages. Results are leads — open refs with xplat_code_read before citing an API.',
			inputSchema: {
				query: z.string().describe('Identifier, phrase, or intent to search for'),
				mode: z
					.enum(['auto', 'exact', 'semantic'])
					.optional()
					.describe('exact = token search over current files; semantic = local index; auto = both'),
				corpus: z.enum(['app', 'framework', 'all']).optional().describe('Default: all'),
				platform: z
					.enum(PLATFORMS)
					.optional()
					.describe('Include shared files plus files marked for this platform'),
				package: z.string().optional().describe('Limit the framework corpus to one package'),
				limit: z.number().int().min(1).max(50).optional(),
			},
		},
		async ({ query, mode, corpus, platform, package: pkg, limit }) => {
			if (!context.code) {
				return noCodeProvider()
			}

			const check = context.policy.require('workspace')
			if (!check.granted) {
				return fail(check.error)
			}

			const { app, error } = boundAppForCode()
			if (error) {
				return fail(error)
			}

			try {
				return codeResult(
					await context.code.search({
						app,
						workspaceKind: context.discovery.workspace.kind,
						query,
						mode,
						corpus,
						platform,
						package: pkg,
						limit,
					}),
				)
			} catch (value) {
				return fail(toContractError(value))
			}
		},
	)

	server.registerTool(
		'xplat_code_read',
		{
			description:
				'Read current source by a search ref (xplat-code://…) or explicit corpus + path. Bounded slices return a continuation offset; a file that changed or vanished is reported, never served stale.',
			inputSchema: {
				ref: z.string().optional().describe('xplat-code://<corpus>/<key> from a search hit'),
				corpus: z.enum(['app', 'framework']).optional(),
				package: z.string().optional().describe('Framework package name for corpus=framework'),
				path: z
					.string()
					.optional()
					.describe('Workspace-relative path (app) or path inside the package (framework)'),
				offset: z.number().int().min(0).optional(),
				limit: z.number().int().min(1).max(64_000).optional(),
			},
		},
		async ({ ref, corpus, package: pkg, path, offset, limit }) => {
			if (!context.code) {
				return noCodeProvider()
			}

			const check = context.policy.require('workspace')
			if (!check.granted) {
				return fail(check.error)
			}

			const { app, error } = boundAppForCode()
			if (error) {
				return fail(error)
			}

			try {
				return codeResult(
					await context.code.read({
						app,
						workspaceKind: context.discovery.workspace.kind,
						ref,
						corpus,
						package: pkg,
						path,
						offset,
						limit,
					}),
				)
			} catch (value) {
				return fail(toContractError(value))
			}
		},
	)

	registerRuntimeTools(server, context, respond)
	registerDocsTools(server, context, respond)
	registerInspectionTools(server, context, respond)

	return {
		server,
		context,
		/** Ownership-safe teardown: end owned sessions, delete session-scoped evidence. */
		async shutdown() {
			const sessions = await context.runtime.endAll()
			const evidence = context.evidence.closeSession()
			return { sessions, evidence }
		},
	}
}
