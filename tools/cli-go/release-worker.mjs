// Only upgrade policy needs the invoked release rather than an older project's worker.
import assert from 'node:assert/strict'
import {
	mkdirSync,
	rmSync,
	readFileSync,
	writeFileSync,
	cpSync,
	readdirSync,
	realpathSync,
} from 'node:fs'

import { join, relative } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'

export function buildReleaseWorker(root, destination, version) {
	rmSync(destination, { recursive: true, force: true })
	mkdirSync(join(destination, 'dist'), { recursive: true })
	const result = spawnSync(
		'bun',
		[
			'build',
			join(root, 'packages/cli/src/upgrade-entry.ts'),
			'--target=node',
			'--format=esm',
			'--external=yaml',
			'--external=jsonc-parser',
			'--minify',
			'--outfile=' + join(destination, 'dist/upgrade-worker.mjs'),
		],
		{ cwd: root, encoding: 'utf8' },
	)
	assert.equal(result.status, 0, result.stderr)
	cpSync(join(root, 'packages/create/compatibility.json'), join(destination, 'compatibility.json'))
	cpSync(join(root, 'packages/cli/patches'), join(destination, 'patches'), { recursive: true })
	let notices = 'Release upgrade worker dependencies\n'
	for (const name of ['yaml', 'jsonc-parser']) {
		const from = realpathSync(join(root, 'packages/cli/node_modules', name))
		const pkg = JSON.parse(readFileSync(join(from, 'package.json')))
		assert.equal(
			Object.keys(pkg.dependencies ?? {}).length,
			0,
			name + ' needs a reviewed dependency closure',
		)

		cpSync(from, join(destination, 'node_modules', name), { recursive: true })
		notices += '\n' + name + '@' + pkg.version + '\n'
		for (const file of readdirSync(from).filter((file) => /^license(?:\.|$)/i.test(file))) {
			notices += readFileSync(join(from, file), 'utf8') + '\n'
		}
	}
	writeFileSync(join(destination, 'THIRD-PARTY-NOTICES.txt'), notices)
	const files = Object.fromEntries(
		readdirSync(destination, { recursive: true, withFileTypes: true })
			.filter((file) => file.isFile())
			.map((file) => {
				const path = join(file.parentPath, file.name),
					bytes = readFileSync(path)
				return [
					relative(destination, path).replaceAll('\\', '/'),
					{ bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') },
				]
			})
			.sort(([a], [b]) => a.localeCompare(b)),
	)
	const manifest = {
		version: 1,
		cliVersion: version,
		frameworkVersion: JSON.parse(readFileSync(join(destination, 'compatibility.json')))
			.frameworkVersion,
		entry: 'dist/upgrade-worker.mjs',
		files,
	}
	writeFileSync(join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
	return manifest
}
