// Same curated CLI worker/plugin closure as the Nim portability gate, without
// a native executable, installer, old CLI runtime, or separate build install.
import assert from 'node:assert/strict'
import { cpSync, mkdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'

export function prepareFixtures(root, work) {
	const output = join(work, 'project-packages')
	mkdirSync(output, { recursive: true })
	const temporary = mkdtempSync(join(work, 'fixture-'))
	try {
		const manifest = JSON.parse(readFileSync(join(root, 'packages/build/package.json')))
		manifest.name = '@octane-xplat/cli'
		manifest.private = true
		delete manifest.scripts
		delete manifest.devDependencies
		// Native CLI installs keep compiler/build engines opt-in, matching the
		// curated native package rather than the Vite-specific build package.
		manifest.peerDependenciesMeta = Object.fromEntries(
			Object.keys(manifest.peerDependencies ?? {}).map((name) => [name, { optional: true }]),
		)

		for (const [name, range] of Object.entries(manifest.dependencies)) {
			if (range === 'workspace:*') {
				manifest.dependencies[name] = JSON.parse(
					readFileSync(join(root, 'packages', name.split('/')[1], 'package.json')),
				).version
			}
		}

		writeFileSync(join(temporary, 'package.json'), JSON.stringify(manifest))
		cpSync(join(root, 'packages/build/dist'), join(temporary, 'dist'), { recursive: true })
		cpSync(join(root, 'LICENSE'), join(temporary, 'LICENSE'))
		const packages = [temporary, join(root, 'packages/lib')].map((directory) => {
			const pkg = JSON.parse(readFileSync(join(directory, 'package.json')))
			const result = spawnSync('bun', ['pm', 'pack', '--ignore-scripts', '--destination', output], {
				cwd: directory,
				encoding: 'utf8',
			})
			assert.equal(result.status, 0, result.stderr)
			const file = `${pkg.name.replace('@', '').replace('/', '-')}-${pkg.version}.tgz`
			const bytes = readFileSync(join(output, file))
			return {
				name: pkg.name,
				file,
				bytes: bytes.length,
				sha256: createHash('sha256').update(bytes).digest('hex'),
			}
		})

		writeFileSync(
			join(work, 'project-packages.json'),
			JSON.stringify({
				version: 1,
				formatter: JSON.parse(readFileSync(join(root, 'packages/cli/package.json'))).dependencies[
					'@octane-xplat/fmt'
				],
				vite: JSON.parse(readFileSync(join(root, 'package.json'))).workspaces.catalog.vite,
				checker: {
					plugin: JSON.parse(readFileSync(join(root, 'package.json'))).workspaces.catalog[
						'@tsrx/typescript-plugin'
					],
					typescript: JSON.parse(readFileSync(join(root, 'package.json'))).workspaces.catalog
						.typescript,
				},
				packages,
			}),
		)
	} finally {
		rmSync(temporary, { recursive: true, force: true })
	}
}
