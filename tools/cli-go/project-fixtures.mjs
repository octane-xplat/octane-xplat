// Isolated selected-project toolchains for native project-command gates.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync, existsSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { prepareFixtures } from './fixtures.mjs'

export function projectToolFixture(root, work, scratch, { checker = false, vite = true } = {}) {
	// Source-host test tasks may run concurrently. Never replace a shared archive
	// while another task is reading its recorded bytes/hash. Portable snapshots
	// instead consume their already-frozen read-only fixture archives.
	let fixtureWork = work
	if (existsSync(join(root, 'packages/build/dist/build-worker.js'))) {
		fixtureWork = join(scratch, 'worker-packages')
		mkdirSync(fixtureWork)
		prepareFixtures(root, fixtureWork)
	}
	const packages = JSON.parse(readFileSync(join(fixtureWork, 'project-packages.json')))
	const deps = Object.fromEntries(
		packages.packages.map((item) => {
			const file = join(fixtureWork, 'project-packages', item.file),
				bytes = readFileSync(file)
			assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256)
			assert.equal(bytes.length, item.bytes)
			return [item.name, `file:${file.replaceAll('\\', '/')}`]
		}),
	)
	const installed = join(scratch, 'installed')
	mkdirSync(installed)
	writeFileSync(
		join(installed, 'package.json'),
		JSON.stringify({
			name: 'go-project-worker-consumer',
			private: true,
			type: 'module',
			devDependencies: {
				...deps,
				...(vite ? { vite: packages.vite } : {}),
				...(checker
					? {
							'@tsrx/typescript-plugin': packages.checker.plugin,
							typescript: packages.checker.typescript,
						}
					: {}),
			},
			overrides: { '@octane-xplat/lib': deps['@octane-xplat/lib'] },
		}),
	)
	const result = spawnSync('bun', ['install', '--ignore-scripts', '--linker', 'isolated'], {
		cwd: installed,
		encoding: 'utf8',
		timeout: 120000,
	})
	assert.equal(result.status, 0, result.stderr)
	return {
		nodeModules: join(installed, 'node_modules'),
		worker: realpathSync(join(installed, 'node_modules/@octane-xplat/cli/dist/build-worker.js')),
		packages,
	}
}
