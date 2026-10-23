import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'vite'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { octane } from 'octane/compiler/vite'
import { webHost } from '../src/build/vite.ts'
import { JSDOM } from 'jsdom'
import { serve } from 'srvx'
import { staticMiddleware } from 'srvx/static'

let fixture, clientBundle, serverDirectory
const root = new URL('..', import.meta.url).pathname
const resolve = { conditions: ['web'], extensions: ['.web.tsrx', '.tsrx', '.web.ts', '.ts', '.js'] }
before(async () => {
	const bundle = await build({
		root,
		configFile: false,
		plugins: [webHost(), octane()],
		resolve,
		ssr: { noExternal: ['@octane-xplat/ui', '@octane-xplat/lib', '@octane-xplat/platform'] },
		build: { write: false, ssr: root + '/test/fixtures/server.web.ts', minify: false },
	})
	serverDirectory = await mkdtemp(root + '/test/.bundle-')
	const path = serverDirectory + '/server.mjs'
	await writeFile(path, bundle.output.find((entry) => entry.type === 'chunk').code)
	fixture = await import(pathToFileURL(path).href)
})

after(async () => {
	if (serverDirectory) {
		await rm(serverDirectory, { recursive: true, force: true })
	}
})

const request = (path, init) => new Request('http://localhost' + path, init)

test('prepares HTML and metadata with explicit public transfer and response headers', async () => {
	const response = await fixture.handler({
		response: () => ({ status: 201, headers: { 'X-App': 'yes' } }),
	})(request('/items/coat'))
	assert.equal(response.status, 201)
	assert.equal(response.headers.get('X-App'), 'yes')
	const html = await response.text()
	assert.match(html, /server\/coat/)
	assert.match(html, /<title>server\/coat<\/title>/)
	assert.doesNotMatch(html, /private-secret|private-error/)
	assert.match(html, /application\/json/)
	assert.match(html, /\/client.js/)
	assert.match(html, /\/app.css/)
})

test('preserves HTTP outcomes, hides errors, and supports HEAD', async () => {
	const errors = []
	const handler = fixture.handler({ onError: (error) => errors.push(error) })
	for (const [path, status] of [
		['/absent', 404],
		['/forbidden', 403],
		['/missing', 404],
		['/error', 500],
		['/render-error', 500],
		['/invalid', 400],
		['/response', 418],
		['/redirect', 302],
	]) {
		const response = await handler(request(path))
		assert.equal(response.status, status, path)
		if (status === 302) {
			assert.equal(response.headers.get('Location'), '/items/coat')
		}

		if (status === 418) {
			assert.equal(response.headers.get('X-Route'), 'preserved')
			assert.equal(await response.text(), 'custom')
		}

		if (status === 500) {
			assert.equal(await response.text(), 'Internal Server Error')
		}
	}
	assert.equal(errors.length, 2)
	const head = await handler(request('/items/coat', { method: 'HEAD' }))
	assert.equal(head.status, 200)
	assert.equal(await head.text(), '')
	assert.equal((await handler(request('/items/coat', { method: 'POST' }))).status, 405)
})

test('isolates concurrent request context and supports a component document or template', async () => {
	const handler = fixture.handler({
		Document: fixture.Document,
		context: async (request) => {
			await new Promise((resolve) =>
				setTimeout(resolve, request.headers.get('X-Viewer') === 'A' ? 20 : 1),
			)
			return { viewer: request.headers.get('X-Viewer') }
		},
	})
	const texts = await Promise.all(
		['A', 'B'].map(async (viewer) =>
			(
				await handler(request('/items/coat', { headers: { 'X-Viewer': viewer, 'X-Lang': 'fr' } }))
			).text(),
		),
	)
	assert.match(texts[0], /A\/coat/)
	assert.doesNotMatch(texts[0], /B\/coat/)
	assert.match(texts[1], /B\/coat/)
	assert.match(texts[0], /lang="fr"/)
	const template =
		'<!doctype html><html><head><!--xplat:head--></head><body><nav>Template</nav><!--xplat:app--><!--xplat:scripts--></body></html>'
	assert.match(
		await (await fixture.handler({ template })(request('/items/coat'))).text(),
		/<nav>Template<\/nav>/,
	)
})

