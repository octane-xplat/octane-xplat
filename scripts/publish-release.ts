#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { publishablePackages, lockstepPackages } from './publishable.ts'

/** Pack every pending package before publishing any; reruns skip existing versions. */
export function publishRelease({
	root = resolve(import.meta.dirname, '..'),
	tag = 'latest',
	packageName,
	dryRun = false,
	run = spawnSync,
}: {
	root?: string
	tag?: string
	packageName?: string
	dryRun?: boolean
	run?: typeof spawnSync
} = {}) {
	if (!/^[a-z][a-z0-9._-]*$/.test(tag)) {
		throw new Error(`Invalid release tag: ${tag}`)
	}
	const selected = (packageName ? publishablePackages(root) : lockstepPackages(root)) as {
		name: string
		version: string
		dir: string
	}[]
	const packages = packageName ? selected.filter((pkg) => pkg.name === packageName) : selected
	if (!packages.length) {
		throw new Error(`No publishable package matches ${packageName}`)
	}
	const work = mkdtempSync(join(tmpdir(), 'xplat-release-'))
	const execute = (command: string, args: string[], cwd = root) => {
		const result = run(command, args, {
			cwd,
			encoding: 'utf8',
			shell: process.platform === 'win32',
		})
		if (result.error) {
			throw result.error
		}
		return result
	}
	try {
		const pending: { name: string; version: string; tarball: string }[] = []
		for (const pkg of packages) {
			const identity = `${pkg.name}@${pkg.version}`
			const existing = execute('npm', ['view', identity, 'version', '--json'])
			if (existing.status === 0) {
				if (JSON.parse(String(existing.stdout)) !== pkg.version) {
					throw new Error(`Unexpected registry response for ${identity}`)
				}
				console.log(`Already published: ${identity}`)
				continue
			}
			let code: string | undefined
			try {
				code = JSON.parse(String(existing.stdout)).error?.code
			} catch {
				/* Check npm's structured stderr too. */
			}
			if (!code) {
				try {
					code = JSON.parse(String(existing.stderr)).error?.code
				} catch {
					/* Report below. */
				}
			}
			if (code !== 'E404') {
				throw new Error(`Registry lookup failed for ${identity}: ${existing.stderr}`)
			}
			const before = new Set(readdirSync(work))
			const packed = execute('bun', ['pm', 'pack', '--destination', work], join(root, pkg.dir))
			if (packed.status !== 0) {
				throw new Error(`Bun pack failed for ${identity}: ${packed.stderr}`)
			}
			const files = readdirSync(work).filter((name) => name.endsWith('.tgz') && !before.has(name))
			if (files.length !== 1) {
				throw new Error(`Expected one tarball for ${identity}, found ${files.length}`)
			}
			pending.push({ ...pkg, tarball: join(work, files[0]) })
		}
		for (const pkg of pending) {
			const args = [
				'publish',
				pkg.tarball,
				'--access',
				'public',
				'--provenance',
				'--tag',
				tag,
				...(dryRun ? ['--dry-run'] : []),
			]
			const result = execute('npm', args)
			if (result.status !== 0) {
				throw new Error(`npm publish failed for ${pkg.name}@${pkg.version}: ${result.stderr}`)
			}
			console.log(String(result.stdout).trim())
		}
		return pending.map(({ name, version }) => `${name}@${version}`)
	} finally {
		rmSync(work, { recursive: true, force: true })
	}
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const args = process.argv.slice(2)
	let tag = 'latest'
	let packageName: string | undefined
	let dryRun = false
	for (let index = 0; index < args.length; index++) {
		if (args[index] === '--dry-run') {
			dryRun = true
		} else if (args[index] === '--tag' && args[index + 1]) {
			tag = args[++index]
		} else if (args[index] === '--package' && args[index + 1]) {
			packageName = args[++index]
		} else {
			throw new Error(`Unknown or incomplete argument: ${args[index]}`)
		}
	}
	publishRelease({ tag, packageName, dryRun })
}
