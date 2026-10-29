import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createAppKitWebBrowser, type AppKitBrowserNative } from '../src/browser-owner.macos.ts'

function fixture() {
	const views: { native: AppKitBrowserNative; calls: string[] }[] = []
	let available = true
	const browser = createAppKitWebBrowser(() => available ? { accepts(value) { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !!url.hostname } catch { return false } }, create() {
		const calls: string[] = [], native: AppKitBrowserNative = { open(url) { calls.push(`open:${url}`); return true }, close() { calls.push('close') } }
		views.push({ native, calls }); return native
	} } : undefined)
	return { browser, views, unavailable() { available = false } }
}
test('capability is conditional and invalid/non-HTTP URLs never create a window or launch an external browser', async () => {
	const f = fixture(); assert.equal(f.browser.supported, true)
	for (const url of ['not a URL', 'file:///tmp/page.html', 'javascript:alert(1)', 'mailto:test@example.invalid']) assert.deepEqual(await f.browser.openBrowser(url), { type: 'cancel' })
	assert.equal(f.views.length, 0); f.unavailable(); assert.equal(f.browser.supported, false); assert.deepEqual(await f.browser.openBrowser('https://example.invalid'), { type: 'cancel' }); assert.equal(f.views.length, 0)
	await f.browser.warmUp(); await f.browser.coolDown(); await f.browser.mayInitWithUrl('https://example.invalid'); assert.equal(f.views.length, 0)
})
test('opened reports presentation, replacement closes the prior owner, and dismiss is idempotent', async () => {
	const f = fixture()
	assert.deepEqual(await f.browser.openBrowser('https://example.invalid'), { type: 'opened' }); assert.deepEqual(f.views[0].calls, ['open:https://example.invalid'])
	assert.deepEqual(await f.browser.openBrowser('http://example.invalid/help', { showTitle: true }), { type: 'opened' }); assert.deepEqual(f.views[0].calls, ['open:https://example.invalid', 'close'])
	f.browser.dismissBrowser(); f.browser.dismissBrowser(); assert.deepEqual(f.views[1].calls, ['open:http://example.invalid/help', 'close'])
})
test('false/throwing presentation cancels and cleans up, while true/one are explicit accepted native BOOL forms', async () => {
	for (const result of [false, 0, true, 1]) {
		let closes = 0
		const browser = createAppKitWebBrowser(() => ({ accepts: () => true, create: () => ({ open: () => result, close() { closes++ } }) }))
		assert.deepEqual(await browser.openBrowser('https://example.invalid'), { type: result === true || result === 1 ? 'opened' : 'cancel' }); browser.dismissBrowser(); assert.equal(closes, 1)
	}
	let closes = 0
	const browser = createAppKitWebBrowser(() => ({ accepts: () => true, create: () => ({ open() { throw Error('native fault') }, close() { closes++ } }) }))
	assert.deepEqual(await browser.openBrowser('https://example.invalid'), { type: 'cancel' }); assert.equal(closes, 1)
	assert.equal(createAppKitWebBrowser(() => { throw Error('missing bridge') }).supported, false)
})
test('reentrant replacement during old close cannot present or close a later owner', async () => {
	const f = fixture(); await f.browser.openBrowser('https://example.invalid/old')
	let nested: Promise<unknown> | undefined
	f.views[0].native.close = () => { nested = f.browser.openBrowser('https://example.invalid/latest') }
	assert.deepEqual(await f.browser.openBrowser('https://example.invalid/retired'), { type: 'cancel' }); assert.deepEqual(await nested, { type: 'opened' })
	assert.equal(f.views[1].calls.some((call) => call.startsWith('open:')), false); assert.deepEqual(f.views[2].calls, ['open:https://example.invalid/latest'])
	f.browser.dismissBrowser(); assert.equal(f.views[2].calls.at(-1), 'close')
})
test('dismiss during presentation retires the pending result and a subsequent open can recover', async () => {
	let closes = 0, first = true
	const browser = createAppKitWebBrowser(() => ({ accepts: () => true, create: () => ({ open() { if (first) { first = false; browser.dismissBrowser() }; return true }, close() { closes++ } }) }))
	assert.deepEqual(await browser.openBrowser('https://example.invalid/retired'), { type: 'cancel' }); assert.ok(closes >= 1)
	assert.deepEqual(await browser.openBrowser('https://example.invalid/current'), { type: 'opened' }); browser.dismissBrowser()
})
