import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { it } from 'node:test'
import { createServer } from 'vite'

const ns = pathToFileURL(createRequire(import.meta.url).resolve('@nativescript/vite'))
const { registerNsModuleServerRoute } = await import(new URL('./hmr/server/websocket-ns-m.js', ns))
const { setProjectFlavor } = await import(new URL('./helpers/flavor.js', ns))
setProjectFlavor('javascript')

async function fixture(t) {
	const root = mkdtempSync(join(tmpdir(), 'xplat-default-export-'))
	mkdirSync(join(root, 'src'))
	writeFileSync(join(root, 'package.json'), '{"type":"module"}')
	let graphVersion = 0
	const server = await createServer({
		root,
		configFile: false,
		logLevel: 'silent',
		optimizeDeps: { noDiscovery: true },
		server: { host: '127.0.0.1', port: 0, watch: null },
		plugins: [
			{
				name: 'fixture-native-link-check',
				configureServer(server) {
					registerNsModuleServerRoute(server, {
						verbose: false,
						appVirtualWithSlash: '/src/',
						sfcFileMap: new Map(),
						depFileMap: new Map(),
						getGraphVersion: () => graphVersion,
						getStrategy: () => ({ flavor: 'javascript' }),
						depsBundle: null,
						sharedTransformRequest: (url) => server.transformRequest(url),
						ensureInitialGraphPopulationStarted() {},
						upsertGraphModule() {},
					})
				},
			},
		],
	})
	t.after(async () => {
		await server.close()
		rmSync(root, { recursive: true, force: true })
	})
	await server.listen()
	const origin = `http://127.0.0.1:${server.httpServer.address().port}`
	return {
		root,
		write(name, source) {
			writeFileSync(join(root, 'src', name + '.mjs'), source)
			server.moduleGraph.invalidateAll()
			graphVersion++
		},
		async rejects(name) {
			// Absolute device URLs trigger link checking; relative URLs skip it.
			writeFileSync(
				join(root, 'src', 'import-' + name + '.mjs'),
				`import value from '${origin}/ns/m/src/${name}.mjs'; export { value };`,
			)
			const response = await fetch(origin + '/ns/m/src/import-' + name + '.mjs')
			assert.equal(response.status, 200)
			return (await response.text()).includes('[link-check] Missing default export')
		},
	}
}

it('native HTTP link checking agrees with actual ESM default exports', async (t) => {
	const f = await fixture(t)
	f.write('base', 'export default 17; export const other = 1;')
	const cases = {
		direct: 'export default 17;',
		function: 'export default function named() {}',
		class: 'export default class Named {}',
		aliased: 'const named = 23; export { named as default };',
		multiple: 'const named = 23, other = 1; export { other, named as default };',
		quoted: 'const named = 23; export { named as "default" };',
		reexport: 'export { default } from "./base.mjs";',
		reexportAlias: 'export { other as default } from "./base.mjs";',
		namespace: 'export * as default from "./base.mjs";',
		missing: 'export const named = 99;',
		star: 'export * from "./base.mjs";',
		comment: '// export default 17;\nexport const named = 99;',
		string: 'export const text = "export default 17";',
	}
	for (const [name, source] of Object.entries(cases)) {
		await t.test(name, async () => {
			f.write(name, source)
			const namespace = await import(pathToFileURL(join(f.root, 'src', name + '.mjs')))
			assert.equal(await f.rejects(name), !Object.hasOwn(namespace, 'default'))
		})
	}
})

it('rechecks default exports after the target gains or loses its default', async (t) => {
	const f = await fixture(t)
	for (const source of [
		'export const named = 99;',
		'const named = 23; export { named as default };',
		'export const named = 99;',
		'export default 17;',
	]) {
		f.write('changing', source)
		const namespace = await import(
			pathToFileURL(join(f.root, 'src/changing.mjs')) + '?' + Date.now()
		)

		assert.equal(await f.rejects('changing'), !Object.hasOwn(namespace, 'default'), source)
	}
})
