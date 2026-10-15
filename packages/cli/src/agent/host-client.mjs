// Agent runtime host client — finds, spawns, and talks to the per-workspace
// host process (host.mjs) that owns sessions, jobs, logs, inspection state,
// dev-action invocations, and evidence across one-shot `xplat` invocations.
//
// Commands that CREATE state spawn the host on demand (spawn: true);
// commands that only READ existing state connect when a live descriptor
// exists and otherwise answer honestly (empty lists, not_found) — a read
// never leaves a daemon behind.
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, openSync, readFileSync, rmSync } from 'node:fs'
import { connect } from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { contractError, toContractError } from '../mcp/contracts/errors.mjs'
import { agentDir } from './selection.mjs'

const HOST_ENTRY = fileURLToPath(new URL('./host.mjs', import.meta.url))

/** Returned when no live host owns this workspace's runtime state. */
export const NO_HOST = Symbol('xplat.agent.noHost')

const hostKey = (workspaceRoot) =>
	createHash('sha256').update(resolve(workspaceRoot)).digest('hex').slice(0, 12)

export const descriptorPathFor = (workspaceRoot) => join(agentDir(workspaceRoot), 'host.json')

// Unix socket paths cap near 104 bytes — keep the socket in tmpdir under a
// workspace hash rather than inside a possibly deep project path. Windows
// uses a named pipe through the same net API.
const socketPathFor = (workspaceRoot) =>
	process.platform === 'win32'
		? `\\\\.\\pipe\\xplat-agent-${hostKey(workspaceRoot)}`
		: join(tmpdir(), `xplat-agent-${hostKey(workspaceRoot)}.sock`)

const readDescriptor = (workspaceRoot) => {
	try {
		const parsed = JSON.parse(readFileSync(descriptorPathFor(workspaceRoot), 'utf8'))
		return parsed?.version === 1 && parsed.token ? parsed : null
	} catch {
		return null
	}
}

const pidAlive = (pid) => {
	try {
		process.kill(pid, 0)
		return true
	} catch (error) {
		return error?.code === 'EPERM'
	}
}

/** One NDJSON request/response on a fresh connection. */
const send = (socketPath, payload, { connectMs = 1500, readMs = 60000 } = {}) =>
	new Promise((resolveRequest) => {
		const socket = connect(socketPath)
		let pending = ''
		let settled = false
		const finish = (value) => {
			if (!settled) {
				settled = true
				clearTimeout(timer)
				socket.destroy()
				resolveRequest(value)
			}
		}

		const fail = () =>
			finish({
				ok: false,
				error: contractError('disconnected_runtime', 'The agent runtime host did not answer.', {
					retryable: true,
				}),
			})

		const timer = setTimeout(
			() =>
				finish({
					ok: false,
					error: contractError('timeout', 'The agent runtime host did not respond in time.', {
						retryable: true,
					}),
				}),
			readMs,
		)

		socket.setTimeout(connectMs, fail)
		socket.on('connect', () => {
			socket.setTimeout(0)
			socket.write(`${JSON.stringify(payload)}\n`)
		})

		socket.on('data', (chunk) => {
			pending += chunk.toString('utf8')
			const end = pending.indexOf('\n')
			if (end < 0) {
				return
			}

			try {
				finish({ ok: true, response: JSON.parse(pending.slice(0, end)) })
			} catch {
				finish({
					ok: false,
					error: contractError('execution_failure', 'The agent runtime host sent a malformed reply.'),
				})
			}
		})

		socket.on('error', fail)
		socket.on('end', fail)
	})

const ping = async (descriptor) => {
	const reply = await send(descriptor.socketPath, {
		token: descriptor.token,
		method: 'host.ping',
		params: {},
	})

	return reply.ok && reply.response?.ok ? reply.response.result : null
}

/**
 * Connect to the workspace's live host, if any. A stale descriptor (dead
 * pid, unanswered socket) is removed and treated as absence.
 */
export async function connectHost(workspaceRoot) {
	const descriptor = readDescriptor(workspaceRoot)
	if (!descriptor || !pidAlive(descriptor.pid)) {
		return null
	}

	const identity = await ping(descriptor)
	if (!identity) {
		rmSync(descriptorPathFor(workspaceRoot), { force: true })
		return null
	}

	return {
		pid: descriptor.pid,
		identity,
		call: (method, params, meta = {}) =>
			send(descriptor.socketPath, { token: descriptor.token, method, params, ...meta }).then(
				(reply) => (reply.ok ? reply.response : reply),
			),
	}
}

/** Connect to the live host, spawning one when none answers. */
export async function ensureHost(workspaceRoot, { spawnImpl = spawn } = {}) {
	const live = await connectHost(workspaceRoot)
	if (live) {
		return live
	}

	const dir = agentDir(workspaceRoot)
	mkdirSync(dir, { recursive: true })
	const descriptor = descriptorPathFor(workspaceRoot)
	rmSync(descriptor, { force: true })

	const log = openSync(join(dir, 'host.log'), 'a')
	const child = spawnImpl(
		process.execPath,
		[
			HOST_ENTRY,
			'--workspace',
			resolve(workspaceRoot),
			'--agent-dir',
			dir,
			'--socket',
			socketPathFor(workspaceRoot),
			'--descriptor',
			descriptor,
		],
		{
			cwd: resolve(workspaceRoot),
			detached: true,
			stdio: ['ignore', log, log],
			windowsHide: true,
		},
	)

	child.unref()

	let exited = false
	child.once('exit', () => {
		exited = true
	})

	child.once('error', () => {
		exited = true
	})

	// The host writes its descriptor only after the socket listens.
	const deadline = Date.now() + 8000
	while (Date.now() < deadline) {
		const fresh = readDescriptor(workspaceRoot)
		if (fresh?.pid === child.pid) {
			const host = await connectHost(workspaceRoot)
			if (host) {
				return host
			}
		}

		if (exited) {
			break
		}

		await new Promise((resolve) => setTimeout(resolve, 60))
	}

	return {
		error: contractError(
			'execution_failure',
			'The agent runtime host did not start — its own log may say why.',
			{
				retryable: true,
				context: { log: join(dir, 'host.log') },
				recovery: { action: 'Check the host log for the startup failure.' },
			},
		),
	}
}

/**
 * Route one service call through the host. With `spawn`, a missing host is
 * started (state-creating commands); without it, absence reports NO_HOST so
 * the caller can answer honestly for its shape.
 */
export async function callHost(workspaceRoot, method, params, { appId, grants, spawn = false } = {}) {
	try {
		const host = spawn ? await ensureHost(workspaceRoot) : await connectHost(workspaceRoot)
		if (!host) {
			return NO_HOST
		}

		if (host.error) {
			return { ok: false, error: host.error }
		}

		const reply = await host.call(method, params, { appId, grants })
		return { ...reply, host: { pid: host.pid } }
	} catch (error) {
		return { ok: false, error: toContractError(error) }
	}
}

/** Test/maintenance hook: stop the workspace's host if one is running. */
export const stopHost = async (workspaceRoot) => {
	const host = await connectHost(workspaceRoot)
	if (!host) {
		return false
	}

	await host.call('host.shutdown', {})
	return true
}
