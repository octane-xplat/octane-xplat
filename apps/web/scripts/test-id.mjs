import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { chromium, firefox, webkit } from 'playwright'
import { createServer } from 'vite'

const browserName = process.env.XPLAT_WEB_BROWSER ?? 'chromium'
const browserType = { chromium, firefox, webkit }[browserName]
const argent = process.argv.includes('--argent')
if (!browserType || (argent && browserName !== 'chromium')) {
	throw new Error('Argent qualification requires Chromium')
}

const server = await createServer({
	root: fileURLToPath(new URL('..', import.meta.url)),
	server: { port: 0, host: '127.0.0.1', strictPort: true },
	plugins: [
		{
			name: 'test-id-fixture',
			configureServer(server) {
				server.middlewares.use('/__test_id', async (_req, res) => {
					res.setHeader('Content-Type', 'text/html')
					res.end(
						await server.transformIndexHtml(
							'/__test_id',
							'<div id="root"></div><script type="module" src="/test/test-id.web.tsrx"></script>',
						),
					)
				})
			},
		},
	],
})

let browser
try {
	await server.listen()
	browser = await browserType.launch({
		headless: true,
		args: argent ? ['--remote-debugging-port=19329'] : [],
	})

	const page = await browser.newPage()
	const errors = []
	page.on('pageerror', (error) => errors.push(error.message))
	await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__test_id`)
	await page.waitForSelector('[data-testid="counter.increment"]', { timeout: 120000 })
	const byID = (id) => page.locator(`[data-testid="${id}"]`)
	assert.equal(await byID('counter.increment').getAttribute('id'), 'legacy-increment')
	assert.equal(await byID('counter.increment').getAttribute('aria-label'), 'Increment')
	assert.equal(await byID('counter.increment').getAttribute('role'), 'button')
	assert.equal(await byID('message.entry').getAttribute('id'), 'legacy-entry')
	for (const [id, tag] of [
		['message.entry', 'INPUT'],
		['message.notes', 'TEXTAREA'],
		['message.search', 'INPUT'],
	]) {
		assert.equal(await byID(id).count(), 1)
		assert.equal(await byID(id).evaluate((el) => el.tagName), tag)
	}

	assert.equal(await byID('counter.group').locator('[data-testid="counter.increment"]').count(), 1)
	const original = await byID('item.a.open').elementHandle()
	await byID('items.rebind').click()
	assert.equal(await byID('item.a.open').count(), 0)
	assert.equal(await original.evaluate((el) => el.dataset.testid), 'item.b.open')
	await byID('item.b.open').click()
	assert.equal(await byID('counter.value').textContent(), 'Count: 1')
	await byID('items.rebind').click()
	assert.equal(await original.evaluate((el) => el.hasAttribute('data-testid')), false)
	assert.equal(await original.evaluate((el) => el.getAttribute('aria-label')), 'Reusable item')
	for (let i = 0; i < 2; i++) {
		await byID('overlay.open').click()
		await byID('overlay.content').waitFor()
		assert.equal(await byID('overlay.content').locator('[data-testid="overlay.close"]').count(), 1)
		await byID('overlay.close').click()
		await byID('overlay.content').waitFor({ state: 'detached' })
	}

	await page.reload()
	await byID('counter.increment').waitFor()
	if (argent) {
		const env = { ...process.env, DO_NOT_TRACK: '1', ARGENT_CHROMIUM_PORTS: '19329' }
		for (const args of [
			['run', 'describe', '--udid', 'chromium-cdp-19329', '--json'],
			[
				'flow',
				'run',
				fileURLToPath(new URL('../../../examples/automation/test-id-web.yaml', import.meta.url)),
				'--device',
				'chromium-cdp-19329',
				'--json',
			],
		]) {
			const result = spawnSync('pnpm', ['dlx', '@swmansion/argent@0.27.0', ...args], {
				env,
				encoding: 'utf8',
				timeout: 120000,
			})

			await writeFile(`/tmp/laurence-web-${args[0]}.json`, result.stdout)
			assert.equal(result.status, 0, result.stdout + result.stderr)
		}
	}

	assert.deepEqual(errors, [])
	console.log(
		`${browserName}: stable host IDs, legacy IDs/labels, retained-host rebind/removal, parent/child and overlay lifecycle passed${argent ? '; Argent describe and replay passed' : ''}`,
	)
} finally {
	await browser?.close()
	await server.close()
}
