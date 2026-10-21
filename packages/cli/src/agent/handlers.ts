// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Agent command handlers — each projects the same service call the matching
// MCP tool makes, so payloads, error codes, and recovery meanings are
// identical across transports. Nothing here reimplements service semantics.
import { contractError, toContractError } from '../mcp/contracts/errors.ts'
import { bindApp, buildProjectStatus, resolveSelection } from '../mcp/status.ts'
import { catalogPayload } from './catalog.ts'
import { callHost, NO_HOST } from './host-client.ts'
import { writePreference } from './selection.ts'
import { retainedDiagnostics, validateDiagnosticsSelection } from '../diagnostics.ts'

const ok = (data) => ({ ok: true, data })
const fail = (error) => ({ ok: false, error })

const SELECT_APP_HINT = '`xplat app select` (CLI) or xplat_select_app (MCP)'

// The app id the invoking invocation resolved — the host rebinds it per
// request, so service selection semantics match the MCP transport.
const boundAppId = (context) => {
	const selection = resolveSelection(context)
	return selection.state === 'bound' ? selection.app.id : null
}

// Commands that reference a specific session/job/evidence id get not_found
// when no host exists — nothing anywhere owns that state.
const NO_STATE_HOST = () =>
	contractError(
		'not_found',
		'No agent runtime host is running — no sessions, jobs, or evidence exist for this workspace.',
		{
			recovery: {
				action:
					'Start work with `xplat session start` or `xplat runtime build`; state lives only while a host owns it.',
			},
		},
	)

/**
 * Route one service call through the agent runtime host. `spawn` marks
 * state-creating commands; `absent` lets list commands answer honestly when
 * nothing is running. Host results carry the service return verbatim — a
 * service-level `error` field maps to a failed envelope, matching the MCP
 * tool adapters.
 */
const hostCall = async (env, method, params, { spawn = false, absent } = {}) => {
	const reply = await callHost(env.workspaceRoot, method, params, {
		appId: boundAppId(env.context),
		grants: env.grants,
		spawn,
	})

	if (reply === NO_HOST) {
		return absent ? absent() : fail(NO_STATE_HOST())
	}

	if (!reply.ok) {
		return fail(reply.error)
	}

	const result = reply.result
	if (result?.error) {
		return fail(result.error)
	}

	return ok(absent ? { ...result, host: { state: 'live', pid: reply.host.pid } } : result)
}

const requireFlag = (value, flag, hint) =>
	value === undefined || value === null
		? fail(
				contractError('invalid_selection', `Pass ${flag}${hint ? ` — ${hint}` : ''}.`, {
					recovery: { action: 'Run the command with --help or --schema for its contract.' },
				}),
			)
		: null

