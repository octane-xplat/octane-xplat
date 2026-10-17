// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Prefixed process plumbing — dev runs several tools side by side, so each
// gets a short tag on its output lines. SIGINT/SIGTERM fan out to every child;
// the parent lingers so children can finish their own cleanup first.
import { spawn } from 'node:child_process'

const children = new Set()
let stopping = false
let stopCode = 0

const stop = (signal, code) => {
	if (stopping) {
		return
	}

	stopping = true
	stopCode = code
	for (const p of children) {
		p.kill(signal)
	}

	// Children that ignore the signal are abandoned after this grace period.
	setTimeout(() => process.exit(stopCode), 5000).unref()
}

process.on('SIGINT', () => stop('SIGINT', 130))
process.on('SIGTERM', () => stop('SIGTERM', 143))

/** Spawn long-running, output prefixed `[tag]`. */
export function spawnTagged(tag, cmd, args, cwd) {
	const p = spawn(cmd, args, { cwd, env: process.env })
	children.add(p)
	const prefix = (chunk) => {
		for (const line of chunk.toString().split('\n')) {
			if (line.trim()) {
				process.stdout.write(`[${tag}] ${line}\n`)
			}
		}
	}

	p.stdout.on('data', prefix)
	p.stderr.on('data', prefix)
	p.on('exit', () => {
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
		p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${tag} exited ${code}`))))
	})
}
