// Local browser coverage; excluded from the lightweight PR gate.
import assert from 'node:assert/strict'
import { chromium, firefox, webkit } from 'playwright'
import { createServer } from 'vite'
import { fileURLToPath } from 'node:url'

const server = await createServer({
	root: fileURLToPath(new URL('.', import.meta.url)),
	server: { host: '127.0.0.1', port: 0, strictPort: true },
})

try {
	await server.listen()
	const address = server.httpServer.address()
	assert(address && typeof address === 'object')
	const base = `http://127.0.0.1:${address.port}`

	for (const engine of [chromium, firefox, webkit]) {
		const browser = await engine.launch()
		try {
			const page = await browser.newPage({ reducedMotion: 'reduce' })
			const errors = []
			page.on('pageerror', (error) => errors.push(error.message))
			for (const width of [320, 390, 720, 768, 1024, 1440]) {
				await page.setViewportSize({ width, height: 812 })
				for (const path of ['/', '/navigation', '/goal-counter', '/styling']) {
					await page.goto(`${base}${path}`)
					await page.locator('.doc .h1').waitFor()
					await page.evaluate(() => document.fonts.ready)
					// Body width alone misses an oversized article clipped by its scrollport.
					const sizes = await page.evaluate(() =>
						['.content', '.doc-page', '.doc'].map((selector) => {
							const node = document.querySelector(selector)
							return { selector, available: node.clientWidth, actual: node.scrollWidth }
						}),
					)
					for (const size of sizes) {
						assert.ok(
							size.actual <= size.available + 1,
							`${engine.name()} ${path} at ${width}px: ${size.selector} overflows`,
						)
					}
				}
			}

			await page.setViewportSize({ width: 390, height: 812 })
			await page.goto(base)
			await page.getByRole('button', { name: 'Open menu', exact: true }).click()
			const menu = page.getByRole('dialog', { name: 'Documentation menu' })
			// Pointer activation also checks that the sheet is inside the viewport.
			await menu.getByText('Move between screens', { exact: true }).click()
			await page.waitForURL('**/navigation')
			await menu.waitFor({ state: 'detached' })
			await page.getByRole('button', { name: 'Search docs', exact: true }).click()
			await page.locator('#palette-query').fill('styling')
			await page.getByRole('option').first().waitFor()
			await page.keyboard.press('Escape')
			await page.locator('#palette-query').waitFor({ state: 'detached' })
			assert.deepEqual(errors, [])
			console.log(`PASS ${engine.name()}: article widths, mobile navigation and search`)
		} finally {
			await browser.close()
		}
	}
} finally {
	await server.close()
}