const controlArg = (args) => {
	if (args.id !== undefined && args.testID !== undefined) {
		return {
			error: contractError('invalid_selection', 'Pass --id or --testid, not both.'),
		}
	}

	if (args.id === undefined && args.testID === undefined) {
		return null
	}

	return { kind: args.id !== undefined ? 'id' : 'testID', name: args.id ?? args.testID }
}

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
				contractError(
					'invalid_selection',
					'Pass --ref from docs search, or --package with --path.',
					{
						recovery: { action: 'Run `xplat docs search` to get a versioned ref.' },
					},
				),
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

	async 'runtime build'(env, args) {
		const missing = requireFlag(
			args.platform,
			'--platform',
			'one of web, ios, android, macos, linux, windows',
		)

		if (missing) {
			return missing
		}

		return hostCall(
			env,
			'runtime.build',
			{
				platform: args.platform,
				requestKey: args.requestKey,
			},
			{ spawn: true },
		)
	},

	async 'session start'(env, args) {
		return hostCall(
			env,
			'runtime.launch',
			{ target: args.target, requestKey: args.requestKey, browserMode: args.browserMode },
			{ spawn: true },
		)
	},

	async 'session attach'(env, args) {
		const missing = requireFlag(
			args.platform,
			'--platform',
			'one of web, ios, android, macos, linux, windows',
		)

		if (missing) {
			return missing
		}

		return hostCall(
			env,
			'runtime.attach',
			{
				platform: args.platform,
				targetId: args.targetId,
			},
			{ spawn: true },
		)
	},

	async 'session list'({ context }) {
		return ok(context.runtime.listSessions())
	},
	async 'session status'({ context }, args) {
		const result = context.runtime.sessionStatus(args.sessionId)
		return result.error ? fail(result.error) : ok(result)
	},
	async 'session end'({ context }, args) {
		try {
			const result = await context.runtime.endSession(args.sessionId)
			return result.error ? fail(result.error) : ok({ result })
		} catch (error) {
			return fail(toContractError(error))
		}
	},

	async 'job status'(env, args) {
		return hostCall(env, 'jobs.status', { jobId: args.jobId })
	},

	async 'job cancel'(env, args) {
		return hostCall(env, 'jobs.cancel', { jobId: args.jobId })
	},

	async diagnostics(env, args) {
		try {
			validateDiagnosticsSelection(args)
			if (!args.jobId) {
				const selection = resolveSelection(env.context)
				if (selection.state !== 'bound') {
					return fail(
						contractError(
							selection.state === 'ambiguous' ? 'ambiguous_selection' : 'invalid_selection',
							'Retained diagnostics require a bound app. Pass --app or run from the app directory.',
						),
					)
				}
				return ok(await retainedDiagnostics(selection.app.root, args))
			}
			return hostCall(env, 'runtime.readDiagnostics', args)
		} catch (error) {
			return fail(toContractError(error))
		}
	},

	async inspect(env, args) {
		const control = controlArg(args)
		if (control?.error) {
			return fail(control.error)
		}

		return hostCall(env, 'inspection.inspect', {
			sessionId: args.sessionId,
			control: control ?? undefined,
			offset: args.offset,
			limit: args.limit,
		})
	},

	async interact(env, args) {
		for (const missing of [
			requireFlag(args.documentId, '--document', 'the documentId from `xplat inspect`'),
			requireFlag(args.mechanism, '--mechanism', 'dom-event or os-input'),
		]) {
			if (missing) {
				return missing
			}
		}

		const control = controlArg(args)
		if (control?.error) {
			return fail(control.error)
		}

		if (!control) {
			return fail(
				contractError('invalid_selection', 'Pass --id or --testid to pick one control.', {
					recovery: { action: 'Run `xplat inspect` first to find a stable control name.' },
				}),
			)
		}

		return hostCall(env, 'inspection.interact', {
			sessionId: args.sessionId,
			documentId: args.documentId,
			control,
			mechanism: args.mechanism,
			key: args.key,
		})
	},

	async capture(env, args) {
		return hostCall(env, 'inspection.screenshot', { sessionId: args.sessionId })
	},

	async 'evidence list'(env, args) {
		return hostCall(
			env,
			'evidence.list',
			{ kind: args.kind },
			{
				absent: () => ok({ evidence: [], host: { state: 'absent' } }),
			},
		)
	},

	async 'evidence retain'(env, args) {
		return hostCall(env, 'evidence.retain', { id: args.id, expiresAt: args.expiresAt })
	},

	async 'evidence delete'(env, args) {
		return hostCall(env, 'evidence.delete', { id: args.id })
	},

	async 'actions list'({ context }) {
		// The dev-action registry derives from on-disk bridge session files —
		// every list refreshes, so this journey needs no running host.
		const selection = resolveSelection(context)
		if (selection.state !== 'bound') {
			return fail(
				contractError(
					selection.state === 'ambiguous' ? 'ambiguous_selection' : 'invalid_selection',
					'No app is bound.',
					{ recovery: { action: `Bind an app first — ${SELECT_APP_HINT}.` } },
				),
			)
		}

		try {
			return ok(await context.devActions.list(selection.app))
		} catch (error) {
			return fail(toContractError(error))
		}
	},

	async 'actions invoke'(env, args) {
		const missing = requireFlag(args.actionId, '--action', 'an action id from `xplat actions list`')
		if (missing) {
			return missing
		}

		let input
		if (args.input !== undefined) {
			try {
				input = JSON.parse(args.input)
			} catch {
				return fail(
					contractError('invalid_selection', '--input must be a JSON object.', {
						recovery: { action: 'Match the declared input contract from `xplat actions list`.' },
					}),
				)
			}

			if (typeof input !== 'object' || input === null || Array.isArray(input)) {
				return fail(contractError('invalid_selection', '--input must be a JSON object.'))
			}
		}

		return hostCall(
			env,
			'devActions.invoke',
			{
				appInstanceId: args.appInstanceId,
				actionId: args.actionId,
				input: input ?? {},
				registryRevision: args.registryRevision,
				requestKey: args.requestKey,
			},
			{ spawn: true },
		)
	},

	async 'actions status'(env, args) {
		return hostCall(env, 'devActions.describeJob', { jobId: args.jobId })
	},
}
