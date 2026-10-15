#!/usr/bin/env node
// Agent runtime host — the persistent process behind the CLI's session,
// job, log, inspection, action, and evidence commands. `xplat` invocations
// are one-shot; a session's dev server, browser, log buffers, and job
// registry need an owner that outlives the caller. This host runs the same
// workspace context and services the MCP server composes, fronted by a
// token-gated NDJSON socket — a third transport over one implementation.
//
// Spawned lazily by host-client.mjs (never by the user). One host per
// workspace root; the descriptor it writes at <agent-dir>/host.json is how
// later invocations find it. While any non-stopped session or live job
// exists the host stays up; once nothing is live it exits after an idle
// grace so bounded job/log/evidence history remains briefly reachable.
// Shutdown is ownership-safe: endAll() releases owned sessions and
// closeSession() deletes session-scoped evidence — the MCP server's
// teardown contract, not a lighter copy.

import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { join } from 'node:path'
import { contractError, toContractError } from '../mcp/contracts/errors.mjs'
import { PERMISSION_SCOPES } from '../mcp/contracts/policy.mjs'
import { discoverWorkspace } from '../mcp/discovery.mjs'
import { createWorkspaceContext } from '../mcp/status.mjs'
import { cliServerIdentity } from './identity.mjs'

const arg = (name) => {
	const index = process.argv.indexOf(`--${name}`)
	return index >= 0 ? process.argv[index + 1] : undefined
}

const workspaceRoot = arg('workspace')
const agentDir = arg('agent-dir')
const socketPath = arg('socket')
const descriptorPath = arg('descriptor')
if (!workspaceRoot || !agentDir || !socketPath || !descriptorPath) {
	process.stderr.write(
		'xplat agent host requires --workspace, --agent-dir, --socket, --descriptor\n',
	)

	process.exit(2)
}

const IDLE_MS = Math.max(
	250,
	Number(process.env.XPLAT_AGENT_HOST_IDLE_MS ?? 120_000) || 120_000,
)

const token = randomUUID()
const startedAt = new Date().toISOString()

const context = createWorkspaceContext({
	workspaceRoot,
	serverIdentity: cliServerIdentity(),
	evidenceRoot: join(agentDir, 'evidence'),
})

const NO_APP = () =>
	contractError('invalid_selection', 'No app is bound.', {
		recovery: { action: 'Bind an app first — `xplat app select` (CLI) or xplat_select_app (MCP).' },
	})

const METHODS = {
	'host.ping': () => ({
		identity: context.serverIdentity,
		pid: process.pid,
		startedAt,
		workspaceRoot,
	}),

	'runtime.build': (params) => context.runtime.build(params),
	'runtime.launch': (params) => context.runtime.launch(params),
	'runtime.attach': (params) => context.runtime.attach(params),
	'runtime.readLogs': (params) => context.runtime.readLogs(params),

	async 'session.end'(params) {
		const usable = context.sessions.requireUsable(params.sessionId)
		if (!usable.usable && usable.error.code === 'not_found') {
			return { error: usable.error }
		}

		return { result: await context.runtime.endSession(params.sessionId) }
	},

	'sessions.list': () => ({ sessions: context.sessions.list() }),

	'sessions.get': (params) => {
		const session = context.sessions.get(params.sessionId)
		return session
			? { session }
			: {
					error: contractError('not_found', `No session "${params.sessionId}".`, {
						recovery: { action: 'List current sessions with `xplat session list`.' },
					}),
				}
	},

	'jobs.status': (params) => {
		const job = context.jobs.status(params.jobId)
		return job
			? { job }
			: {
					error: contractError('not_found', `No job "${params.jobId}".`, {
						recovery: { action: 'Start a job first; finished history is bounded.' },
					}),
				}
	},

	'jobs.cancel': (params) => {
		const job = context.jobs.cancel(params.jobId)
		return job
			? { job }
			: { error: contractError('not_found', `No job "${params.jobId}".`) }
	},

	'inspection.inspect': (params) => context.inspection.inspect(params),
	'inspection.interact': (params) => context.inspection.interact(params),
	'inspection.screenshot': (params) => context.inspection.screenshot(params),

	'evidence.list': (params) => ({ evidence: context.evidence.list({ kind: params.kind }) }),
	'evidence.retain': (params) =>
		context.evidence.retain(params.id, { expiresAt: params.expiresAt ?? null }),
	'evidence.delete': (params) => context.evidence.delete(params.id),

	'devActions.invoke': (params) => {
		if (!context.boundApp) {
			return { error: NO_APP() }
		}

		return context.devActions.invoke(context.boundApp, params)
	},

	'devActions.describeJob': (params) => {
		const described = context.devActions.describeJob(params.jobId)
		if (!described) {
			return {
				error: contractError('not_found', `No job "${params.jobId}".`, {
					recovery: { action: 'Invoke an action first; finished history is bounded.' },
				}),
			}
		}

		if (described.job.kind !== 'dev-action') {
			return {
				error: contractError(
					'invalid_selection',
					`Job "${params.jobId}" is a ${described.job.kind} job, not a dev-action invocation.`,
					{ recovery: { action: 'Use `xplat job status` for other job kinds.' } },
				),
			}
		}

		return described
	},

	async 'host.shutdown'() {
		setTimeout(() => void shutdown('requested'), 25).unref()
		return { ending: true }
	},
}

