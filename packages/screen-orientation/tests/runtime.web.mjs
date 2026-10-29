import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
const root = fileURLToPath(new URL('..', import.meta.url))
const server = await createServer({
	root,
	configFile: false,
	resolve: { conditions: ['web'], extensions: ['.web.ts', '.ts', '.js'] },
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
	await page.goto(`${server.resolvedUrls.local[0]}tests/index.html`)
	await page.evaluate(async () => {
		const api = await import('/src/index.web.ts')
		globalThis.orientationFixture = { api, events: [], subscription: undefined }
	})
	const session = await page.context().newCDPSession(page)
	const rotate = (type, angle, width, height) =>
		session.send('Emulation.setDeviceMetricsOverride', {
			mobile: true,
			width,
			height,
			deviceScaleFactor: 1,
			screenOrientation: { type, angle },
		})
	await rotate('portraitPrimary', 0, 400, 800)
	assert.equal(await page.evaluate(() => orientationFixture.api.getOrientationAsync()), 1)
	await page.evaluate(() => {
		const f = orientationFixture
		f.subscription = f.api.addOrientationChangeListener((event) => f.events.push(event))
	})
	await rotate('landscapePrimary', 90, 800, 400)
	await page.waitForFunction(() => orientationFixture.events.length === 1)
	assert.equal(await page.evaluate(() => orientationFixture.api.getOrientationAsync()), 3)
	await rotate('landscapeSecondary', 270, 800, 400)
	await page.waitForFunction(() => screen.orientation.type === 'landscape-secondary')
	assert.equal(await page.evaluate(() => orientationFixture.api.getOrientationAsync()), 4)
	assert.equal(await page.evaluate(() => orientationFixture.events.length), 1)
	await rotate('portraitPrimary', 0, 400, 800)
	await page.waitForFunction(() => orientationFixture.events.length === 2)
	await page.evaluate(() => {
		orientationFixture.subscription.remove()
		orientationFixture.subscription.remove()
	})
	await rotate('landscapePrimary', 90, 800, 400)
	await page.waitForFunction(() => screen.orientation.type === 'landscape-primary')
	assert.equal(await page.evaluate(() => orientationFixture.events.length), 2)
	const result = await page.evaluate(async () => {
		const { api } = orientationFixture
		const before = await api.getOrientationLockAsync()
		let rejected = false
		try {
			await api.lockAsync(api.OrientationLock.PORTRAIT_UP)
		} catch {
			rejected = true
		}
		const after = await api.getOrientationLockAsync()
		await api.unlockAsync()
		return {
			before,
			after,
			rejected,
			unlocked: await api.getOrientationLockAsync(),
			actual: await api.getOrientationAsync(),
		}
	})
	assert.equal(result.rejected, false, 'CDP mobile context accepts locking')
	assert.equal(result.before, 9)
	assert.equal(result.after, 3)
	assert.equal(result.unlocked, 0)
	await page.evaluate(() => {
		const frame = document.createElement('iframe')
		frame.sandbox = 'allow-scripts allow-same-origin'
		frame.src = '/tests/index.html'
		document.body.append(frame)
	})
	await page.waitForFunction(
		() => document.querySelector('iframe')?.contentDocument?.readyState === 'complete',
	)
	const frame = page.frames().find((candidate) => candidate !== page.mainFrame())
	assert.ok(frame)
	const blocked = await frame.evaluate(async () => {
		const api = await import('/src/index.web.ts')
		let errorName
		try {
			await api.lockAsync(api.OrientationLock.PORTRAIT_UP)
		} catch (error) {
			errorName = error.name
		}
		return { errorName, policy: await api.getOrientationLockAsync() }
	})
	assert.ok(blocked.errorName, 'sandboxed document must preserve its real browser policy refusal')
	assert.equal(blocked.policy, 9)
	console.log(
		'Chromium: 12 real Screen Orientation API/state/subscription assertions pass with CDP mobile/screen emulation, accepted policy request, native unlock and sandbox refusal. The CDP screen override does not prove physical rotation or lock enforcement.',
	)
} finally {
	await browser?.close()
	await server.close()
}
