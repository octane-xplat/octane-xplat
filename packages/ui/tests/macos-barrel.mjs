import assert from 'node:assert/strict'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { xplatMacOS } from '../../cli/src/macos/vite.mjs'

export async function buildMacOSBarrel(
	root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../apps/macos'),
) {
	const entry = resolve(root, 'ui-macos-barrel-fixture.ts')
	const config = await xplatMacOS('production', { root, packaged: false, entry })
	const result = await build({
		...config,
		configFile: false,
		plugins: [
			...config.plugins,
			{
				name: 'ui-macos-barrel-fixture',
				resolveId(id) {
					if (id === entry) {return entry}
				},
				load(id) {
					if (id === entry) {return `export * from '@octane-xplat/ui'`}
				},
			},
		],
		build: { ...config.build, write: false, minify: false },
	})

	const chunk = (Array.isArray(result) ? result[0] : result).output.find(
		(output) => output.type === 'chunk' && output.isEntry,
	)

	assert.ok(chunk, 'normal UI barrel emits an AppKit fixture')
	assert.ok(chunk.exports.includes('useLayer'), 'fixture retains the public layer API')
	return chunk.exports
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	await buildMacOSBarrel()
	console.log('AppKit normal UI barrel builds with the production platform boundary guard')
}