/** The invoking command's resolved app, rebound per request like bindApp. */
const bindRequestApp = async (appId) => {
	if (!appId) {
		context.boundApp = null
		context.selectionReason = null
		return
	}

	let app = context.discovery.apps.find((candidate) => candidate.id === appId)
	if (!app) {
		// The app may have been created after the host started — one refresh
		// keeps a fresh binding resolvable without rescanning per call.
		context.discovery = discoverWorkspace(workspaceRoot)
		app = context.discovery.apps.find((candidate) => candidate.id === appId)
	}

	context.boundApp = app ?? null
	context.selectionReason = app ? 'explicit' : null
}

const hasLiveWork = () =>
	context.sessions.list().some((session) => session.state !== 'stopped') ||
	context.jobs
		.list()
		.some((job) => ['queued', 'running', 'cancelling'].includes(job.state))

let idleTimer = null
const armIdle = () => {
	if (idleTimer) {
		clearTimeout(idleTimer)
		idleTimer = null
	}

	// Live sessions/jobs keep the host up; an idle timer only starts once
	// nothing is live, and each request resets it — an actively polling
	// client is itself the reason the host exists.
	if (!hasLiveWork()) {
		idleTimer = setTimeout(() => void shutdown('idle'), IDLE_MS)
		idleTimer.unref()
	}
}

let closing = false
const shutdown = async (reason) => {
	if (closing) {
		return
	}

	closing = true
	try {
		await context.runtime.endAll()
		context.evidence.closeSession()
	} catch (error) {
		process.stderr.write(`xplat agent host: shutdown cleanup failed: ${error?.message ?? error}\n`)
	} finally {
		server.close()
		rmSync(descriptorPath, { force: true })
		if (process.platform !== 'win32') {
			rmSync(socketPath, { force: true })
		}

		process.stderr.write(`xplat agent host: exiting (${reason})\n`)
		process.exit(0)
	}
}

const handle = async (line) => {
	let request
	try {
		request = JSON.parse(line)
	} catch {
		return { ok: false, error: contractError('invalid_selection', 'Malformed request line.') }
	}

	if (request.token !== token || typeof METHODS[request.method] !== 'function') {
		return {
			ok: false,
			error: contractError(
				request.token === token ? 'invalid_selection' : 'permission_denied',
				request.token === token
					? `Unknown host method "${request.method}".`
					: 'The request did not carry this host\u2019s token.',
			),
		}
	}

	try {
		// Task-grant semantics mirror the MCP server's bootstrap scopes: a
		// scope granted on one invocation stays granted for the host's life.
		for (const scope of request.grants ?? []) {
			if (PERMISSION_SCOPES.includes(scope)) {
				context.policy.grant(scope, { source: 'cli-invocation' })
			}
		}

		await bindRequestApp(request.appId ?? null)
		return { ok: true, result: await METHODS[request.method](request.params ?? {}) }
	} catch (error) {
		return { ok: false, error: toContractError(error) }
	} finally {
		armIdle()
	}
}

mkdirSync(agentDir, { recursive: true })
// A crashed predecessor can leave its socket file behind; an existing live
// listener keeps its bound socket, so removing the path only helps.
if (process.platform !== 'win32' && existsSync(socketPath)) {
	rmSync(socketPath, { force: true })
}

const server = createServer((socket) => {
	let pending = ''
	socket.on('data', (chunk) => {
		pending += chunk.toString('utf8')
		const lines = pending.split('\n')
		pending = lines.pop()
		for (const line of lines) {
			if (!line.trim()) {
				continue
			}

			void handle(line).then((response) => {
				socket.write(`${JSON.stringify(response)}\n`)
				socket.end()
			})
		}
	})

	socket.on('error', () => {})
})

server.listen(socketPath, () => {
	// The descriptor is the discovery contract — written only after the
	// socket answers, atomically, readable by the owning user.
	const descriptor = {
		version: 1,
		pid: process.pid,
		socketPath,
		token,
		workspaceRoot,
		identity: context.serverIdentity,
		startedAt,
	}

	const tmp = `${descriptorPath}.tmp-${process.pid}`
	writeFileSync(tmp, `${JSON.stringify(descriptor, null, '\t')}\n`, { mode: 0o600 })
	renameSync(tmp, descriptorPath)
	armIdle()
})

server.on('error', (error) => {
	process.stderr.write(`xplat agent host: listen failed on ${socketPath}: ${error.message}\n`)
	process.exit(1)
})

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
