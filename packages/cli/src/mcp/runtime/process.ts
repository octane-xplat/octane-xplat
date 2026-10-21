// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Managed child processes. Runtime adapters spawn the consumer app's own
// toolchain (pnpm exec vite / ns run / dev scripts) — never repo internals.
// Every child is tracked so session end, cooperative cancel, and server
// shutdown can release exactly the resources that session created.

import { execFileSync, spawn } from 'node:child_process'
import { StringDecoder } from 'node:string_decoder'

const managed = new Set()
let exitHooked = false

const hookExit = () => {
	if (exitHooked) {
		return
	}

	exitHooked = true
	process.on('exit', () => {
		for (const child of managed) {
			killTree(child, 'SIGKILL')
		}
	})
}

/** Kill the whole process group on POSIX; taskkill the tree on Windows. */
function killTree(child, signal) {
	if (child.exitCode !== null || child.signalCode !== null) {
		return
	}

	try {
		if (process.platform === 'win32') {
			execFileSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
		} else {
			// Detached children lead their own group — kill the group so the
			// toolchain's own subprocesses (vite, gradle, simctl) die too.
			process.kill(-child.pid, signal)
		}
	} catch {
		try {
			child.kill(signal)
		} catch {}
	}
}

function pipeLines(stream, emit) {
	const decoder = new StringDecoder('utf8')
	let pending = ''
	let discarding = false
	const consume = (text) => {
		for (const part of text.split(/(?<=\n)/)) {
			if (!discarding) {
				pending += part
			}
			if (pending.length > 8192) {
				emit(pending.slice(0, 8192), true)
				pending = ''
				discarding = true
			}
			if (part.endsWith('\n')) {
				if (!discarding) {
					emit(pending.replace(/\r?\n$/, ''))
				}
				pending = ''
				discarding = false
			}
		}
	}
	stream.on('data', (chunk) => consume(decoder.write(chunk)))
	stream.on('end', () => {
		consume(decoder.end())
		if (pending) {
			emit(pending)
		}
	})
}

/**
 * Spawn a long-running child whose output lands in a LogBuffer.
 *
 *  - `signal` abort → cooperative stop (SIGTERM, then SIGKILL after graceMs)
 *  - `onExit` fires on close with { code, signal }
 *  - `stop()` returns a promise resolved once the process is gone
 *
 * Returns { pid, stop, exit } — `exit` is the close-event promise.
 */
export function spawnManaged({
	cmd,
	args = [],
	cwd,
	env,
	logBuffer,
	source,
	signal,
	graceMs = 3000,
	spawnImpl = spawn,
}) {
	const child = spawnImpl(cmd, args, {
		cwd,
		env: env ? { ...process.env, ...env } : process.env,
		detached: process.platform !== 'win32',
		stdio: ['ignore', 'pipe', 'pipe'],
	})

	hookExit()
	managed.add(child)

	const note = (line) => logBuffer?.note(line, { source: source ?? `${cmd} ${args.join(' ')}` })

	if (child.stdout) {
		pipeLines(child.stdout, (line, lineTruncated) =>
			logBuffer?.append({
				stream: 'stdout',
				line,
				...(lineTruncated ? { lineTruncated: true } : {}),
			}),
		)
	}

	if (child.stderr) {
		pipeLines(child.stderr, (line, lineTruncated) =>
			logBuffer?.append({
				stream: 'stderr',
				line,
				...(lineTruncated ? { lineTruncated: true } : {}),
			}),
		)
	}

	let resolveExit
	const exit = new Promise((resolve) => {
		resolveExit = resolve
	})

	child.once('error', (error) => {
		managed.delete(child)
		note(`spawn failed: ${error.message}`)
		resolveExit({ code: -1, signal: null, error })
	})

	child.once('close', (code, sig) => {
		managed.delete(child)
		note(
			`process ${child.pid ?? '?'} exited (code=${code ?? 'null'}${sig ? `, signal=${sig}` : ''})`,
		)

		resolveExit({ code, signal: sig })
	})

	note(`spawned pid=${child.pid ?? '?'}: ${cmd} ${args.join(' ')}`)

	let stopPromise = null
	const stop = () => {
		if (!stopPromise) {
			stopPromise = (async () => {
				if (child.exitCode !== null || child.signalCode !== null) {
					return
				}

				note(`stopping pid=${child.pid} (SIGTERM, SIGKILL after ${graceMs}ms)`)
				killTree(child, 'SIGTERM')
				const winner = await Promise.race([
					exit,
					new Promise((resolve) => setTimeout(() => resolve('timeout'), graceMs)),
				])

				if (winner === 'timeout') {
					note(`pid=${child.pid} did not exit within ${graceMs}ms — SIGKILL`)
					killTree(child, 'SIGKILL')
				}

				await exit
			})()
		}

		return stopPromise
	}

	if (signal) {
		if (signal.aborted) {
			void stop()
		} else {
			signal.addEventListener('abort', () => void stop(), { once: true })
		}
	}

	return { pid: child.pid, stop, exit, killed: () => managed.has(child) === false }
}

/** Quiet execFile — returns stdout text or null. Injectable for tests. */
export function execText(cmd, args, { timeoutMs = 15000, cwd } = {}) {
	try {
		return execFileSync(cmd, args, {
			encoding: 'utf8',
			timeout: timeoutMs,
			cwd,
			stdio: ['ignore', 'pipe', 'ignore'],
		})
	} catch {
		return null
	}
}

/** Memoized execText — toolchain probes run per status call, cache briefly. */
export function cachedExec({ ttlMs = 30000, exec = execText } = {}) {
	const cache = new Map()
	return (cmd, args, opts) => {
		const key = `${cmd}\0${args.join('\0')}`
		const hit = cache.get(key)
		if (hit && hit.at > Date.now() - ttlMs) {
			return hit.value
		}

		const value = exec(cmd, args, opts)
		cache.set(key, { at: Date.now(), value })
		return value
	}
}
