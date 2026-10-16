// xplatDevBridge — development-action bridge, a dev-server middleware plugin.
//
// This is the rendezvous between a running dev app and the MCP server
// (package G of the MCP design). The app pushes registry announcements and
// polls for invocations; the MCP server polls the registry and dispatches
// calls — no websockets, no action-specific wiring.
//
//   POST /__xplat_dev__/registry      app → announce registry snapshot
//   GET  /__xplat_dev__/registry      agent → live announcements
//   POST /__xplat_dev__/invoke        agent → queue an invocation
//   GET  /__xplat_dev__/poll          app → long-poll work + cancellations
//   GET  /__xplat_dev__/invoke/<id>   agent → long-poll an outcome
//   POST /__xplat_dev__/result        app → post an invocation outcome
//   POST /__xplat_dev__/invoke/cancel agent → cooperative cancel request
//
// Trust boundary: the plugin generates a per-server token at startup. The app
// receives it through a dev-only `__XPLAT_DEV_BRIDGE__` bundler define; the
// MCP server reads it from the same-uid session file under
// node_modules/.cache/xplat/dev-bridge/. Every endpoint requires the token —
// local reachability alone is not authorization.
//
// apply:'serve' keeps the whole channel out of production builds: the define
// is never injected, no middleware exists, and an app-side startDevActionBridge
// finds no endpoint and stays inert.

import { randomBytes, randomUUID } from 'node:crypto'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PREFIX = '/__xplat_dev__'
const MAX_BODY = 1024 * 1024
const INSTANCE_TTL_MS = 60_000
const MAX_WAIT_MS = 30_000

const json = (res, status, body) => {
	res.statusCode = status
	res.setHeader('content-type', 'application/json')
	res.end(JSON.stringify(body))
}

const readBody = (req) =>
	new Promise((resolve, reject) => {
		const chunks = []
		let size = 0
		req.on('data', (chunk) => {
			size += chunk.length
			if (size > MAX_BODY) {
				reject(new Error('body too large'))
				req.destroy()
				return
			}

			chunks.push(chunk)
		})

		req.on('end', () => {
			try {
				resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {})
			} catch {
				reject(new Error('invalid JSON body'))
			}
		})

		req.on('error', reject)
	})

/**
 * Vite plugin. `options.appRoot` defaults to the vite root — the session file
 * always lands under <app>/node_modules/.cache/xplat/dev-bridge/ where the
 * MCP server scans the bound app.
 */
