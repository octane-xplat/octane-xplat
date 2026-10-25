// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
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
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { SourceMap } from 'node:module'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { browserLogScript } from '../dev-log-client.web.ts'

const PREFIX = '/__xplat_dev__'
const MAX_BODY = 1024 * 1024
// Three missed default (5s) announcements expire a realm's lease. Use the
// server's receive time: an app clock or an agent registry read is not liveness.
const INSTANCE_TTL_MS = 15_000
const OUTCOME_TTL_MS = 600_000
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

	// appInstanceId → { announcement, at, timer }
	const instances = new Map()
	// requestId → { request, state: 'pending'|'delivered', cancelRequested, outcome, waiters }
	const requests = new Map()
	// Set by configureServer — stack resolution needs the dev server's module graph.
	let viteServer

	// Matches `<http-url>:<line>:<col>` inside a stack frame — covers V8
	// `at fn (url:l:c)` / `at url:l:c` and JSC `fn@url:l:c`. Non-http
	// locations (e.g. `file:///app/bundle.mjs`) are ignored by construction.
	const HTTP_FRAME = /(https?:\/\/[^\s)"']+?):(\d+):(\d+)/g
	const FS_PREFIX = '/@fs'
	// NativeScript dev sessions serve device modules under /ns/m/<vite-url-path>;
	// the process-code-for-device rewrite injects preludes with no source map
	// and non-uniform line shifts, so device lines are mapped back by text.
	const NS_MODULE_PREFIX = '/ns/m/'
	const MAX_DEVICE_MODULE_BYTES = 5 * 1024 * 1024

	const transformFor = async (moduleUrl, cache) => {
		let entry = cache.get(moduleUrl)
		if (entry === undefined) {
			try {
				entry = await viteServer.transformRequest(moduleUrl)
			} catch {
				entry = null
			}

			cache.set(moduleUrl, entry)
		}

		return entry
	}

	// The code the phone actually ran for one /ns/m/ URL, fetched from this
	// dev server exactly the way the device fetched it. Cached per resolveStack
	// call; a failed or oversized fetch just leaves the frame raw.
	const deviceCodeFor = async (pathname, search, origin, cache) => {
		const key = `device:${pathname}${search}`
		let code = cache.get(key)
		if (code === undefined) {
			code = null
			try {
				const base = viteServer.resolvedUrls?.local?.[0] ?? origin
				const res = await fetch(new URL(pathname + search, base))
				if (res.ok) {
					const body = await res.text()
					if (body.length <= MAX_DEVICE_MODULE_BYTES) {
						code = body
					}
				}
			} catch {
				// leave code null
			}

			cache.set(key, code)
		}

		return code
	}

	// @nativescript/vite anchors /ns/m/<rel> at the project root, or at the
	// monorepo workspace root for workspace packages outside it; mirror that by
	// taking the nearest ancestor of the vite root where the file exists.
	const deviceModuleUrl = (rel) => {
		if (rel.startsWith('@fs/') || existsSync(join(viteServer.config.root, rel))) {
			return `/${rel}`
		}

		for (let dir = dirname(viteServer.config.root); ; dir = dirname(dir)) {
			const abs = join(dir, rel)
			if (existsSync(abs)) {
				return `${FS_PREFIX}${abs.split(sep).join('/')}`
			}

			if (dirname(dir) === dir) {
				return `/${rel}`
			}
		}
	}

	const indent = (text) => text.length - text.trimStart().length

	// The NS device rewrite only adds lines, so the transformed twin of a
	// device line sits at or before the device index; a tie resolves to the
	// greatest index ≤ the device index, else the nearest match overall.
	const mapDevicePosition = (deviceCode, transformedCode, line0, col0) => {
		const deviceLines = deviceCode.split('\n')
		const transformedLines = transformedCode.split('\n')
		const text = deviceLines[line0]?.trim()
		if (!text || text.length < 8) {
			return undefined
		}

		let bestBefore = -1
		let nearest = -1
		let nearestDistance = Infinity
		for (let i = 0; i < transformedLines.length; i++) {
			if (transformedLines[i].trim() !== text) {
				continue
			}

			const distance = Math.abs(i - line0)
			if (distance < nearestDistance) {
				nearestDistance = distance
				nearest = i
			}

			if (i <= line0) {
				bestBefore = i
			}
		}

		const index = bestBefore >= 0 ? bestBefore : nearest
		if (index < 0) {
			return undefined
		}

		const col = Math.max(0, indent(transformedLines[index]) + (col0 - indent(deviceLines[line0])))
		return { line: index, col }
	}

	const resolveFrame = async (url, line, col, cache) => {
		const { origin, pathname, search } = new URL(url)
		const isDeviceModule = pathname.startsWith(NS_MODULE_PREFIX)
		const moduleUrl = isDeviceModule
			? deviceModuleUrl(pathname.slice(NS_MODULE_PREFIX.length))
			: pathname + search
		const transformed = await transformFor(moduleUrl, cache)
		const map = transformed?.map
		if (!map) {
			return undefined
		}

		let generatedLine = line - 1
		let generatedColumn = col - 1
		if (isDeviceModule) {
			const deviceCode = await deviceCodeFor(pathname, search, origin, cache)
			if (!deviceCode || !transformed.code) {
				return undefined
			}

			const mapped = mapDevicePosition(deviceCode, transformed.code, generatedLine, generatedColumn)
			if (!mapped) {
				return undefined
			}

			generatedLine = mapped.line
			generatedColumn = mapped.col
		}

		let sourceMap = cache.get(`map:${moduleUrl}`)
		if (!sourceMap) {
			sourceMap = new SourceMap(map)
			cache.set(`map:${moduleUrl}`, sourceMap)
		}

		const found = sourceMap.findEntry(generatedLine, generatedColumn)
		if (!found?.originalSource) {
			return undefined
		}

		// map.sources entries resolve against the transformed module's own
		// file — a clean filesystem path, no query. Falls back to the /@fs
		// path for out-of-root modules, root + pathname for in-root ones.
		const modulePath = isDeviceModule ? moduleUrl : pathname
		const mod = await viteServer.moduleGraph.getModuleByUrl(moduleUrl)
		const moduleId =
			mod?.file ??
			(modulePath.startsWith(FS_PREFIX)
				? modulePath.slice(FS_PREFIX.length)
				: join(viteServer.config.root, modulePath))
		const original = found.originalSource
		const sourcePath = isAbsolute(original)
			? original
			: resolve(
					dirname(moduleId),
					typeof map.sourceRoot === 'string' ? map.sourceRoot : '.',
					original,
				)
		const rootRelative = relative(viteServer.config.root, sourcePath).split(sep).join('/')
		return `${rootRelative}:${found.originalLine + 1}:${found.originalColumn + 1}`
	}

	// Rewrite every resolvable http(s) frame location to its original source
	// position; returns undefined when nothing resolved. Bounded to the
	// failure record itself — a transform failure leaves frames untouched.
	const resolveStack = async (stack) => {
		const cache = new Map()
		const parts = []
		let last = 0
		let changed = false
		for (const match of stack.matchAll(HTTP_FRAME)) {
			const resolved = await resolveFrame(match[1], Number(match[2]), Number(match[3]), cache)
			if (resolved) {
				parts.push(stack.slice(last, match.index), resolved)
				last = match.index + match[0].length
				changed = true
			}
		}

		if (!changed) {
			return undefined
		}

		parts.push(stack.slice(last))
		return parts.join('')
	}

	const resolveOutcomeFailures = async (outcome) => {
		const failures = outcome?.error?.failures
		if (!viteServer || !Array.isArray(failures)) {
			return
		}

		for (const failure of failures.slice(0, 20)) {
			if (typeof failure?.stack !== 'string') {
				continue
			}

			try {
				const sourceStack = await resolveStack(failure.stack)
				if (sourceStack) {
					failure.sourceStack = sourceStack
				}
			} catch {}
		}
	}

	const prune = () => {
		const now = Date.now()
		for (const [id, entry] of instances) {
			if (now - entry.at >= INSTANCE_TTL_MS) {
				expireInstance(id, entry)
			}
		}

		for (const [id, entry] of requests) {
			if (entry.outcome && now - entry.completedAt > OUTCOME_TTL_MS) {
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
		prune()
		return [...instances.entries()].map(([id, entry]) => ({
			...entry.announcement,
			appInstanceId: id,
		}))
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

	const expireInstance = (instanceId, instance) => {
		if (instances.get(instanceId) !== instance) {
			return
		}

		clearTimeout(instance.timer)
		instances.delete(instanceId)
		for (const [requestId, entry] of requests) {
			if (entry.request.appInstanceId !== instanceId || entry.outcome) {
				continue
			}

			const delivered = entry.state === 'delivered'
			entry.state = 'completed'
			entry.completedAt = Date.now()
			entry.outcome = {
				requestId,
				status: 'unknown',
				error: {
					code: 'disconnected_runtime',
					message: 'The app stopped announcing its registry.',
				},
				partialEffects: delivered
					? ['The action was delivered; whether it completed is unknown.']
					: [],
				completedAt: new Date(entry.completedAt).toISOString(),
			}

			settleOutcome(requestId)
		}

		wakePollers(instanceId)
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
			if (entry.request.appInstanceId !== instanceId || entry.outcome) {
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

			clearTimeout(instances.get(body.appInstanceId)?.timer)
			const instance = { announcement: body, at: Date.now() }
			instances.set(body.appInstanceId, instance)
			instance.timer = setTimeout(
				() => expireInstance(body.appInstanceId, instance),
				INSTANCE_TTL_MS,
			)
			instance.timer.unref?.()
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
				prune()
				if (!instances.has(instanceId)) {
					return json(res, 404, { error: { code: 'not_found', message: 'app instance expired' } })
				}

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
				await resolveOutcomeFailures(body.outcome)
				// Resolution is async — re-check before storing so a duplicate
				// post can't overwrite the outcome that landed meanwhile.
				if (!entry.outcome) {
					entry.outcome = body.outcome
					entry.completedAt = Date.now()
					settleOutcome(body.requestId)
				}
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
			prune()
			if (req.method === 'POST' && url.pathname === `${PREFIX}/logs`) {
				const body = await readBody(req)
				if (
					!Array.isArray(body.records) ||
					body.records.length > 10 ||
					!Number.isSafeInteger(body.dropped ?? 0) ||
					(body.dropped ?? 0) < 0 ||
					body.records.some(
						(record) =>
							!record ||
							!['warn', 'error'].includes(record.level) ||
							typeof record.line !== 'string' ||
							record.line.length > 2048,
					)
				) {
					throw new Error('Invalid browser log batch.')
				}

				if (body.dropped) {
					process.stderr.write(
						`[browser:warn] ${body.dropped} browser log records lost before delivery.\n`,
					)
				}

				for (const record of body.records) {
					for (const line of record.line.split(/\r?\n/)) {
						process.stderr.write(`[browser:${record.level}] ${line}\n`)
					}
				}

				return json(res, 200, { accepted: body.records.length })
			}

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
		transformIndexHtml() {
			return [
				{
					tag: 'script',
					attrs: { type: 'module' },
					children: browserLogScript(token, `${PREFIX}/logs`),
					injectTo: 'head-prepend',
				},
			]
		},
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
			viteServer = server
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
				server.httpServer.on('close', () => {
					for (const instance of instances.values()) {
						clearTimeout(instance.timer)
					}
				})
			}
		},
	}
}
