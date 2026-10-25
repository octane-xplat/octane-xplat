// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Prefixed process plumbing — dev runs several tools side by side, so each
// gets a short tag on its output lines. SIGINT/SIGTERM fan out to every child;
// the parent lingers so children can finish their own cleanup first.
import { spawn, execFileSync } from 'node:child_process'
import { StringDecoder } from 'node:string_decoder'
import { createDevLogCapture } from './dev-logs.ts'

const children = new Set()
let stopping = false
let stopCode = 0

const stopChild = (child, signal) => {
	try {
		if (process.platform === 'win32') {
			execFileSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
		} else {
			process.kill(-child.pid, signal)
		}
	} catch {
		try {
			child.kill(signal)
		} catch {}
	}
}
const stop = (signal, code) => {
	if (stopping) {
		return
	}

	stopping = true
	stopCode = code
	for (const p of children) {
		stopChild(p, signal)
	}

	// Children that ignore the signal are abandoned after this grace period.
	setTimeout(() => process.exit(stopCode), 5000).unref()
}

process.on('SIGINT', () => stop('SIGINT', 130))
process.on('SIGTERM', () => stop('SIGTERM', 143))

/** Spawn long-running, output prefixed `[tag]`. */
export function spawnTagged(tag, cmd, args, cwd, { capture } = {}) {
	let log
	const captureError = (error) => {
		log = null
		process.stderr.write(`[xplat] Development log capture unavailable: ${error.message}\n`)
	}
	if (capture) {
		try {
			log = createDevLogCapture(cwd, capture)
		} catch (error) {
			if (error.code === 'target_busy') {
				throw error
			}
			captureError(error)
		}
	}
	// Harness scripts drive dev targets through stdin commands (the AppKit
	// host's automation protocol lives in the spawned child, not here). A
	// piped stdin is inherited so those bytes reach the child; a TTY keeps a
	// dead pipe — detached children sit in a background process group, and
	// reading the terminal would stop them with SIGTTIN.
	const p = spawn(cmd, args, {
		cwd,
		env: process.env,
		detached: process.platform !== 'win32',
		stdio: process.stdin.isTTY ? 'pipe' : ['inherit', 'pipe', 'pipe'],
	})
	let requestedStop = false
	if (log) {
		process.stdout.write(`[${tag}] session ${log.sessionId}\n`)
		log.onStop(() => {
			requestedStop = true
			stopChild(p, 'SIGTERM')
			const timer = setTimeout(() => stopChild(p, 'SIGKILL'), 3000)
			timer.unref()
			p.once('close', () => clearTimeout(timer))
		})
	}

	children.add(p)
	const output = (stream, input) => {
		const decoder = new StringDecoder('utf8')
		let pending = ''
		let discarding = false
		const line = (text, lineTruncated = false) => {
			try {
				log?.observeNativeOutput(text)
				log?.append({
					stream,
					source: tag,
					line: text,
					...(lineTruncated ? { lineTruncated } : {}),
				})
			} catch (error) {
				captureError(error)
			}
		}
		const consume = (text) => {
			for (const part of text.split(/(?<=\n)/)) {
				if (!discarding) {
					pending += part
				}

				if (pending.length > 8192) {
					line(pending.slice(0, 8192), true)
					pending = ''
					discarding = true
				}

				if (part.endsWith('\n')) {
					if (!discarding) {
						line(pending.replace(/\r?\n$/, ''))
					}

					pending = ''
					discarding = false
				}
			}
		}
		// Terminal output is line-buffered separately: a child line longer than
		// a pipe chunk (e.g. the parity dump's single ~64KB JSON line) must not
		// be split mid-token or automation readers see truncated text.
		let pendingOut = ''
		const writeOut = (text) => {
			pendingOut += text
			let idx
			while ((idx = pendingOut.indexOf('\n')) !== -1) {
				const part = pendingOut.slice(0, idx).replace(/\r$/, '')
				pendingOut = pendingOut.slice(idx + 1)
				if (part.trim()) {
					process.stdout.write(`[${tag}] ${part}\n`)
				}
			}
		}
		input.on('data', (chunk) => {
			const text = decoder.write(chunk)
			writeOut(text)
			consume(text)
		})
		input.on('end', () => {
			const text = decoder.end()
			writeOut(text)
			consume(text)
			if (pendingOut.trim()) {
				process.stdout.write(`[${tag}] ${pendingOut}\n`)
				pendingOut = ''
			}
			if (pending) {
				line(pending)
			}
		})
	}

	output('stdout', p.stdout)
	output('stderr', p.stderr)
	p.once('error', (error) => {
		process.stderr.write(`[${tag}] Process launch failed: ${error.message}\n`)
		try {
			log?.update({
				state: 'failed',
				detail: error.message,
				launch: { phase: 'failed', error: { code: 'execution_failure', message: error.message } },
			})
			log?.close(`Process launch failed: ${error.message}`)
		} catch (error) {
			captureError(error)
		}
	})
	p.on('close', (code, signal) => {
		try {
			if (!requestedStop && !stopping && (code || signal)) {
				log?.update({ state: 'failed', detail: `Process exited (${code ?? signal}).` })
			}
			log?.close(`Process exited (code=${code}, signal=${signal}).`)
		} catch (error) {
			captureError(error)
		}
		children.delete(p)

		if (stopping && children.size === 0) {
			process.exit(stopCode)
		}
	})

	return p
}

/** Spawn to completion, output prefixed `[tag]`. Resolves on exit 0. */
export function runTagged(tag, cmd, args, cwd) {
	return new Promise((resolve, reject) => {
		const p = spawnTagged(tag, cmd, args, cwd)
		p.once('error', reject)
		p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${tag} exited ${code}`))))
	})
}