test('srvx serves assets and preserves the Fetch handler over real HTTP', async () => {
	const assets = await mkdtemp(serverDirectory + '/assets-')
	await writeFile(assets + '/client.js', 'globalThis.assetLoaded = true')
	const headers = new Headers({ 'X-App': 'srvx' })
	headers.append('Set-Cookie', 'first=1; Path=/; HttpOnly')
	headers.append('Set-Cookie', 'second=2; Path=/; HttpOnly')
	const server = serve({
		port: 0,
		hostname: '127.0.0.1',
		silent: true,
		middleware: [staticMiddleware({ dir: assets })],
		fetch: fixture.handler({ response: () => ({ status: 201, headers }) }),
	})
	try {
		await server.ready()
		const page = await fetch(new URL('/items/coat', server.url))
		assert.equal(page.status, 201)
		assert.equal(page.headers.get('X-App'), 'srvx')
		assert.deepEqual(page.headers.getSetCookie(), headers.getSetCookie())
		assert.match(await page.text(), /server\/coat/)
		const asset = await fetch(new URL('/client.js', server.url))
		assert.equal(asset.status, 200)
		assert.match(asset.headers.get('Content-Type'), /javascript/)
		assert.equal(await asset.text(), 'globalThis.assetLoaded = true')
		const missing = await fetch(new URL('/missing.js', server.url))
		assert.equal(missing.status, 404)
		assert.equal(await missing.text(), 'Not Found')
		const redirect = await fetch(new URL('/redirect', server.url), { redirect: 'manual' })
		assert.equal(redirect.status, 302)
		assert.equal(redirect.headers.get('Location'), '/items/coat')
		const head = await fetch(new URL('/items/coat', server.url), { method: 'HEAD' })
		assert.equal(head.status, 201)
		assert.equal(await head.text(), '')
	} finally {
		await server.close(true)
	}
})

test('rejects non-JSON projections and escapes script-closing data', async () => {
	for (const data of [undefined, new Date(), NaN, { fn() {} }]) {
		assert.equal(
			(await fixture.handler({ transfer: () => ({ data, context: {} }) })(request('/items/coat')))
				.status,
			500,
		)
	}
	const html = await (
		await fixture.handler({
			transfer: () => ({ data: { label: '</script><script>bad()</script>' }, context: {} }),
		})(request('/items/coat'))
	).text()
	const dom = new JSDOM(html)
	assert.equal(dom.window.document.querySelectorAll('script').length, 2)
	assert.equal(dom.window.document.querySelector('script[type=module]').src, '/client.js')
	dom.window.close()
	assert.match(html, /\\u003c\/script\\u003e/)
})

async function browserFor(html, url = 'http://localhost/items/coat') {
	const dom = new JSDOM(html, { url, pretendToBeVisual: true, runScripts: 'outside-only' })
	dom.window.matchMedia = () => ({
		matches: false,
		addEventListener() {},
		removeEventListener() {},
	})
	dom.window.scrollTo = () => {}
	if (!clientBundle) {
		const bundle = await build({
			root,
			configFile: false,
			define: { 'process.env.NODE_ENV': '"production"' },
			plugins: [webHost(), octane({ ssr: false, hmr: false })],
			resolve: { conditions: ['web'], extensions: ['.web.tsrx', '.tsrx', '.web.ts', '.ts', '.js'] },
			build: {
				write: false,
				minify: false,
				lib: { entry: root + '/test/fixtures/client.web.ts', name: 'WebTest', formats: ['iife'] },
			},
		})

		clientBundle = (Array.isArray(bundle) ? bundle[0] : bundle).output.find(
			(entry) => entry.type === 'chunk',
		).code
	}
	dom.window.eval(clientBundle)
	return { dom, browser: dom.window.WebTest, document: dom.window.document }
}

