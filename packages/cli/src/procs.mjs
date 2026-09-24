// Prefixed process plumbing — dev runs several tools side by side, so each
// gets a short tag on its output lines. SIGINT fans out to every child.
import { spawn } from 'node:child_process'

const children = new Set()

process.on('SIGINT', () => {
	for (const p of children) p.kill('SIGINT')
	process.exit(130)
})

/** Spawn long-running, output prefixed `[tag]`. */
export function spawnTagged(tag, cmd, args, cwd) {
	const p = spawn(cmd, args, { cwd, env: process.env })
	children.add(p)
	const prefix = (chunk) => {
		for (const line of chunk.toString().split('\n')) {
			if (line.trim()) process.stdout.write(`[${tag}] ${line}\n`)
		}
	}

	p.stdout.on('data', prefix)
	p.stderr.on('data', prefix)
	p.on('exit', () => children.delete(p))
	return p
}

/** Spawn to completion, output prefixed `[tag]`. Resolves on exit 0. */
export function runTagged(tag, cmd, args, cwd) {
	return new Promise((resolve, reject) => {
		const p = spawnTagged(tag, cmd, args, cwd)
		p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${tag} exited ${code}`))))
	})
}
