#!/usr/bin/env node
// Shared per-target advisory lock for serializing native builds and
// simulator/device use across worktrees and agent sessions on this host.
//
//   node scripts/with-target-lock.mjs <target> [--timeout <seconds>] -- <command...>
//
// <target> is a lock name such as `ios` or `android`. The lock is an atomic
// mkdir under os.tmpdir() shared by every worktree; a dead owner's lock is
// reclaimed after checking its recorded pid is gone.
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { hostname, tmpdir } from 'node:os'
import { join } from 'node:path'

const args = process.argv.slice(2)
const separator = args.indexOf('--')
const target = args[0]
const timeoutFlag = args.indexOf('--timeout')
const timeoutSeconds = timeoutFlag > 0 ? Number(args[timeoutFlag + 1]) : 30 * 60
const command = separator > 0 ? args.slice(separator + 1) : null

if (!target || target.startsWith('--') || !command?.length) {
	console.error('usage: with-target-lock.mjs <target> [--timeout <seconds>] -- <command...>')
	process.exit(2)
}

const lockRoot = join(tmpdir(), 'octane-xplat-target-locks')
mkdirSync(lockRoot, { recursive: true })
const lockDir = join(lockRoot, `${target}.lock`)
const ownerFile = join(lockDir, 'owner.json')
const deadline = Date.now() + timeoutSeconds * 1000
let ownerLogged = false

function ownerAlive() {
	try {
		const owner = JSON.parse(readFileSync(ownerFile, 'utf8'))
		if (owner.hostname && owner.hostname !== hostname()) {
			return { alive: true, owner } // another host — cannot probe; treat as live
		}

		try {
			process.kill(owner.pid, 0)
			return { alive: true, owner }
		} catch {
			return { alive: false, owner }
		}
	} catch {
		return { alive: false, owner: null }
	}
}

for (;;) {
	try {
		mkdirSync(lockDir, { recursive: false })
		writeFileSync(
			ownerFile,
			JSON.stringify(
				{ pid: process.pid, hostname: hostname(), cwd: process.cwd(), started: new Date().toISOString() },
				null,
				1,
			),
		)

		break
	} catch (error) {
		if (error.code !== 'EEXIST') {
			throw error
		}

		const { alive, owner } = ownerAlive()
		if (!alive) {
			console.log(`[lock] reclaiming stale ${target} lock (owner pid ${owner?.pid ?? 'unknown'} is gone)`)
			rmSync(lockDir, { recursive: true, force: true })
			continue
		}

		if (Date.now() > deadline) {
			console.error(`[lock] timed out waiting for ${target} lock held by pid ${owner?.pid}`)
			process.exit(1)
		}

		if (!ownerLogged) {
			console.log(`[lock] ${target} held by pid ${owner?.pid} (${owner?.cwd ?? '?'}) — waiting`)
			ownerLogged = true
		}

		await new Promise((resolve) => setTimeout(resolve, 5000))
	}
}

console.log(`[lock] ${target} acquired (pid ${process.pid})`)
try {
	const result = spawnSync(command[0], command.slice(1), { stdio: 'inherit' })
	process.exitCode = result.status ?? (result.error ? 1 : 0)
	if (result.error) {
		console.error(result.error.message)
	}
} finally {
	rmSync(lockDir, { recursive: true, force: true })
}
