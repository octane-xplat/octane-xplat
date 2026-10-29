import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const server = await createServer({
	configFile: false,
	root: fileURLToPath(new URL('./fixtures', import.meta.url)),
	server: { host: '127.0.0.1', port: 0, fs: { allow: [packageRoot] } },
})
let browser
try {
	await server.listen()
	browser = await chromium.launch({ headless: true })
	const page = await browser.newPage()
	const errors = []
	page.on('pageerror', (error) => errors.push(error.message))
	await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`)
	await page.waitForFunction(() => window.fixture)
	await page.locator('#outside').focus()
	await page.keyboard.press('ControlOrMeta+k')
	assert.deepEqual(await page.evaluate(() => window.fixture.calls), [])
	await page.locator('#editor').focus()
	await page.keyboard.press('ControlOrMeta+k')
	await page.keyboard.type('gi')
	assert.equal(await page.locator('#editor').inputValue(), 'gi')
	await page.keyboard.press('b')
	assert.equal(await page.locator('#editor').inputValue(), 'gi')
	await page.locator('#inside').focus()
	await page.keyboard.type('gi')
	assert.deepEqual(await page.evaluate(() => window.fixture.calls), [
		'palette',
		'blocked-text',
		'inbox',
	])
	await page.evaluate(() => {
		window.recorded = window.fixture.shortcuts.record({
			timeout: 300,
			consumeEvents: true,
		}).finished
	})
	await page.keyboard.press('Control+Shift+x')
	const recording = await page.evaluate(() => window.recorded)
	assert.equal(recording.expression, 'Ctrl+Shift+x')
	await page.evaluate(() => window.fixture.shortcuts.dispose())
	await page.keyboard.type('gi')
	assert.deepEqual(await page.evaluate(() => window.fixture.calls), [
		'palette',
		'blocked-text',
		'inbox',
	])
	assert.deepEqual(errors, [])
	console.log(
		'Chromium: boundary, editable policies, native default prevention, sequences, recording and disposal passed (no screenshots).',
	)
} finally {
	await browser?.close()
	await server.close()
}
