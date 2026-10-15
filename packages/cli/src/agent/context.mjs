// Per-invocation workspace context for agent commands. Assembles the same
// service context the MCP server composes — the CLI process is short-lived
// while selection, policy, and capability semantics stay identical. Read-only
// discovery commands never start apps, targets, or runtimes.
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createCodeService } from '../mcp/code-service.mjs'
import { createWorkspaceContext } from '../mcp/status.mjs'
import { cliServerIdentity } from './identity.mjs'
import { defaultClient, readPreference } from './selection.mjs'

/**
 * options:
 *  - project: workspace root override (--project); default cwd
 *  - app: explicit app selector (--app) — wins over the stored preference
 *  - client: selection-preference scope (--client / XPLAT_AGENT_CLIENT)
 *  - permissionScopes: extra grants (XPLAT_PERMISSIONS)
 *  - docs: createDocsService option overrides (tests fix repo/cache)
 */
export function agentContext(options = {}) {
	const workspaceRoot = resolve(options.project ?? process.cwd())
	const client = options.client ?? defaultClient()
	const preference = options.app ? null : readPreference(workspaceRoot, client)
	const appSelector = options.app ?? preference?.appId ?? null

	// A per-invocation evidence root: artifact-writing commands route through
	// the runtime host (host-client.mjs), never this context — but the store
	// creates its directories eagerly, so give it a scratch dir removed on exit.
	const evidenceRoot = mkdtempSync(join(tmpdir(), 'xplat-agent-evidence-'))
	process.on('exit', () => rmSync(evidenceRoot, { recursive: true, force: true }))

	// Release-repo override for docs binding (XPLAT_DOCS_REPO) — mirrors
	// XPLAT_MCP_CACHE for the docs snapshot cache. Used by packed-lane
	// fixtures and offline mirrors; absent means the canonical repo.
	const docs = options.docs ?? (process.env.XPLAT_DOCS_REPO ? { repo: process.env.XPLAT_DOCS_REPO } : undefined)

	const context = createWorkspaceContext({
		workspaceRoot,
		appSelector,
		serverIdentity: cliServerIdentity(),
		permissionScopes: options.permissionScopes,
		evidenceRoot,
		docs,
		code: createCodeService({
			workspaceRoot,
			workspaceKind: () => context.discovery.workspace.kind,
		}),
	})

	// The context records any pre-bound selector as 'configured'; distinguish
	// the precedence level that supplied it so reports stay honest.
	if (context.selectionReason === 'configured') {
		context.selectionReason = options.app ? 'explicit' : preference ? 'preference' : 'configured'
	}

	return { context, client, preference, workspaceRoot }
}

/** Envelope `context` block — stable identity fields an agent can echo back. */
export function envelopeContext({ command, context, platform }) {
	const selection = context?.boundApp
		? { state: 'bound', appId: context.boundApp.id, reason: context.selectionReason }
		: undefined

	return {
		command,
		projectId: context?.boundApp?.id ?? null,
		...(platform ? { platform } : {}),
		...(selection ? { selection } : {}),
	}
}
