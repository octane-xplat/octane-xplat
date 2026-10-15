// Agent command handlers — each projects the same service call the matching
// MCP tool makes, so payloads, error codes, and recovery meanings are
// identical across transports. Nothing here reimplements service semantics.
import { contractError, toContractError } from '../mcp/contracts/errors.mjs'
import { bindApp, buildProjectStatus, resolveSelection } from '../mcp/status.mjs'
import { catalogPayload } from './catalog.mjs'
import { writePreference } from './selection.mjs'

const ok = (data) => ({ ok: true, data })
const fail = (error) => ({ ok: false, error })

const SELECT_APP_HINT = '`xplat app select` (CLI) or xplat_select_app (MCP)'

// Same wrapper the MCP docs tools use: workspace grant → bound app → service.
const docsCall = async (context, method, args) => {
	const permission = context.policy.require('workspace')
	if (!permission.granted) {
		return fail(permission.error)
	}

	const selection = resolveSelection(context)
	if (selection.state !== 'bound') {
		return fail(
			contractError(
				selection.state === 'ambiguous' ? 'ambiguous_selection' : 'invalid_selection',
				'Bind an app before retrieving docs.',
				{ recovery: { action: `Bind an app first — ${SELECT_APP_HINT}.` } },
			),
		)
	}

	try {
		return ok(await context.docs.serviceFor(selection.app)[method](args))
	} catch (error) {
		return fail(toContractError(error))
	}
}

// The bound-app rule from the MCP code tools: ambiguous fails, 'none' stays
// usable for framework-repo workspaces (framework corpus needs no bound app).
const codeBinding = (context) => {
	const selection = resolveSelection(context)
	if (selection.state === 'ambiguous') {
		return {
			error: contractError(
				'ambiguous_selection',
				'Several apps are detected — code retrieval targets the bound app and its installed packages, never a guessed one.',
				{
					recovery: { action: `Bind an app first — ${SELECT_APP_HINT}.` },
					context: { candidates: selection.candidates.map((a) => a.id) },
				},
			),
		}
	}

	return { app: selection.state === 'bound' ? selection.app : null }
}

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

const codeCall = async (context, method, args) => {
	const permission = context.policy.require('workspace')
	if (!permission.granted) {
		return fail(permission.error)
	}

	const { app, error } = codeBinding(context)
	if (error) {
		return fail(error)
	}

	try {
		return codeResult(
			context.code[method]({
				app,
				workspaceKind: context.discovery.workspace.kind,
				...args,
			}),
		)
	} catch (value) {
		return fail(toContractError(value))
	}
}

export const handlers = {
	async catalog() {
		return ok(catalogPayload())
	},

	async status({ context }) {
		// --refresh is implicit: a CLI invocation always discovers fresh.
		return ok(await buildProjectStatus(context))
	},

	async 'app select'({ context, workspaceRoot, client }, args) {
		const result = bindApp(context, args.selector)
		if (result.error) {
			if (result.error === 'ambiguous_selection') {
				return fail(
					contractError('ambiguous_selection', `"${args.selector}" matches several apps.`, {
						recovery: { action: 'Pass an exact app id from the candidates.' },
						context: { candidates: result.candidates },
					}),
				)
			}

			return fail(
				contractError('invalid_selection', `No app matches "${args.selector}".`, {
					recovery: { action: 'Pick an id from candidates, or check the workspace root.' },
					context: { candidates: result.candidates },
				}),
			)
		}

		const path = writePreference(workspaceRoot, client, result.app)
		return ok({
			bound: result.app,
			reason: 'explicit',
			preference: { client, path },
		})
	},

	async capabilities({ context }, args) {
		const status = await buildProjectStatus(context)
		const matrices = args.platform
			? status.capabilities.filter((m) => m.platform === args.platform)
			: status.capabilities

		return ok({ capabilities: matrices })
	},

	async permissions({ context }, args) {
		const grants = context.policy.list()
		if (!args.scope) {
			return ok({ grants })
		}

		const grant = grants.find((g) => g.scope === args.scope)
		const check = context.policy.require(args.scope)
		return ok({
			grant,
			check: check.granted ? { granted: true } : { granted: false, error: check.error },
		})
	},

	async targets({ context }, args) {
		const result = await context.runtime.listTargets({ platform: args.platform })
		return result.error ? fail(result.error) : ok(result)
	},

	async 'docs search'({ context }, args) {
		return docsCall(context, 'search', {
			query: args.query,
			package: args.package,
			version: args.version,
			platform: args.platform,
			corpus: args.corpus,
			limit: args.limit,
		})
	},

	async 'docs read'({ context }, args) {
		if (!args.ref && !(args.package && args.path)) {
			return fail(
				contractError('invalid_selection', 'Pass --ref from docs search, or --package with --path.', {
					recovery: { action: 'Run `xplat docs search` to get a versioned ref.' },
				}),
			)
		}

		return docsCall(context, 'read', {
			ref: args.ref,
			package: args.package,
			path: args.path,
			version: args.version,
			offset: args.offset,
			limit: args.limit,
		})
	},

	async guidance({ context }) {
		return docsCall(context, 'guidance', {})
	},

	async 'code search'({ context }, args) {
		return codeCall(context, 'search', {
			query: args.query,
			mode: args.mode,
			corpus: args.corpus,
			platform: args.platform,
			package: args.package,
			limit: args.limit,
		})
	},

	async 'code read'({ context }, args) {
		return codeCall(context, 'read', {
			ref: args.ref,
			corpus: args.corpus,
			package: args.package,
			path: args.path,
			offset: args.offset,
			limit: args.limit,
		})
	},
}
