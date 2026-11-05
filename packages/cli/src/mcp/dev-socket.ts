import type { IncomingMessage, ServerResponse } from 'node:http'
import { browserLogScript } from '../dev-log-client.web.ts'
import { formatBrowserLogBatch } from '../dev-log-server.ts'

// Explicit Go foreground dev owns this channel. Only an app/target credential
// enters generated code; it cannot authenticate the CLI's private HTTP API.
export function nativeDevSocketPlugin() {
	const source = process.env.XPLAT_DEV_APP_BRIDGE
	if (!source) {
		return null
	}
	if (source.length > 8192) {
		throw new Error('Invalid native app bridge configuration')
	}
	let bridge
	try {
		bridge = JSON.parse(source)
	} catch {
		throw new Error('Invalid native app bridge JSON')
	}
	const endpoint = new URL(bridge.socket)
	if (
		bridge.protocol !== 'octane-app-debug' ||
		bridge.version !== 1 ||
		endpoint.protocol !== 'ws:' ||
		endpoint.hostname !== '127.0.0.1' ||
		!endpoint.port ||
		endpoint.pathname !== '/app' ||
		endpoint.username ||
		endpoint.password ||
		endpoint.hash ||
		!/^[a-f0-9]{32}$/.test(bridge.instanceId) ||
		!/^[a-f0-9]{64}$/.test(bridge.token) ||
		typeof bridge.targetId !== 'string' ||
		!bridge.targetId ||
		endpoint.searchParams.get('instance') !== bridge.instanceId ||
		endpoint.searchParams.get('target') !== bridge.targetId ||
		[...endpoint.searchParams].length !== 2
	) {
		throw new Error('Invalid native app bridge identity')
	}
	let pending = 0
	let blocked = false
	let windowAt = 0
	let batches = 0
	const logs = '/__xplat_dev__/logs'
	return {
		transformIndexHtml() {
			return [
				{
					tag: 'script',
					attrs: { type: 'module' },
					children: browserLogScript(bridge.token, logs),
					injectTo: 'head-prepend',
				},
			]
		},
		configureServer(server: {
			config: { server: { https?: unknown } }
			middlewares: {
				use: (
					handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void,
				) => void
			}
		}) {
			server.middlewares.use(async (req, res, next) => {
				if (req.url?.split('?')[0] !== logs) {
					return next()
				}
				const reply = (status: number, value: unknown) => {
					res.statusCode = status
					res.setHeader('content-type', 'application/json')
					res.end(JSON.stringify(value))
				}
				const origin = `${server.config.server.https ? 'https' : 'http'}://${req.headers.host}`
				if (
					req.method !== 'POST' ||
					req.url !== logs ||
					req.headers['x-xplat-dev-token'] !== bridge.token ||
					(req.headers.origin !== undefined && req.headers.origin !== origin)
				) {
					return reply(403, { error: 'Browser log request rejected' })
				}
				const now = Date.now()
				if (now - windowAt >= 1000) {
					windowAt = now
					batches = 0
				}
				if (pending >= 4 || batches >= 32 || blocked) {
					return reply(503, { error: 'Browser log sink busy' })
				}
				pending++
				batches++
				try {
					const body = await readBrowserLogRequest(req)
					const batch = formatBrowserLogBatch(body)
					if (blocked) {
						return reply(503, { error: 'Browser log sink busy' })
					}

					if (batch.text && !process.stderr.write(batch.text)) {
						blocked = true
						process.stderr.once('drain', () => {
							blocked = false
						})
					}

					reply(200, { accepted: batch.accepted })
				} catch {
					if (!res.destroyed) {
						reply(400, { error: 'Invalid browser log batch' })
					}
				} finally {
					pending--
				}
			})
		},
		name: 'xplat-native-app-debug',
		apply: (_config: unknown, environment: { command: string; mode: string }) =>
			environment.command === 'serve' || environment.mode === 'development',
		config() {
			return {
				define: {
					__XPLAT_DEV_BRIDGE__: JSON.stringify({
						token: bridge.token,
						socket: bridge.socket,
						instanceId: bridge.instanceId,
						targetId: bridge.targetId,
					}),
				},
			}
		},
	}
}

// Bound request bodies separately from the shared record contract. A slow
// or abandoned request must not retain an unbounded chunk list or pending slot.
function readBrowserLogRequest(req: IncomingMessage): Promise<unknown> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = []
		let size = 0
		const cleanup = () => {
			clearTimeout(timer)
			req.off('data', data)
			req.off('end', end)
			req.off('error', fail)
			req.off('aborted', aborted)
			req.once('error', () => {})
		}
		const fail = (error: Error) => {
			cleanup()
			reject(error)
		}
		const aborted = () => fail(new Error('Browser log request aborted'))
		const data = (chunk: Buffer) => {
			size += chunk.length
			if (size > 128 * 1024) {
				fail(new Error('Browser log body exceeds bound'))
				req.destroy()
				return
			}
			chunks.push(chunk)
		}
		const end = () => {
			cleanup()
			try {
				resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
			} catch {
				reject(new Error('Invalid browser log JSON'))
			}
		}
		const timer = setTimeout(() => {
			fail(new Error('Browser log request timed out'))
			req.destroy()
		}, 2000)
		req.on('data', data).once('end', end).once('error', fail).once('aborted', aborted)
	})
}
