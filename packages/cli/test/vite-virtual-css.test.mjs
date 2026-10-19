import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { runInNewContext } from 'node:vm'
import { it } from 'node:test'
import { createServer } from 'vite'
import { pxToDip, xplatCss } from '../dist/vite.js'

const ns = pathToFileURL(createRequire(import.meta.url).resolve('@nativescript/vite'))
const { astNormalizeModuleImportsAndHelpers: normalize } = await import(
	new URL('./hmr/helpers/ast-normalizer.js', ns)
)

const { registerNsModuleServerRoute } = await import(new URL('./hmr/server/websocket-ns-m.js', ns))
const { setProjectFlavor } = await import(new URL('./helpers/flavor.js', ns))
setProjectFlavor('javascript')
const { handleCssUpdates } = await import(new URL('./hmr/client/css-handler.js', ns))
const { createSharedTransformRequestRunner } = await import(
	new URL('./hmr/server/shared-transform-request.js', ns)
)

const { virtualCssUpdates } = await import(new URL('./hmr/server/css-device-module.js', ns))
const sheet = '/@id/__x00__virtual:bamboo.css'

it('preserves virtual stylesheets while filtering browser-only virtual helpers and the Vite client', () => {
	for (const id of [
		sheet,
		'\0virtual:fixture.scss?x=1',
		'/@id/__x00__@oxc-project+runtime/helpers.js',
	]) {
		assert.ok(
			normalize(`import ${JSON.stringify(id)}; export const ready = true;`).includes(
				id.replace('\0', '\\u0000'),
			),
		)
	}
	const code = normalize(
		'import "/@vite/client"; import "/@id/__x00__vite/browser-helper.js"; export const ready = true;',
	)
	assert.doesNotMatch(code, /vite\/client|browser-helper/)
})

