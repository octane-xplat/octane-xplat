import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'

// A dedicated fixture and OS-assigned port: no screenshots or shared :5200.
const server = await createServer({
	root: fileURLToPath(new URL('..', import.meta.url)),
	server: { port: 0, host: '127.0.0.1', strictPort: true },
	plugins: [
		{
			name: 'input-readiness-fixture',
			configureServer(server) {
				server.middlewares.use('/__input_readiness', async (_req, res) => {
					res.setHeader('Content-Type', 'text/html')
					res.end(
						await server.transformIndexHtml(
							'/__input_readiness',
							'<div id="root"></div><script type="module" src="/test/input-readiness.web.tsrx"></script>',
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
	browser = await chromium.launch({ headless: true })
	const page = await browser.newPage()
	page.setDefaultTimeout(120000)
	const errors = []
	page.on('pageerror', (error) => errors.push(error.message))
	await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__input_readiness`)
	await page.waitForSelector('#action')
	const focused = () => page.evaluate(() => document.activeElement?.id)
	await page.keyboard.press('Tab')
	assert.equal(await focused(), 'action')
	await page.keyboard.press('Enter')
	await page.keyboard.press('Space')
	assert.equal(await page.locator('#count').textContent(), '2')
	await page.keyboard.press('Tab')
	assert.equal(await focused(), 'input') // disabled action skipped
	await page.locator('#input').evaluate((input) => input.setSelectionRange(2, 4))
	await page.keyboard.type('XY')
	assert.equal(await page.locator('#input').inputValue(), 'heXYo')
	assert.equal(await page.locator('#changes').textContent(), '2')
	console.log(
		'Chromium: keyboard actions, selection replacement, and controlled-write callback counts passed',
	)

	assert.equal(await page.locator('#input').evaluate((input) => input.selectionStart), 4)
	await page.locator('#write').click()
	assert.equal(await page.locator('#input').inputValue(), 'replacement')
	assert.equal(await page.locator('#changes').textContent(), '2')

	for (const name of ['sheet', 'overlay']) {
		await page.locator(`#open-${name}`).click()
		await page.waitForFunction((id) => document.activeElement?.id === id, `${name}-first`)
		assert.equal(await page.locator('#root').evaluate((root) => root.inert), true)
		await page.keyboard.press('Shift+Tab')
		assert.equal(await focused(), `${name}-last`)
		await page.keyboard.press('Tab')
		assert.equal(await focused(), `${name}-first`)
		// Chromium AX snapshot is tree evidence, not a screen-reader run.
		const session = await page.context().newCDPSession(page)
		const { nodes } = await session.send('Accessibility.getFullAXTree')
		assert.equal(
			nodes.some((node) => !node.ignored && node.name?.value === 'Save'),
			false,
		)

		await session.detach()
		await page.keyboard.press('Escape')
		await page.waitForFunction((id) => document.activeElement?.id === id, `open-${name}`)
		assert.equal(await page.locator('#root').evaluate((root) => root.inert), false)
		console.log(
			`Chromium: ${name} Tab cycle, AX background isolation, Escape, and focus restoration passed`,
		)
	}

	await page.locator('#open-sheet').click()
	try {
		await page.waitForFunction(() => document.activeElement?.id === 'sheet-first', null, {
			timeout: 10000,
		})
	} catch (error) {
		console.log(
			'Reopen diagnostic:',
			await page.evaluate(() => ({
				focus: document.activeElement?.id,
				sheets: [...document.querySelectorAll('.vx-sheet-layer')].map((node) => node.outerHTML),
				backgroundInert: document.getElementById('root').inert,
			})),
			errors,
		)

		throw error
	}

	await page.locator('#sheet-nested').click()
	await page.waitForFunction(() => document.activeElement?.id === 'overlay-first')
	await page.keyboard.press('Escape')
	await page.waitForFunction(() => document.activeElement?.id === 'sheet-nested')
	assert.equal(await page.locator('#root').evaluate((root) => root.inert), true)
	await page.keyboard.press('Escape')
	await page.waitForFunction(() => document.activeElement?.id === 'open-sheet')

	await page.locator('#presence-input').focus()
	// Invoke the exit control without transferring input focus first.
	await page.locator('#exit').evaluate((button) => button.click())
	await page.waitForFunction(() => document.querySelector('#presence-input')?.closest('[inert]'))
	assert.notEqual(await focused(), 'presence-input')
	assert.equal(
		await page
			.locator('#presence-input')
			.evaluate((input) => input.closest('[aria-hidden="true"]') !== null),
		true,
	)

	await page.locator('#reverse').click()
	await page.waitForFunction(() => !document.querySelector('#presence-input')?.closest('[inert]'))
	await page.locator('#presence-input').focus()
	assert.equal(await focused(), 'presence-input')
	assert.deepEqual(errors, [])
	console.log(
		'Input readiness: Chromium keyboard, selection, controlled writes, modal focus/AX isolation, and Presence reversal passed. IME and screen readers were not exercised.',
	)
} finally {
	await browser?.close()
	await server.close()
}
