import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { chmod, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { prebuiltRoot } from './jsc-host/runtime.mjs'

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')

// Package managers can normalize non-bin files to 0644. Never chmod the shared
// pnpm store: materialize a verified executable in this app's generated cache.
export async function macOSExecutable(appRoot, relativePath) {
	const manifest = JSON.parse(readFileSync(join(prebuiltRoot, 'manifest.json'), 'utf8'))
	const expected = manifest.sha256[relativePath]
	const bytes = await readFile(join(prebuiltRoot, relativePath))
	if (!expected || hash(bytes) !== expected) {
		throw new Error(`macOS executable checksum differs: ${relativePath}`)
	}

	const cache = join(appRoot, 'node_modules/.cache/xplat/macos-tools')
	const directory = join(cache, expected)
	const executable = join(directory, 'tool')
	try {
		if (hash(await readFile(executable)) === expected) {
			await chmod(executable, 0o755)
			return executable
		}
	} catch {
		/* Cache does not exist yet. */
	}

	await mkdir(cache, { recursive: true })
	const staging = await mkdtemp(join(cache, '.tool-'))
	try {
		await writeFile(join(staging, 'tool'), bytes, { mode: 0o755 })
		try {
			await rename(staging, directory)
		} catch (error) {
			if (error.code !== 'EEXIST' && error.code !== 'ENOTEMPTY') {
				throw error
			}

			if (hash(await readFile(executable)) !== expected) {
				throw new Error(`Corrupt macOS executable cache: ${directory}; remove it and retry`)
			}
		}

		return executable
	} finally {
		await rm(staging, { recursive: true, force: true })
	}
}
