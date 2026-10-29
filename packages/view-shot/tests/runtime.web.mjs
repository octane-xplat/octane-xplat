import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { octane } from 'octane/compiler/vite'
const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const server = await createServer({
	root,
	configFile: false,
	plugins: [
		{
			name: 'view-shot-string-only-backend',
			enforce: 'pre',
			resolveId(source, importer) {
				if (source.includes('html2canvas')) {
					throw new Error('Real capture engines are forbidden in this fixture')
				}
				if (source === './backend' && importer?.startsWith(root + '/src/')) {
					return root + '/tests/component-backend.ts'
				}
			},
			load(id) {
				if (/\/src\/backend(?:\.[a-z]+)?\.ts(?:\?|$)/.test(id)) {
					throw new Error('Real capture backends are forbidden in this fixture: ' + id)
				}
			},
		},
		octane({ ssr: false }),
	],
	resolve: {
		conditions: ['web'],
		dedupe: ['octane'],
		extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.js'],
	},
	server: {
		host: '127.0.0.1',
		port: 0,
		fs: { allow: [fileURLToPath(new URL('../../..', import.meta.url))] },
	},
})
let browser
try {
	await server.listen()
	browser = await chromium.launch()
	const page = await browser.newPage()
	await page.route(/\/src\/backend(?:\.|\/)/, (route) => route.abort())
	const errors = []
	page.on('pageerror', (error) => errors.push(error.message))
	await page.goto(server.resolvedUrls.local[0] + 'tests/index.html')
	await page.evaluate(async () => {
		const { fixture } = await import('/tests/component-harness.web.ts')
		globalThis.fixture = fixture
	})
	await page.waitForFunction(() => typeof fixture.ref.current?.capture === 'function')
	assert.equal(await page.evaluate(() => fixture.host.textContent), 'Trip card')
	assert.equal(await page.evaluate(() => fixture.trace.captured.length), 0)
	assert.equal(await page.evaluate(() => fixture.ref.current.capture()), 'owned:fixture-1')
	assert.equal(
		await page.evaluate(() => fixture.trace.captured[0] === document.getElementById('card')),
		true,
	)
	assert.equal(await page.evaluate(() => fixture.captureRef(fixture.ref)), 'owned:fixture-2')
	await page.evaluate(() => fixture.releaseCapture('owned:fixture-1'))
	await page.evaluate(() => fixture.render({ captureMode: 'update' }))
	await page.waitForFunction(() => fixture.trace.captured.length === 3)
	await page.evaluate(() => fixture.render({ captureMode: 'update', children: 'Updated trip' }))
	await page.waitForFunction(() => fixture.trace.captured.length === 4)
	assert.equal(await page.evaluate(() => fixture.host.textContent), 'Updated trip')
	assert.deepEqual(await page.evaluate(() => fixture.trace.released), [
		'owned:fixture-1',
		'owned:fixture-3',
	])
	await page.evaluate(() => fixture.root.unmount())
	assert.equal(await page.evaluate(() => fixture.ref.current), null)
	assert.equal(await page.evaluate(() => fixture.host.textContent), '')
	assert.deepEqual(await page.evaluate(() => fixture.trace.released), [
		'owned:fixture-1',
		'owned:fixture-3',
		'owned:fixture-4',
	])
	assert.deepEqual(errors, [])
	console.log(
		'Chromium: 11 component/ref/lifecycle assertions pass with a string-only backend. No image capture, canvas encoding, screenshot or image inspection occurred.',
	)
} finally {
	await browser?.close()
	await server.close()
}
