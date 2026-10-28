import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync, symlinkSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, relative, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { it } from 'node:test'
import { createServer } from 'vite'

const require = createRequire(import.meta.url)
const ns = pathToFileURL(require.resolve('@nativescript/vite'))
const octane = pathToFileURL(require.resolve('@nativescript-community/vite-octane'))
const { HmrModuleGraph } = await import(new URL('./hmr/server/hmr-module-graph.js', ns))
const { computeHotContextId } = await import(new URL('./hmr/server/process-code-for-device.js', ns))
const { rewriteImports } = await import(new URL('./hmr/server/rewrite-imports.js', ns))
const { registerNsModuleServerRoute } = await import(new URL('./hmr/server/websocket-ns-m.js', ns))
const { setProjectFlavor } = await import(new URL('./helpers/flavor.js', ns))

it('shared native modules retain one identity through static imports, hot contexts and edit deltas', async (t) => {
	const workspace = realpathSync(mkdtempSync(join(tmpdir(), 'xplat-shared-hmr-')))
	const root = join(workspace, 'native')
	const native = join(root, 'src/screen.tsx')
	const shared = join(workspace, 'shared/src/screen.tsx')
	const externalRoot = realpathSync(mkdtempSync(join(tmpdir(), 'xplat-external-hmr-')))
	const external = join(externalRoot, 'src/screen.tsx')
	t.after(() => rmSync(externalRoot, { recursive: true, force: true }))
	for (const file of [native, shared, external]) {
		mkdirSync(join(file, '..'), { recursive: true })
		writeFileSync(file, 'export default "baseline";')
	}
	writeFileSync(join(workspace, 'pnpm-workspace.yaml'), 'packages:\n  - native\n')
	writeFileSync(join(root, 'package.json'), '{"type":"module","main":"src/screen.tsx"}')
	mkdirSync(join(root, 'node_modules/@nativescript'), { recursive: true })
	symlinkSync(
		dirname(require.resolve('@nativescript/core/package.json')),
		join(root, 'node_modules/@nativescript/core'),
		'dir',
	)
	const cwd = process.cwd()
	process.chdir(root)
	t.after(() => {
		process.chdir(cwd)
		rmSync(workspace, { recursive: true, force: true })
	})
	setProjectFlavor('javascript')
	const { octaneServerStrategy } = await import(new URL('./server/strategy.js', octane))
	const messages = []
	const wss = { clients: new Set([{ send: (message) => messages.push(JSON.parse(message)) }]) }
	const graph = new HmrModuleGraph({
		verbose: false,
		strategy: octaneServerStrategy,
		getPluginRoot: () => root,
		getWss: () => wss,
	})
	const server = await createServer({
		root,
		configFile: false,
		logLevel: 'silent',
		optimizeDeps: { noDiscovery: true },
		server: { host: '127.0.0.1', port: 0, watch: null, fs: { allow: [workspace, externalRoot] } },
		plugins: [
			{
				name: 'shared-native-module-fixture',
				configureServer(server) {
					registerNsModuleServerRoute(server, {
						verbose: false,
						appVirtualWithSlash: '/src/',
						sfcFileMap: new Map(),
						depFileMap: new Map(),
						getGraphVersion: () => graph.version,
						getStrategy: () => ({ flavor: 'javascript' }),
						depsBundle: null,
						sharedTransformRequest: (id) => server.transformRequest(id),
						ensureInitialGraphPopulationStarted() {},
						upsertGraphModule() {},
					})
				},
			},
		],
	})
	t.after(() => server.close())
	await server.listen()
	const origin = `http://127.0.0.1:${server.httpServer.address().port}`
	const nativeId = graph.normalizeGraphId(native)
	const sharedId = graph.normalizeGraphId(shared)
	assert.equal(nativeId, '/src/screen.tsx')
	assert.equal(sharedId, '/shared/src/screen.tsx')
	assert.notEqual(nativeId, sharedId)
	for (const file of [native, shared, external]) {
		const id = graph.normalizeGraphId(file)
		const key = id.replace(/\.tsx$/, '')
		assert.equal(computeHotContextId(file, root), key)
		assert.equal(graph.normalizeGraphId('/@fs' + file), id)
		assert.equal(graph.normalizeGraphId(pathToFileURL(file).href + '?t=1'), id)
		assert.equal(graph.normalizeGraphId('/' + relative(root, file)), id)
		const rewritten = rewriteImports(
			`import Screen from '/@fs${file}';`,
			native,
			new Map(),
			new Map(),
			root,
			false,
			undefined,
			origin,
			true,
		)

		assert.ok(rewritten.includes('/ns/m' + key), rewritten)
		graph.upsert(file, 'export default "baseline"', [], { bumpVersion: false })
		const response = await fetch(origin + '/ns/m' + key)
		assert.equal(response.status, 200, file)
		const body = await response.text()
		assert.ok(body.includes(`createHotContext(${JSON.stringify(key)})`))
		assert.ok(body.includes('baseline'))
	}
	assert.equal(graph.size, 3)

	for (const file of [native, shared, external]) {
		writeFileSync(file, 'export default "updated";')
		const sharedTransformRequest = (id) => server.transformRequest(id)
		await octaneServerStrategy.handleHotUpdate(
			{ file, server, modules: [server.moduleGraph.getModuleById(file)] },
			{
				moduleGraph: graph,
				wss,
				strategy: octaneServerStrategy,
				verbose: false,
				appRootDir: 'src',
				getHmrSourceRootsCached: () => [
					join(root, 'src'),
					join(workspace, 'shared/src'),
					externalRoot,
				],
				getGraphInitialPopulationPromise: () => null,
				isSocketClientOpen: () => true,
				sharedTransformRequest,
			},
		)

		const id = graph.normalizeGraphId(file)
		assert.equal(messages.at(-1).changed[0].id, id)
		assert.deepEqual(graph.computeTxnOrderForChanged([file]), [id])
		const updated = await fetch(origin + '/ns/m' + id.replace(/\.tsx$/, ''))
		assert.equal(updated.status, 200)
		assert.ok((await updated.text()).includes('updated'))
		assert.equal(graph.size, 3)
	}
	for (const file of [
		'/shared/src/screen.spec.tsx',
		'/shared/src/types.d.ts',
		'/node_modules/vendor/index.ts',
		'/shared/__mocks__/screen.tsx',
	]) {
		assert.equal(octaneServerStrategy.matchesFile(file), false)
	}
})

it('keeps app-root normalization for Windows source paths', () => {
	const graph = new HmrModuleGraph({
		verbose: false,
		strategy: { matchesFile: () => true },
		getWss: () => null,
		getPluginRoot: () => 'C:/workspace/native',
	})
	assert.equal(
		graph.normalizeGraphId('C:\\workspace\\native\\src\\screen.tsx?t=1'),
		'/src/screen.tsx',
	)
	assert.equal(
		computeHotContextId('C:/workspace/native/src/screen.tsx', 'C:/workspace/native'),
		'/src/screen',
	)
})