export function xplatDevBridge(options = {}) {
	const token = randomBytes(24).toString('hex')
	const serverId = `srv_${randomUUID()}`
	const startedAt = new Date().toISOString()

	// appInstanceId → { announcement, at }
	const instances = new Map()
	// requestId → { request, state: 'pending'|'delivered', cancelRequested, outcome, waiters }
	const requests = new Map()

	const prune = () => {
		const now = Date.now()
		for (const [id, entry] of instances) {
			if (now - entry.at > INSTANCE_TTL_MS * 10) {
				instances.delete(id)
			}
		}

		for (const [id, entry] of requests) {
			if (entry.outcome && now - entry.completedAt > INSTANCE_TTL_MS * 10) {
				requests.delete(id)
			}
		}
	}

	const authorized = (req) => req.headers['x-xplat-dev-token'] === token
	const unauthorized = (res) =>
		json(res, 401, {
			error: { code: 'unauthorized', message: 'missing or invalid dev-bridge token' },
		})

	const freshInstances = () => {
		const now = Date.now()
		return [...instances.entries()]
			.filter(([, entry]) => now - entry.at <= INSTANCE_TTL_MS)
			.map(([id, entry]) => ({ ...entry.announcement, appInstanceId: id }))
	}

	// requestId → resolve() — long-poll waiters for outcomes
	const outcomeWaiters = new Map()
	const settleOutcome = (requestId) => {
		for (const resolve of outcomeWaiters.get(requestId) ?? []) {
			resolve()
		}

		outcomeWaiters.delete(requestId)
	}

	const awaitOutcome = (requestId, ms) =>
		new Promise((resolve) => {
			const timer = setTimeout(resolve, Math.min(ms, MAX_WAIT_MS))
			const done = () => {
				clearTimeout(timer)
				resolve()
			}

			outcomeWaiters.set(requestId, [...(outcomeWaiters.get(requestId) ?? []), done])
		})

	// instanceId → resolve() — long-poll waiters for work
	const pollWaiters = new Map()
	const wakePollers = (instanceId) => {
		for (const resolve of pollWaiters.get(instanceId) ?? []) {
			resolve()
		}

		pollWaiters.delete(instanceId)
	}

	const awaitWork = (instanceId, ms) =>
		new Promise((resolve) => {
			const timer = setTimeout(resolve, Math.min(ms, MAX_WAIT_MS))
			const done = () => {
				clearTimeout(timer)
				resolve()
			}

			pollWaiters.set(instanceId, [...(pollWaiters.get(instanceId) ?? []), done])
		})

	const workFor = (instanceId) => {
		const invocations = []
		const cancel = []
		for (const [requestId, entry] of requests) {
			if (entry.request.appInstanceId !== instanceId) {
				continue
			}

			if (entry.state === 'pending') {
				entry.state = 'delivered'
				invocations.push({ requestId, ...entry.request })
			}

			if (entry.cancelRequested && !entry.outcome) {
				cancel.push(requestId)
			}
		}

		return { invocations, cancel }
	}

	const routes = {
		'POST /registry': async (req, res) => {
			const body = await readBody(req)
			if (
				body?.protocol !== 'xplat-dev-actions' ||
				typeof body.appInstanceId !== 'string' ||
				typeof body.revision !== 'number' ||
				!Array.isArray(body.actions)
			) {
				return json(res, 400, {
					error: { code: 'invalid_selection', message: 'malformed registry announcement' },
				})
			}

			instances.set(body.appInstanceId, { announcement: body, at: Date.now() })
			prune()
			return json(res, 200, { accepted: true, serverId })
		},
		'GET /registry': async (_req, res) =>
			json(res, 200, { serverId, startedAt, instances: freshInstances() }),
		'POST /invoke': async (req, res) => {
			const body = await readBody(req)
			const { requestId, appInstanceId, actionId, registryRevision } = body ?? {}
			if (
				typeof requestId !== 'string' ||
				typeof appInstanceId !== 'string' ||
				typeof actionId !== 'string'
			) {
				return json(res, 400, {
					error: { code: 'invalid_selection', message: 'malformed invocation request' },
				})
			}

			const existing = requests.get(requestId)
			if (existing) {
				// Stable request identity: a repeated request never queues twice.
				return json(res, 200, { accepted: true, deduplicated: true, requestId })
			}

			if (!instances.has(appInstanceId)) {
				return json(res, 404, {
					error: {
						code: 'not_found',
						message: `app instance "${appInstanceId}" has not announced a registry`,
					},
				})
			}

			requests.set(requestId, {
				request: { requestId, appInstanceId, actionId, registryRevision, input: body.input ?? {} },
				state: 'pending',
				cancelRequested: false,
				outcome: null,
				createdAt: Date.now(),
			})

			wakePollers(appInstanceId)
			return json(res, 200, { accepted: true, requestId })
		},
		'GET /poll': async (req, res, url) => {
			const instanceId = url.searchParams.get('instance')
			if (!instanceId || !instances.has(instanceId)) {
				return json(res, 404, {
					error: { code: 'not_found', message: 'unknown app instance' },
				})
			}

			const wait = Number(url.searchParams.get('wait') ?? 0)
			let work = workFor(instanceId)
			if (!work.invocations.length && !work.cancel.length && wait > 0) {
				await awaitWork(instanceId, wait)
				work = workFor(instanceId)
			}

			return json(res, 200, work)
		},
		'POST /result': async (req, res) => {
			const body = await readBody(req)
			if (typeof body?.requestId !== 'string' || typeof body?.outcome?.status !== 'string') {
				return json(res, 400, {
					error: { code: 'invalid_selection', message: 'malformed invocation result' },
				})
			}

			const entry = requests.get(body.requestId)
			if (!entry) {
				return json(res, 404, {
					error: { code: 'not_found', message: `unknown request "${body.requestId}"` },
				})
			}

			if (!entry.outcome) {
				entry.outcome = body.outcome
				entry.completedAt = Date.now()
				settleOutcome(body.requestId)
			}

			return json(res, 200, { accepted: true })
		},
		'POST /invoke/cancel': async (req, res) => {
			const body = await readBody(req)
			const entry = requests.get(body?.requestId)
			if (!entry) {
				return json(res, 404, {
					error: { code: 'not_found', message: `unknown request "${body?.requestId}"` },
				})
			}

			entry.cancelRequested = true
			wakePollers(entry.request.appInstanceId)
			return json(res, 200, { accepted: true })
		},
	}

	const middleware = async (req, res, next) => {
		const url = new URL(req.url ?? '/', 'http://localhost')
		if (!url.pathname.startsWith(PREFIX)) {
			return next()
		}

		if (!authorized(req)) {
			return unauthorized(res)
		}

		try {
			// GET /invoke/<requestId> — the only parametrized route.
			const outcomeMatch = /^\/invoke\/([^/]+)$/.exec(url.pathname.slice(PREFIX.length))
			if (req.method === 'GET' && outcomeMatch) {
				const requestId = outcomeMatch[1]
				const entry = requests.get(requestId)
				if (!entry) {
					return json(res, 404, {
						error: { code: 'not_found', message: `unknown request "${requestId}"` },
					})
				}

				if (!entry.outcome) {
					const wait = Number(url.searchParams.get('wait') ?? 0)
					if (wait > 0) {
						await awaitOutcome(requestId, wait)
					}
				}

				return json(res, 200, {
					requestId,
					state: entry.outcome ? 'completed' : entry.state,
					outcome: entry.outcome ?? undefined,
				})
			}

			const handler = routes[`${req.method} ${url.pathname.slice(PREFIX.length)}`]
			if (!handler) {
				return json(res, 404, { error: { code: 'not_found', message: 'unknown bridge route' } })
			}

			return await handler(req, res, url)
		} catch (error) {
			return json(res, 400, {
				error: { code: 'invalid_selection', message: String(error?.message ?? error) },
			})
		}
	}

	return {
		name: 'xplat-dev-bridge',
		apply: 'serve',
		config() {
			return {
				define: {
					// The app authenticates its announcements with the same token the
					// MCP server reads from the session file.
					__XPLAT_DEV_BRIDGE__: JSON.stringify({ token }),
				},
			}
		},
		configureServer(server) {
			server.middlewares.use(middleware)

			const writeSessionFile = () => {
				const address = server.httpServer?.address()
				if (!address || typeof address === 'string') {
					return
				}

				const protocol = server.config.server.https ? 'https' : 'http'
				// Vite may bind the IPv6 loopback only — record the URL the dev
				// server itself resolved rather than assuming 127.0.0.1.
				const host =
					address.address === '::' || address.address === '0.0.0.0'
						? 'localhost'
						: address.address.includes(':')
							? `[${address.address}]`
							: address.address

				const url = (
					server.resolvedUrls?.local?.[0] ?? `${protocol}://${host}:${address.port}`
				).replace(/\/$/, '')

				const appRoot = options.appRoot ?? server.config.root
				const dir = join(appRoot, 'node_modules', '.cache', 'xplat', 'dev-bridge')
				try {
					mkdirSync(dir, { recursive: true })
					writeFileSync(
						join(dir, `${serverId}.json`),
						JSON.stringify({
							serverId,
							url,
							token,
							appRoot,
							pid: process.pid,
							startedAt,
						}),
					)
				} catch (error) {
					console.warn(`[xplat] dev-bridge session file could not be written: ${error.message}`)
				}
			}

			const removeSessionFile = () => {
				const appRoot = options.appRoot ?? server.config.root
				try {
					rmSync(
						join(appRoot, 'node_modules', '.cache', 'xplat', 'dev-bridge', `${serverId}.json`),
						{ force: true },
					)
				} catch {}
			}

			if (server.httpServer) {
				if (server.httpServer.listening) {
					writeSessionFile()
				} else {
					server.httpServer.once('listening', writeSessionFile)
				}

				server.httpServer.on('close', removeSessionFile)
			}
		},
	}
}
