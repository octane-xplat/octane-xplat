import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadConfigFromFile } from 'vite'
import { hasWeb, buildTargets, discoverTargets } from '../dist/targets.js'
import { detectPlatforms, discoverWorkspace } from '../dist/mcp/discovery.js'

for (const extension of ['js', 'mjs', 'ts', 'cjs', 'mts', 'cts']) {
	test(`CLI and agent discovery recognize Vite's ${extension} config`, async () => {
		const root = await realpath(await mkdtemp(join(tmpdir(), 'xplat-web-target-')))
		try {
			await writeFile(
				join(root, 'package.json'),
				JSON.stringify({
					name: 'web-target-fixture',
					private: true,
					type: 'module',
					dependencies: { '@octane-xplat/ui': '*' },
				}),
			)

			const configFile = join(root, `vite.config.${extension}`)
			await writeFile(
				configFile,
				`${extension.startsWith('c') ? 'module.exports =' : 'export default'} { define: { __CONFIG_KIND__: ${JSON.stringify(extension)} } }`,
			)

			// Verify the supported filenames against the installed public Vite API,
			// not another copy of this CLI's detection list.
			const loaded = await loadConfigFromFile(
				{ command: 'serve', mode: 'development' },
				undefined,
				root,
				'silent',
			)

			assert.equal(loaded.path, configFile)
			assert.equal(loaded.config.define.__CONFIG_KIND__, extension)
			assert.equal(hasWeb(root), true)
			assert.deepEqual(
				buildTargets(root).map((target) => target.kind),
				['web'],
			)

			assert.deepEqual(
				discoverTargets(root).map((target) => target.kind),
				['web'],
			)

			assert.deepEqual(detectPlatforms(root), ['web'])
			assert.deepEqual(
				discoverWorkspace(root).apps.map((app) => ({ id: app.id, platforms: app.platforms })),
				[{ id: '.', platforms: ['web'] }],
			)
		} finally {
			await rm(root, { recursive: true, force: true })
		}
	})
}

test('an app without a conventional Vite config does not advertise a web target', async () => {
	const root = await mkdtemp(join(tmpdir(), 'xplat-no-web-target-'))
	try {
		await writeFile(
			join(root, 'package.json'),
			JSON.stringify({ private: true, dependencies: { '@octane-xplat/ui': '*' } }),
		)

		await writeFile(join(root, 'vite.other.ts'), 'export default {}')
		assert.equal(hasWeb(root), false)
		assert.deepEqual(buildTargets(root), [])
		assert.deepEqual(discoverTargets(root), [])
		assert.deepEqual(detectPlatforms(root), [])
		assert.deepEqual(discoverWorkspace(root).apps, [])
	} finally {
		await rm(root, { recursive: true, force: true })
	}
})
