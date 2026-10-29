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
			const coveredText = new Set()
			for (const width of [320, 390, 720, 768, 1024, 1100, 1101, 1440]) {
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

					const handheld = width <= 1100
					assert.equal(await page.locator('.mobile-header').isVisible(), handheld)
					assert.equal(await page.locator('.side').isVisible(), !handheld)
					if (!handheld) {
						continue
					}

					// An article can fit while its text and controls remain too small.
					const text = await page.evaluate(() => {
						const minimums = {
							'.p': 18,
							'.li-text': 18,
							'.quote .lede-content': 18,
							'.callout-line': 18,
							'.agent-prompt-copy': 18,
							'.code span': 16,
							'.td': 16,
							'.h1': 32,
							'.h2': 26,
						}
						return Object.entries(minimums).flatMap(([selector, minimum]) =>
							Array.from(document.querySelectorAll(selector), (node) => {
								const style = getComputedStyle(node)
								return {
									selector,
									minimum,
									size: parseFloat(style.fontSize),
									weight: Number(style.fontWeight),
								}
							}),
						)
					})

					for (const run of text) {
						coveredText.add(run.selector)
						const label = `${engine.name()} ${path} at ${width}px: ${run.selector}`
						assert.ok(run.size >= run.minimum, `${label} is only ${run.size}px`)
						assert.ok(run.weight >= 400, `${label} uses thin weight ${run.weight}`)
					}

					const targets = await page.evaluate(() =>
						Array.from(
							document.querySelectorAll(
								'.mobile-header [role="button"], .doc-copy, .doc-copy-toggle, .home-action, .agent-prompt-icon-button, .agent-prompt-expand',
							),
							(node) => {
								const rect = node.getBoundingClientRect()
								return {
									label: node.getAttribute('aria-label') ?? node.textContent.trim(),
									width: rect.width,
									height: rect.height,
								}
							},
						).filter((target) => target.width > 0 && target.height > 0),
					)

					for (const target of targets) {
						assert.ok(
							target.width >= 44 && target.height >= 44,
							`${engine.name()} ${path} at ${width}px: ${target.label} is only ${target.width}×${target.height}`,
						)
					}
				}
			}

			// Guides currently contain no callouts; their scale is checked when present.
			for (const selector of [
				'.p',
				'.li-text',
				'.quote .lede-content',
				'.agent-prompt-copy',
				'.code span',
				'.td',
				'.h1',
				'.h2',
			]) {
				assert.ok(coveredText.has(selector), `Missing reading-scale coverage for ${selector}`)
			}

			for (const width of [320, 390, 768, 1024, 1100]) {
				await page.setViewportSize({ width, height: 812 })
				await page.goto(base)
				await page.getByRole('button', { name: 'Open menu', exact: true }).click()
				const menu = page.getByRole('dialog', { name: 'Documentation menu' })
				await menu.waitFor()
				await menu.getByText('Move between screens', { exact: true }).waitFor()
				const navTargets = await menu
					.locator('.nav-row, .side-item, .mode-toggle')
					.evaluateAll((nodes) =>
						nodes.map((node) => {
							const rect = node.getBoundingClientRect()
							return {
								label: node.getAttribute('aria-label') ?? node.textContent.trim(),
								width: rect.width,
								height: rect.height,
							}
						}),
					)

				assert.ok(
					navTargets.length > 0 &&
						navTargets.every((rect) => rect.width >= 44 && rect.height >= 44),
					`${engine.name()} at ${width}px: undersized menu targets ${JSON.stringify(navTargets.filter((rect) => rect.width < 44 || rect.height < 44))}`,
				)

				// Pointer activation also checks that the sheet is inside the viewport.
				await menu.getByText('Move between screens', { exact: true }).click()
				await page.waitForURL('**/navigation')
				await menu.waitFor({ state: 'detached' })
				await page.getByRole('button', { name: 'More page actions', exact: true }).click()
				const actionBounds = await page.getByRole('menu').evaluate((node) => {
					const rect = node.getBoundingClientRect()
					const content = document.querySelector('.content').getBoundingClientRect()
					return {
						left: rect.left,
						right: rect.right,
						availableLeft: content.left,
						availableRight: content.right,
					}
				})

				assert.ok(
					actionBounds.left >= actionBounds.availableLeft &&
						actionBounds.right <= actionBounds.availableRight,
					`${engine.name()} at ${width}px: page actions extend outside the reading area`,
				)

				await page.keyboard.press('Escape')
				await page.getByRole('button', { name: 'Search docs', exact: true }).click()
				await page.locator('#palette-query').fill('styling')
				const result = page.getByRole('option').first()
				await result.waitFor()
				const resultSize = await result
					.locator('.hit-label')
					.evaluate((node) => getComputedStyle(node).fontSize)

				assert.ok(parseFloat(resultSize) >= 17)
				await page.keyboard.press('Escape')
				await page.locator('#palette-query').waitFor({ state: 'detached' })
			}

			assert.deepEqual(errors, [])
			console.log(
				`PASS ${engine.name()}: article widths, reading scale, touch targets, phone/tablet navigation and search`,
			)
		} finally {
			await browser.close()
		}
	}
} finally {
	await server.close()
}