it('serves virtual and file CSS through real native HTTP registration and HMR text responses', async (t) => {
	const root = mkdtempSync(join(tmpdir(), 'xplat-virtual-css-'))
	mkdirSync(join(root, 'src'))
	writeFileSync(join(root, 'package.json'), '{"type":"module"}')
	writeFileSync(
		join(root, 'src/main.ts'),
		`import 'virtual:bamboo.css'; import sheet from 'virtual:bamboo.css'; import './file.css'; export { sheet }; export const ready = true`,
	)
	const file = join(root, 'src/file.css')
	writeFileSync(file, '.file { width: 54px; height: 54px; }')
	let css =
		'@layer base, utilities; @layer utilities { .fixed { width: 31px; height: 36px; letter-spacing: 0.2em; } } @platform web { .browser { width: 999px; } }'
	let sharedTransformRequest
	const vite = await createServer({
		root,
		configFile: false,
		logLevel: 'silent',
		optimizeDeps: { noDiscovery: true },
		server: { host: '127.0.0.1', port: 0, watch: null },
		plugins: [
			xplatCss('android'),
			pxToDip(),
			{
				name: 'fixture-virtual-stylesheet',
				resolveId(id) {
					if (
						id.split('?')[0] === 'virtual:bamboo.css' ||
						id.split('?')[0] === '\0virtual:bamboo.css'
					) {
						return id.startsWith('\0') ? id : '\0' + id
					}
				},
				load(id) {
					if (id.split('?')[0] === '\0virtual:bamboo.css') {
						return css
					}
				},
			},
			{
				name: 'fixture-native-http',
				configureServer(server) {
					sharedTransformRequest = createSharedTransformRequestRunner(
						(url) => server.transformRequest(url),
						undefined,
						{ resultCacheTtlMs: 60000 },
					)
					registerNsModuleServerRoute(server, {
						verbose: false,
						appVirtualWithSlash: '/src/',
						sfcFileMap: new Map(),
						depFileMap: new Map(),
						getGraphVersion: () => 0,
						getStrategy: () => ({}),
						depsBundle: null,
						sharedTransformRequest,
						ensureInitialGraphPopulationStarted() {},
						upsertGraphModule() {},
					})
				},
			},
		],
	})
	try {
		await vite.listen()
		const origin = `http://127.0.0.1:${vite.httpServer.address().port}`
		const get = async (path) => {
			const response = await fetch(origin + path)
			assert.equal(response.status, 200, path)
			return { code: await response.text(), type: response.headers.get('content-type') }
		}

		assert.match((await get('/src/main.ts')).code, /__x00__virtual:bamboo\.css/)
		const main = (await get('/ns/m/src/main.ts')).code
		assert.match(main, /\/ns\/m\/@id\/__x00__virtual:bamboo\.css/)
		assert.match(main, /file\.css/)
		assert.match(main, /import sheet from/)
		const register = async (path, expected) => {
			const { code, type } = await get('/ns/m' + path)
			assert.match(type, /javascript/)
			assert.doesNotMatch(code, /__vite__updateStyle|@vite\/client|@layer|999/)
			const calls = []
			const context = { __NS_REGISTER_CSS__: (tag, text) => calls.push([tag, text]) }
			runInNewContext(code.replace(/export default __ns_css_text__;/, ''), context)
			assert.equal(calls.length, 1)
			assert.equal(calls[0][0], path)
			assert.match(calls[0][1], expected)
			// Registration can also precede HMR client installation.
			const pending = {}
			runInNewContext(code.replace(/export default __ns_css_text__;/, ''), pending)
			assert.equal(pending.__NS_PENDING_CSS__[path], calls[0][1])
			return calls[0][1]
		}

		const initial = await register(sheet, /width:\s*31dip;\s*height:\s*36dip/)
		assert.match(initial, /letter-spacing:\s*0\.2;/)
		await register('/src/file.css', /width:\s*54dip/)
		// Native HTTP alone must establish the canonical CSS HMR boundary.
		assert.ok(vite.moduleGraph.getModuleById('\0virtual:bamboo.css').isSelfAccepting)
		const messages = []
		const send = vite.ws.send.bind(vite.ws)
		vite.ws.send = (payload, ...args) => {
			messages.push(payload)
			return send(payload, ...args)
		}

		const tagged = new Map([
			['app.css', '.global { color: red; }'],
			[sheet, initial],
		])

		let restyles = 0
		const previousRegistry = globalThis.__nsVendorRegistry
		globalThis.__nsVendorRegistry = new Map([
			[
				'@nativescript/core',
				{
					removeTaggedAdditionalCSS: (tag) => tagged.delete(tag),
					addTaggedAdditionalCSS: (text, tag) => tagged.set(tag, text),
					Application: { on() {}, getRootView: () => ({ _onCssStateChange: () => restyles++ }) },
				},
			],
		])

		t.after(() => {
			if (previousRegistry === undefined) {
				delete globalThis.__nsVendorRegistry
			} else {
				globalThis.__nsVendorRegistry = previousRegistry
			}
		})

		for (const next of ['.fixed { width: 41px; height: 46px; }', '']) {
			css = next
			const node = vite.moduleGraph.getModuleById('\0virtual:bamboo.css')
			vite.moduleGraph.invalidateModule(node)
			await vite.reloadModule(node)
			const payload = messages.findLast((message) => message?.type === 'update')
			assert.ok(payload, 'Vite emits an update for the plugin virtual sheet')
			const [update] = virtualCssUpdates(payload)
			assert.equal(update.path, '/ns/m' + sheet)
			assert.equal(update.tag, sheet)
			const response = await get(update.path + '?direct=1&t=' + update.timestamp)
			assert.match(response.type, /text\/css/)
			assert.equal(response.code, await register(sheet, next ? /41dip/ : /empty stylesheet/))
			await handleCssUpdates([update], origin)
			assert.equal(tagged.get(sheet), response.code)
			assert.equal(tagged.get('app.css'), '.global { color: red; }')
		}

		assert.equal(restyles, 2)
		writeFileSync(file, '.file { height: 64px; }')
		// Ordinary file changes also purge the NativeScript request cache.
		sharedTransformRequest.clear()
		vite.moduleGraph.invalidateAll()
		await register('/src/file.css', /height:\s*64dip/)
		await handleCssUpdates(
			[{ path: '/src/file.css', tag: '/src/file.css', timestamp: Date.now() }],
			origin,
		)

		assert.match(tagged.get('/src/file.css'), /height:\s*64dip/)
		assert.equal(tagged.get('app.css'), '.global { color: red; }')
		assert.deepEqual(
			virtualCssUpdates({
				type: 'update',
				updates: [
					{ type: 'css-update', path: '/src/file.css' },
					{ type: 'js-update', path: '/src/main.ts' },
				],
			}),
			[],
		)

		// A broken virtual compiler must fail, never leak raw CSS into native ESM.
		css = '.broken {'
		vite.moduleGraph.invalidateAll()
		assert.equal((await fetch(origin + '/ns/m' + sheet)).status, 500)
	} finally {
		await vite.close()
		rmSync(root, { recursive: true, force: true })
	}
})

it('defers Bamboo build adaptation until emitted assets, after validation', () => {
	const plugin = pxToDip()
	plugin.configResolved({ command: 'build' })
	const css = '@layer utilities { .fixed { width: 31px; } }'
	const context = { warn: (message) => assert.fail(message) }
	assert.equal(plugin.transform.call(context, css, '\0virtual:bamboo.css'), undefined)
	const asset = { type: 'asset', fileName: 'bamboo.css', source: css }
	plugin.generateBundle.call(context, {}, { 'bamboo.css': asset })
	assert.match(asset.source, /31dip/)
	assert.doesNotMatch(asset.source, /@layer/)
})
