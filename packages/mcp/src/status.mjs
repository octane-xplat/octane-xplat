// Workspace context + project-status report builder. The context owns the
// discovery result, app selection, provider registry, policy store, session
// and job registries, and the evidence store — the seam every later package
// plugs into.

import {
	createCapabilityRegistry,
	createEvidenceStore,
	createJobRegistry,
	createPolicyStore,
	createSessionRegistry,
	PRODUCT_BOUNDARIES,
} from './contracts/index.mjs'

import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
	checkPrerequisites,
	detectGuidance,
	discoverWorkspace,
	resolveFrameworkBinding,
	selectApp,
} from './discovery.mjs'

export const SERVER_NAME = '@octane-xplat/mcp'
export const SERVER_VERSION = '0.0.0'

const NOT_PROVIDED = { state: 'not_provided' }

/**
 * options:
 *  - workspaceRoot (required)
 *  - appSelector: pre-configured app id/path/name
 *  - taskAuthorization: grant workspace + runtime-actions baseline
 *  - permissionScopes: extra bootstrap scopes (e.g. from XPLAT_MCP_PERMISSIONS)
 *  - evidenceRoot: override evidence directory
 *  - elicit: GrantElicitor wired to client elicitation
 *  - code: work-item-C code provider { status(app), search(args), read(args) }
 */
export function createWorkspaceContext(options) {
	const context = {
		workspaceRoot: options.workspaceRoot,
		configuredAppSelector: options.appSelector ?? null,
		discovery: discoverWorkspace(options.workspaceRoot),
		boundApp: null,
		selectionReason: null,
		capabilities: createCapabilityRegistry(),
		policy: createPolicyStore({
			taskAuthorization: options.taskAuthorization ?? true,
			grants: (options.permissionScopes ?? []).map((scope) => ({
				scope,
				state: 'granted',
				source: 'server-config',
			})),
			elicit: options.elicit,
		}),
		sessions: createSessionRegistry(),
		jobs: createJobRegistry(),
		evidence: createEvidenceStore({ root: options.evidenceRoot ?? defaultEvidenceRoot() }),
		// Slots for later packages: docs (B), code index (C), runtime (D), inspection (E), actions (G).
		docsStatus: () => NOT_PROVIDED,
		codeIndexStatus: () => NOT_PROVIDED,
		// Work item C supplies a code provider at composition time; without one
		// the search/read tools fail honestly instead of pretending.
		code: options.code ?? null,
	}

	if (context.code) {
		context.codeIndexStatus = (app) => context.code.status(app)
	}

	if (context.configuredAppSelector) {
		const matches = selectApp(context.discovery, context.configuredAppSelector)
		if (matches.length === 1) {
			context.boundApp = matches[0]
			context.selectionReason = 'configured'
		}
	}

	return context
}

function defaultEvidenceRoot() {
	return join(tmpdir(), `octane-xplat-mcp-${process.pid}-${Date.now().toString(36)}`)
}

const appSummary = (app) => `${app.id} (${app.name})`

// Workspace-root guidance always applies; the bound app's own files augment it.
function guidanceFor(workspaceRoot, app) {
	const sources = [...detectGuidance(workspaceRoot)]
	if (app.relativeRoot !== '.') {
		for (const source of detectGuidance(app.root)) {
			sources.push({ ...source, path: `${app.id}/${source.path}` })
		}
	}

	return sources
}

/**
 * Resolve the current selection: explicit/configured binding wins; a single
 * detected app binds as 'sole-app'; multiple apps stay ambiguous — the server
 * never silently picks.
 */
export function resolveSelection(context) {
	if (context.boundApp) {
		return { state: 'bound', app: context.boundApp, reason: context.selectionReason }
	}

	const { apps } = context.discovery
	if (context.configuredAppSelector) {
		return { state: 'ambiguous', candidates: context.discovery.apps }
	}

	if (apps.length === 0) {
		return { state: 'none', reason: 'no-apps' }
	}

	if (apps.length === 1) {
		return { state: 'bound', app: apps[0], reason: 'sole-app' }
	}

	return { state: 'ambiguous', candidates: apps }
}

export function bindApp(context, selector) {
	const matches = selectApp(context.discovery, selector)
	if (matches.length === 0) {
		return { error: 'not_found', candidates: context.discovery.apps }
	}

	if (matches.length > 1) {
		return { error: 'ambiguous_selection', candidates: matches }
	}

	context.boundApp = matches[0]
	context.selectionReason = 'explicit'
	return { app: matches[0] }
}

export async function buildProjectStatus(context) {
	const selection = resolveSelection(context)
	const boundApp = selection.state === 'bound' ? selection.app : null
	const declaredPlatforms = boundApp
		? boundApp.platforms
		: [...new Set(context.discovery.apps.flatMap((a) => a.platforms))]

	const report = {
		server: { name: SERVER_NAME, version: SERVER_VERSION },
		identity: {
			workspace: context.discovery.workspace,
			apps: context.discovery.apps,
			selection,
			framework: boundApp
				? resolveFrameworkBinding(context.discovery.workspace.root, boundApp.root)
				: null,
		},
		guidance: {
			sources: boundApp
				? guidanceFor(context.discovery.workspace.root, boundApp)
				: [
						...detectGuidance(context.discovery.workspace.root),
						...context.discovery.apps.flatMap((a) =>
							detectGuidance(a.root).map((s) => ({ ...s, path: `${a.id}/${s.path}` })),
						),
					],
		},
		docs: context.docsStatus(boundApp),
		codeIndex: context.codeIndexStatus(boundApp),
		prerequisites: checkPrerequisites(declaredPlatforms),
		capabilities: await context.capabilities.matrixFor(boundApp, declaredPlatforms),
		permissions: context.policy.list(),
		boundaries: PRODUCT_BOUNDARIES,
		nextSteps: [],
	}

	report.nextSteps = nextSteps(report)
	return report
}

function nextSteps(report) {
	const steps = []
	const selection = report.identity.selection

	if (selection.state === 'none') {
		steps.push(
			'No Octane Xplat app was detected in this workspace. Restart the server with --workspace pointing at a directory containing an Octane Xplat app.',
		)

		return steps
	}

	if (selection.state === 'ambiguous') {
		steps.push(
			`Multiple apps detected: ${selection.candidates.map(appSummary).join(', ')}. ` +
				'Ask the developer which one to use, then call xplat_select_app with its id. The server never picks silently.',
		)

		return steps
	}

	const missing = report.prerequisites.filter((p) => p.status === 'missing')
	if (missing.length) {
		steps.push(
			`Missing prerequisites: ${missing.map((p) => `${p.name} — ${p.remedy}`).join('; ')}.`,
		)
	}

	steps.push(
		'Call xplat_capability_matrix for per-platform support before promising a runtime check.',
		'Bind or attach a session (xplat_sessions) before runtime work; an explicit app+target binding is required.',
	)

	return steps
}
