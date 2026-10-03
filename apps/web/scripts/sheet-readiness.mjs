import assert from 'node:assert/strict'
import { chromium, firefox, webkit } from 'playwright'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const webDir = fileURLToPath(new URL('..', import.meta.url))
const browserName = process.env.XPLAT_WEB_BROWSER ?? 'chromium'
const browserType = { chromium, firefox, webkit }[browserName]
if (!browserType) {
	throw new Error(`Unsupported XPLAT_WEB_BROWSER: ${browserName}`)
}

const server = await createServer({
	root: webDir,
	server: { port: 0, host: '127.0.0.1', strictPort: true },
	plugins: [
		{
			name: 'sheet-readiness-fixture',
			configureServer(server) {
				server.middlewares.use('/__sheet_readiness', async (_req, res) => {
					res.setHeader('Content-Type', 'text/html')
					res.end(
						await server.transformIndexHtml(
							'/__sheet_readiness',
							'<div id="root"></div><script type="module" src="/test/sheet-readiness.web.tsrx"></script>',
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
	browser = await browserType.launch()
	const page = await browser.newPage()
	page.setDefaultTimeout(10000)
	const errors = []
	page.on('pageerror', (error) => errors.push(error.message))

	page.on('console', (message) => {
		if (message.type() === 'error') {
			errors.push(message.text())
		}
	})

	const address = server.httpServer.address()
	assert(address && typeof address === 'object')
	await page.goto(`http://127.0.0.1:${address.port}/__sheet_readiness`)
	await page.locator('#open-platform-sheet').waitFor()

	const dialog = page.getByRole('dialog', { name: 'Account actions' })
	const panel = page.locator('#platform-sheet-panel')
	await page.locator('#open-platform-sheet').click()
	await dialog.waitFor()
	assert.equal(await panel.isVisible(), true)
	assert.equal(
		await panel.evaluate((element) => element.classList.contains('consumer-sheet-class')),
		true,
	)

	assert.equal(await panel.evaluate((element) => getComputedStyle(element).paddingTop), '12px')

	assert.equal(
		await panel.evaluate((element) => getComputedStyle(element).backgroundColor),
		'rgb(240, 240, 240)',
	)

	assert.equal(
		await panel.evaluate((element) => getComputedStyle(element).color),
		'rgb(24, 24, 24)',
	)

	const backdropColor = await dialog.evaluate(
		(element) => getComputedStyle(element, '::backdrop').backgroundColor,
	)

	assert(backdropColor.includes('0.5'), backdropColor)

	const focusState = await page.evaluate(() => ({
		active: document.activeElement?.outerHTML,
		dialogOpen: document.querySelector('dialog')?.open,
		firstExists: !!document.getElementById('platform-sheet-first'),
	}))

	assert.equal(
		await page.evaluate(() => document.activeElement?.id),
		'platform-sheet-first',
		JSON.stringify(focusState),
	)

	await page.keyboard.press('Tab')
	assert.equal(await page.evaluate(() => document.activeElement?.id), 'platform-sheet-last')
	await page.keyboard.press('Tab')
	assert.equal(await page.evaluate(() => document.activeElement?.id), 'platform-sheet-first')
	await page.keyboard.press('Shift+Tab')
	assert.equal(await page.evaluate(() => document.activeElement?.id), 'platform-sheet-last')
	console.log(`[${browserName}] sheet dialog name, styling, focus entry, and Tab wrapping passed`)

	await page.keyboard.press('Escape')
	await panel.waitFor({ state: 'detached' })
	assert.equal(await page.locator('#dismissals').textContent(), '1')
	await page.waitForFunction(() => document.activeElement?.id === 'open-platform-sheet')

	await page.locator('#open-platform-sheet').click()
	await dialog.waitFor()
	await dialog.click({ position: { x: 4, y: 4 } })
	await panel.waitFor({ state: 'detached' })
	assert.equal(await page.locator('#dismissals').textContent(), '2')
	await page.waitForFunction(() => document.activeElement?.id === 'open-platform-sheet')
	console.log(`[${browserName}] Escape and scrim dismissal restore the trigger`)

	await page.locator('#open-platform-sheet').click()
	await dialog.waitFor()
	const handle = page.locator('.xplat-web-sheet-handle')
	const bounds = await handle.boundingBox()
	assert(bounds)
	await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
	await page.mouse.down()
	await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2 + 150, {
		steps: 5,
	})

	await page.mouse.up()
	await panel.waitFor({ state: 'detached' })
	assert.equal(await page.locator('#dismissals').textContent(), '3')
	console.log(`[${browserName}] drag-handle dismissal passed`)

	await page.locator('#open-platform-sheet').click()
	await dialog.waitFor()
	await page.locator('#platform-sheet-last').click()
	await panel.waitFor({ state: 'detached' })
	assert.equal(await page.locator('#dismissals').textContent(), '3')
	await page.waitForFunction(() => document.activeElement?.id === 'open-platform-sheet')
	console.log(`[${browserName}] explicit close restores focus without reporting user dismissal`)

	await page.locator('#open-locked-platform-sheet').click()
	const lockedDialog = page.getByRole('dialog', { name: 'Required actions' })
	await lockedDialog.waitFor()
	await page.keyboard.press('Escape')
	assert.equal(await lockedDialog.isVisible(), true)
	await lockedDialog.click({ position: { x: 4, y: 4 } })
	assert.equal(await lockedDialog.isVisible(), true)
	const lockedHandle = page.locator('.xplat-web-sheet-handle')
	const lockedBounds = await lockedHandle.boundingBox()
	assert(lockedBounds)
	await page.mouse.move(
		lockedBounds.x + lockedBounds.width / 2,
		lockedBounds.y + lockedBounds.height / 2,
	)

	await page.mouse.down()
	await page.mouse.move(
		lockedBounds.x + lockedBounds.width / 2,
		lockedBounds.y + lockedBounds.height / 2 + 150,
		{ steps: 5 },
	)

	await page.mouse.up()
	assert.equal(await lockedDialog.isVisible(), true)
	await page.locator('#close-locked-platform-sheet').click()
	await lockedDialog.waitFor({ state: 'detached' })
	assert.equal(await page.locator('#dismissals').textContent(), '3')
	assert.deepEqual(errors, [])
	console.log(`[${browserName}] disabled Escape, scrim, and drag dismissals passed`)
} catch (error) {
	console.error(`[${browserName}] sheet readiness failed`, error)
	process.exitCode = 1
} finally {
	try {
		await browser?.close()
	} finally {
		await server.close()
	}
}
