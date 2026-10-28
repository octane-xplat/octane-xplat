import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'vite'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { octane } from 'octane/compiler/vite'
import { webHost } from '../src/build/vite.ts'
import { JSDOM } from 'jsdom'
import { serve } from 'srvx'
import { staticMiddleware } from 'srvx/static'
import { prerender } from '../src/build/prerender.ts'

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

const craftedDocument = (bootstrap, appHtml = '<main>server output</main>') =>
	'<!doctype html><html><body>' +
	`<div id="__xplat_app">${appHtml}</div>` +
	`<script id="__xplat_document" type="application/json">${bootstrap}</script>` +
	'</body></html>'

test('rejects malformed or mismatched bootstrap data before mutating DOM or history', async () => {
	const rendered = await (await fixture.handler()(request('/items/coat'))).text()
	const bootstrap = /<script id="__xplat_document"[^>]*>([\s\S]*?)<\/script>/.exec(rendered)[1]
	const staleRoute = JSON.parse(bootstrap)
	staleRoute.match.params = { id: 'forged' }
	for (const [document_, error] of [
		[
			craftedDocument('{"version":2,"buildId":"test","url":"/items/coat","mode":"client"}'),
			/does not match/,
		],
		[
			craftedDocument('{"version":1,"buildId":"test","url":"/elsewhere","mode":"client"}'),
			/does not match/,
		],
		[
			craftedDocument('{"version":1,"buildId":"test","url":"/items/coat","mode":"bogus"}'),
			/does not match/,
		],
		[craftedDocument('{not json'), /SyntaxError|JSON/],
		[
			craftedDocument(
				'{"version":1,"buildId":"test","url":"/items/coat","mode":"server",' +
					'"match":{"to":"/items/:id","name":"items/:id","stack":"root","params":{"id":"coat"},' +
					'"search":{},"href":"/items/coat","context":{}}}',
			),
			/Invalid prepared document route/,
		],
		[craftedDocument(JSON.stringify(staleRoute)), /does not match the catalog/],
		[
			'<!doctype html><html><body><div id="__xplat_app"></div></body></html>',
			/Missing Xplat document bootstrap or app container/,
		],
		[
			craftedDocument('{"version":1,"buildId":"test","url":"/items/coat","mode":"client"}').replace(
				'id="__xplat_app"',
				'id="other"',
			),
			/Missing Xplat document bootstrap or app container/,
		],
	]) {
		const { dom, browser, document } = await browserFor(document_)
		try {
			const body = document.body.innerHTML
			await assert.rejects(browser.start(), error, document_)
			assert.equal(document.body.innerHTML, body)
			assert.equal(dom.window.location.pathname, '/items/coat')
		} finally {
			dom.window.close()
		}
	}
})

test('fails hydration before DOM or history mutation when the route module cannot load', async () => {
	const html = await (await fixture.handler()(request('/items/coat'))).text()
	const { dom, browser, document } = await browserFor(html)
	try {
		const node = document.getElementById('item')
		await assert.rejects(
			browser.start({ catalog: browser.failingCatalog }),
			/Could not load the prepared document route module/,
		)

		assert.equal(browser.moduleFailures, 1)
		assert.equal(document.getElementById('item'), node)
		assert.ok(
			document.getElementById('__xplat_document'),
			'the payload stays so a reload can retry',
		)
	} finally {
		dom.window.close()
	}
})

test('rejected initial navigation releases the root, listeners and the consumed payload', async () => {
	const html = await (await fixture.handler({ mode: 'client' })(request('/forbidden'))).text()
	const { dom, browser, document } = await browserFor(html, 'http://localhost/forbidden')
	try {
		await assert.rejects(browser.start(), /Initial client navigation failed/)
		assert.equal(document.getElementById('__xplat_app').innerHTML, '')
		assert.equal(dom.window.location.pathname, '/forbidden')
		assert.ok(!document.getElementById('__xplat_document'), 'the payload is consumed once')
		await assert.rejects(browser.start(), /Missing Xplat document bootstrap/)
	} finally {
		dom.window.close()
	}
})