test('adopts server DOM without rerunning preparation, then uses the ordinary client pipeline', async () => {
	const html = await (await fixture.handler()(request('/items/coat'))).text()
	const { dom, browser, document } = await browserFor(html)
	let app
	try {
		const button = document.getElementById('item')
		const id = button.getAttribute('data-id')
		const recoveries = []
		app = await browser.start({ onRecoverableError: (error) => recoveries.push(error) })
		assert.deepEqual(recoveries, [])
		await new Promise((resolve) => setTimeout(resolve, 30))
		assert.equal(document.getElementById('item'), button, 'hydration must preserve DOM identity')
		assert.equal(button.getAttribute('data-id'), id)
		assert.equal(browser.moduleLoads, 1)
		assert.equal(browser.loads, 0)
		assert.equal(browser.guards, 0)
		button.click()
		await new Promise((resolve) => setTimeout(resolve, 30))
		assert.equal(button.textContent, 'server/coat:1')
		const result = await app.router.push({ to: '/items/:id', params: { id: 'hat' } })
		assert.equal(result.status, 'committed')
		assert.equal(browser.loads, 1)
		assert.equal(browser.guards, 1)
		assert.equal(document.getElementById('item').textContent, 'client/hat:0')
		assert.equal(document.title, 'client/hat')
		assert.equal((await app.router.back()).status, 'committed')
		assert.equal(browser.loads, 2)
		assert.equal(browser.guards, 2)
		assert.equal(document.getElementById('item').textContent, 'client/coat:0')
	} finally {
		app?.dispose()
		dom.window.close()
	}
})

test('client-only documents prepare on startup and reject stale hydration before mutation', async () => {
	const before = fixture.loads
	const html = await (await fixture.handler({ mode: 'client' })(request('/items/coat'))).text()
	assert.equal(fixture.loads, before)
	const { dom, browser, document } = await browserFor(html)
	let app
	try {
		const content = document.body.innerHTML
		await assert.rejects(browser.start({ buildId: 'stale' }), /does not match/)
		assert.equal(document.body.innerHTML, content)
		app = await browser.start()
		assert.equal(browser.loads, 1)
		assert.equal(browser.guards, 1)
		assert.equal(document.getElementById('item').textContent, 'client/coat:0')
	} finally {
		app?.dispose()
		dom.window.close()
	}
})

test('aborts preparation when the request disconnects', async () => {
	const controller = new AbortController()
	let started
	const ready = new Promise((resolve) => {
		started = resolve
	})
	const pending = fixture.handler({
		context: () => ({
			delay() {
				started()
				return new Promise(() => {})
			},
		}),
	})(request('/items/coat', { signal: controller.signal }))
	await ready
	controller.abort(new Error('disconnected'))
	await assert.rejects(pending, /disconnected/)
})

test('custom app scopes and named-stack deep links hydrate through the public outlet', async () => {
	const response = await fixture.handler({ App: fixture.App, stacks: ['side'] })(
		request('/@side/items/coat'),
	)
	assert.equal(response.status, 200)
	const { dom, browser, document } = await browserFor(
		await response.text(),
		'http://localhost/@side/items/coat',
	)
	let app
	try {
		const node = document.getElementById('item')
		const recoveries = []
		app = await browser.start({
			App: browser.App,
			stacks: ['side'],
			onRecoverableError: (error) => recoveries.push(error),
		})

		assert.deepEqual(recoveries, [])
		assert.equal(document.getElementById('item'), node)
		assert.equal(app.router.forStack('side').getSnapshot().route.params.id, 'coat')
	} finally {
		app?.dispose()
		dom.window.close()
	}
})
