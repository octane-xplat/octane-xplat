import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { caseIdentity, repo } from './project.mjs'

export async function acquireCaseLock(target, caseFile) {
	const parent = join(repo, 'research/probes', caseIdentity(target, caseFile))
	await mkdir(parent, { recursive: true })
	const lock = join(parent, '.runner-lock')
	try {
		await mkdir(lock)
	} catch (error) {
		if (error.code !== 'EEXIST') {
			throw error
		}

		let owner
		try {
			owner = JSON.parse(await readFile(join(lock, 'owner.json'), 'utf8'))
		} catch {
			throw new Error('Probe lock has no valid owner; inspect ' + lock)
		}

		try {
			process.kill(owner.pid, 0)
		} catch (error) {
			if (error.code === 'ESRCH') {
				throw new Error(
					'Probe lock owner is no longer running; inspect and remove the stale lock: ' + lock,
				)
			}

			throw error
		}

		throw new Error(
			`This case already has a ${target} runner (pid ${owner.pid}); finish that session first`,
		)
	}

	await writeFile(join(lock, 'owner.json'), JSON.stringify({ pid: process.pid }))
	return async () => {
		const owner = JSON.parse(await readFile(join(lock, 'owner.json'), 'utf8'))
		if (owner.pid === process.pid) {
			await rm(lock, { recursive: true })
		}
	}
}