test('a failing initial route module releases the client root', async () => {
	const html = await (await fixture.handler({ mode: 'client' })(request('/items/coat'))).text()
	const { dom, browser, document } = await browserFor(html)
	try {
		await assert.rejects(
			browser.start({ catalog: browser.failingCatalog }),
			/Initial client navigation failed/,
		)

		assert.equal(browser.moduleFailures, 1)
		assert.equal(document.getElementById('__xplat_app').innerHTML, '')
	} finally {
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

test('aborts a pending transfer or pending document assets when the request disconnects', async () => {
	for (const option of ['transfer', 'assets']) {
		const controller = new AbortController()
		let started
		const ready = new Promise((resolve) => {
			started = resolve
		})

		const pending = fixture.handler({
			[option]() {
				started()
				return new Promise(() => {})
			},
		})(request('/items/coat', { signal: controller.signal }))

		await ready
		controller.abort(new Error('disconnected'))
		await assert.rejects(pending, /disconnected/, option)
	}
	assert.equal((await fixture.handler()(request('/items/coat'))).status, 200)
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

test('incremental prerender reuses public content with fresh assets, document and hydration identity', async () => {
	const directory = await mkdtemp(serverDirectory + '/static-')
	const options = {
		origin: 'http://localhost',
		outDir: directory + '/html',
		cacheFile: directory + '/cache.json',
		revision: 'code-v1',
		paths: async () =>
			['coat', 'hat'].map((id) => ({
				destination: { to: '/items/:id', params: { id } },
				key: 'content-v1',
			})),
	}
	const first = fixture.renderer()
	const before = fixture.loads
	assert.deepEqual(await prerender(first, options), {
		rendered: 2,
		reused: 0,
		paths: ['/items/coat', '/items/hat'],
	})
	assert.equal(fixture.loads, before + 2)
	const template =
		'<!doctype html><html><head><!--xplat:head--></head><body><nav>New document</nav><!--xplat:app--><!--xplat:scripts--></body></html>'
	const second = fixture.renderer({
		buildId: 'test',
		assets: { scripts: ['/current.js'], styles: ['/current.css'] },
		template,
	})
	assert.equal((await prerender(second, options)).reused, 2)
	assert.equal(fixture.loads, before + 2)
	const html = await readFile(directory + '/html/items/coat/index.html', 'utf8')
	assert.match(html, /New document/)
	assert.match(html, /current.js/)
	assert.match(html, /current.css/)
	assert.doesNotMatch(html, /client.js|private-secret/)
	const staticServer = serve({
		port: 0,
		hostname: '127.0.0.1',
		silent: true,
		middleware: [staticMiddleware({ dir: options.outDir })],
		fetch: () => new Response('Not Found', { status: 404 }),
	})
	try {
		await staticServer.ready()
		const served = await fetch(new URL('/items/coat', staticServer.url))
		assert.equal(served.status, 200)
		assert.equal(await served.text(), html)
	} finally {
		await staticServer.close(true)
	}

	const { dom, browser, document } = await browserFor(html)
	let app
	try {
		const node = document.getElementById('item')
		const errors = []
		app = await browser.start({ onRecoverableError: (error) => errors.push(error) })
		assert.equal(document.getElementById('item'), node)
		assert.deepEqual(errors, [])
		assert.equal(browser.loads, 0)
	} finally {
		app?.dispose()
		dom.window.close()
	}
	const nextBuild = fixture.renderer({ buildId: 'next-build' })
	assert.equal((await prerender(nextBuild, options)).reused, 2)
	assert.match(
		await readFile(directory + '/html/items/coat/index.html', 'utf8'),
		/"buildId":"next-build"/,
	)
	const changed = await options.paths()
	changed[0].key = 'content-v2'
	assert.deepEqual(await prerender(second, { ...options, paths: changed }), {
		rendered: 1,
		reused: 1,
		paths: ['/items/coat', '/items/hat'],
	})
	assert.equal(
		(await prerender(second, { ...options, paths: changed, revision: 'code-v2' })).rendered,
		2,
	)
	assert.equal(
		(await prerender(second, { ...options, paths: [{ ...changed[0], key: null }] })).rendered,
		1,
	)
	await assert.rejects(readFile(directory + '/html/items/hat/index.html'), { code: 'ENOENT' })
	const previous = await readFile(directory + '/html/items/coat/index.html', 'utf8')
	for (const path of ['/redirect', '/error', '/forbidden']) {
		await assert.rejects(
			prerender(second, { ...options, paths: [{ destination: { to: path }, key: null }] }),
		)

		assert.equal(await readFile(directory + '/html/items/coat/index.html', 'utf8'), previous)
	}
	await assert.rejects(
		prerender(fixture.renderer({ response: () => ({}) }), {
			...options,
			paths: changed,
			revision: 'private',
		}),
		/Cache-Control: public/,
	)
	await assert.rejects(
		prerender(
			fixture.renderer({
				response: () => ({ headers: { 'Cache-Control': 'public', 'Set-Cookie': 'private=1' } }),
			}),
			{ ...options, paths: changed, revision: 'cookie' },
		),
		/set-cookie/,
	)
	assert.equal(await readFile(directory + '/html/items/coat/index.html', 'utf8'), previous)
	await writeFile(options.cacheFile, '{broken')
	assert.equal((await prerender(second, options)).rendered, 2)
})
