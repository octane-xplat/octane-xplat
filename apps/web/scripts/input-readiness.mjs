import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { chromium, firefox, webkit } from 'playwright'
import { createServer } from 'vite'

const browserName = process.env.XPLAT_WEB_BROWSER ?? 'chromium'
const browserType = { chromium, firefox, webkit }[browserName]
if (!browserType) {
	throw new Error(`Unsupported XPLAT_WEB_BROWSER: ${browserName}`)
}

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
	browser = await browserType.launch({ headless: true })
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
		`${browserName}: keyboard actions, selection replacement, and controlled-write callback counts passed`,
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
		// The background Save action should be absent from role queries while
		// the modal is open. Chromium also exposes the native AX tree via CDP.
		assert.equal(await page.getByRole('button', { name: 'Save', exact: true }).count(), 0)
		if (browserName === 'chromium') {
			const session = await page.context().newCDPSession(page)
			const { nodes } = await session.send('Accessibility.getFullAXTree')
			assert.equal(
				nodes.some((node) => !node.ignored && node.name?.value === 'Save'),
				false,
			)

			await session.detach()
		}

		await page.keyboard.press('Escape')
		try {
			await page.waitForFunction((id) => document.activeElement?.id === id, `open-${name}`, {
				timeout: 10000,
			})
		} catch (error) {
			console.log(
				`${browserName}: ${name} focus restoration diagnostic`,
				await page.evaluate((modalName) => {
					const trigger = document.querySelector(`#open-${modalName}`)
					const active = document.activeElement
					return {
						activeElementId: active?.id,
						activeElement: active?.outerHTML,
						triggerConnected: trigger?.isConnected,
						triggerIsInert: trigger?.closest('[inert]') != null,
						rootInert: document.getElementById('root')?.inert,
						modalLayers: [...document.querySelectorAll('.vx-sheet-layer, .vx-overlay-layer')].length,
					}
				}, name),
			)

			throw error
		}

		assert.equal(await page.locator('#root').evaluate((root) => root.inert), false)
		console.log(
			`${browserName}: ${name} Tab cycle, inert background exclusion, Escape, and focus restoration passed`,
		)
	}

	const sheetOpener = page.locator('#open-sheet')
	await sheetOpener.focus()
	await sheetOpener.press('Enter')
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
	await page.waitForFunction(() => document.activeElement?.id === 'sheet-nested', null, {
		timeout: 10000,
	})

	assert.equal(await page.locator('#root').evaluate((root) => root.inert), true)
	await page.keyboard.press('Escape')
	await page.waitForFunction(() => document.activeElement?.id === 'open-sheet', null, {
		timeout: 10000,
	})

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
		`Input readiness: ${browserName} keyboard, selection, controlled writes, modal focus/accessibility isolation, and Presence reversal passed. IME and screen readers were not exercised.`,
	)
} catch (error) {
	console.error('Input readiness failed', error)
	process.exitCode = 1
} finally {
	try {
		await browser?.close()
	} finally {
		await server.close()
	}
}
