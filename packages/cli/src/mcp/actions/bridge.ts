// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Dev-bridge transport: find live dev-server bridges for an app and speak
// the /__xplat_dev__/ protocol with them.
//
// The bridge is dev-server middleware (xplatDevBridge vite plugin in
// @octane-xplat/cli). It writes a same-uid session file under
// <app>/node_modules/.cache/xplat/dev-bridge/<serverId>.json carrying the
// loopback URL and the per-server auth token; the app holds the same token
// through a dev-only bundler define. Local reachability alone is never
// authorization: every call carries the token.
//
// Discovery degrades quietly — a dead pid, unreadable file, or unreachable
// endpoint produces an honest unreachable result, never a claimed registry.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

export const BRIDGE_DIR = join('node_modules', '.cache', 'xplat', 'dev-bridge')
const BRIDGE_PATH = '/__xplat_dev__'
const FILE_FRESH_MS = 60_000
const REQUEST_TIMEOUT_MS = 4_000

const pidAlive = (pid) => {
	if (typeof pid !== 'number' || pid <= 0) {
		return false
	}

	try {
		process.kill(pid, 0)
		return true
	} catch {
		return false
	}
}

/**
 * Bridge endpoints announced under an app root. A file counts as live when its
 * dev-server pid exists or it was written recently (server still starting up).
 */
export function scanBridgeEndpoints(appRoot) {
	const dir = join(appRoot, BRIDGE_DIR)
	let names
	try {
		names = readdirSync(dir)
	} catch {
		return []
	}

	const endpoints = []
	for (const name of names) {
		if (!name.endsWith('.json')) {
			continue
		}

		const path = join(dir, name)
		let file
		try {
			file = JSON.parse(readFileSync(path, 'utf8'))
		} catch {
			continue
		}

		if (typeof file?.serverId !== 'string' || typeof file?.url !== 'string') {
			continue
		}

		if (typeof file?.token !== 'string' || !file.token) {
			continue
		}

		let mtime = 0
		try {
			mtime = statSync(path).mtimeMs
		} catch {
			continue
		}

		if (!pidAlive(file.pid) && Date.now() - mtime > FILE_FRESH_MS) {
			continue
		}

		endpoints.push({
			serverId: file.serverId,
			url: file.url,
			token: file.token,
			appRoot: file.appRoot ?? appRoot,
			pid: file.pid ?? null,
			startedAt: file.startedAt ?? null,
			filePath: path,
		})
	}

	return endpoints
}

async function request(endpoint, method, path, body, timeoutMs, signal) {
	const controller = new AbortController()
	const timer = setTimeout(() => controller.abort(), timeoutMs ?? REQUEST_TIMEOUT_MS)
	const onAbort = () => controller.abort()
	if (signal) {
		if (signal.aborted) {
			return { ok: false, status: 0, error: { code: 'aborted', message: 'request aborted' } }
		}

		signal.addEventListener('abort', onAbort, { once: true })
	}

	try {
		const init = {
			method,
			headers: { 'x-xplat-dev-token': endpoint.token },
			signal: controller.signal,
		}

		if (body !== undefined) {
			init.headers['content-type'] = 'application/json'
			init.body = JSON.stringify(body)
		}

		const response = await fetch(`${endpoint.url}${BRIDGE_PATH}${path}`, init)

		const payload = await response.json().catch(() => null)
		if (!response.ok) {
			return {
				ok: false,
				status: response.status,
				error: payload?.error ?? { code: 'http', message: `HTTP ${response.status}` },
			}
		}

		return { ok: true, data: payload }
	} catch (error) {
		return {
			ok: false,
			status: 0,
			error: { code: 'unreachable', message: error?.message ?? 'bridge unreachable' },
		}
	} finally {
		clearTimeout(timer)
		if (signal) {
			signal.removeEventListener('abort', onAbort)
		}
	}
}

/** The live announcements a bridge holds. `{ ok:false }` = endpoint unreachable. */
export function fetchBridgeRegistry(endpoint) {
	return request(endpoint, 'GET', '/registry')
}

/** Queue an invocation for an app instance. Returns the bridge's acceptance. */
export function submitInvocation(endpoint, invocation) {
	return request(endpoint, 'POST', '/invoke', invocation)
}

/**
 * Wait for an invocation outcome with bridge-side long polling. `signal`
 * aborts only the wait — cancellation of the action itself goes through
 * cancelInvocation.
 */
export function awaitInvocation(endpoint, requestId, waitMs, signal) {
	const wait = Math.min(Math.max(waitMs ?? 25_000, 1_000), 30_000)
	return request(
		endpoint,
		'GET',
		`/invoke/${requestId}?wait=${wait}`,
		undefined,
		wait + 5_000,
		signal,
	)
}

/** Best-effort cooperative cancellation. */
export function cancelInvocation(endpoint, requestId) {
	return request(endpoint, 'POST', '/invoke/cancel', { requestId })
}
