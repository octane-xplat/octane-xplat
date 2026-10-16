// Nonvisual browser verification. Run with the docs dev/preview server on port 5300.
import assert from 'node:assert/strict'
import { chromium, firefox, webkit } from 'playwright'

const base = process.env.DEMOS_URL || 'http://127.0.0.1:5300'
for (const engine of [chromium, firefox, webkit]) {
	const browser = await engine.launch({ headless: true })
	const page = await browser.newPage({ viewport: { width: 375, height: 812 } })
	const errors = []
	page.on('pageerror', (error) => errors.push(error.message))
	try {
		await page.goto(`${base}/goal-counter`)
		await page.getByRole('button', { name: 'Try in browser', exact: true }).waitFor()
		assert.equal(await page.locator('iframe').count(), 0, 'preview stays unloaded until activation')
		await page.getByRole('button', { name: 'Try in browser', exact: true }).click()
		await page.getByRole('status').filter({ hasText: 'Browser demo ready.' }).waitFor()
		const frame = page.frameLocator('iframe')
		for (let i = 0; i < 5; i++) {
			await frame.getByRole('button', { name: 'Complete one step' }).click()
		}

		assert.match(await frame.locator('main').innerText(), /5 of 5.*goal reached/)
		await frame.getByRole('button', { name: 'Undo one step' }).click()
		assert.match(await frame.locator('main').innerText(), /4 of 5/)
		await frame.getByRole('button', { name: 'Reset goal' }).focus()
		await page.keyboard.press('Enter')
		assert.match(await frame.locator('main').innerText(), /0 of 5/)
		await frame.getByRole('button', { name: 'Complete one step' }).focus()
		await page.keyboard.press('Space')
		assert.match(await frame.locator('main').innerText(), /1 of 5/)
		await frame.getByRole('button', { name: 'Reset goal' }).focus()
		await page.keyboard.press('Tab')
		assert.equal(
			await frame.locator(':focus').count(),
			0,
			'Tab leaves the preview without a focus trap',
		)

		await page.getByRole('button', { name: 'Close preview' }).click()
		assert.equal(await page.locator('iframe').count(), 0)
		await page.waitForFunction(() => document.activeElement.textContent === 'Try in browser')
		// Initial load failure and retry leave source and run instructions available.
		await page.route('**/demo.html?*', (route) => route.abort())
		await page.getByRole('button', { name: 'Try in browser', exact: true }).click()
		await page.getByRole('button', { name: 'Retry', exact: true }).waitFor({ timeout: 20000 })
		assert.equal(await page.getByRole('link', { name: 'Shared demo source' }).count(), 1)
		await page.unroute('**/demo.html?*')
		await page.getByRole('button', { name: 'Retry', exact: true }).click()
		await page.getByRole('status').filter({ hasText: 'Browser demo ready.' }).waitFor()
		await page.goto(`${base}/demo.html?demo=packing-list`)
		const search = page.getByRole('searchbox')
		await search.fill('water')
		await page.getByRole('button', { name: 'Pack: Water bottle', exact: true }).click()
		assert.match(await page.locator('main').innerText(), /1 of 4 items packed; 1 shown/)
		await search.fill('zzz')
		assert.match(await page.locator('main').innerText(), /No matching items/)
		await page.getByRole('button', { name: 'Reset packing list' }).click()
		assert.equal(await search.inputValue(), '')
		assert.match(await page.locator('main').innerText(), /0 of 4 items packed; 4 shown/)
		await page.context().setOffline(true)
		await page.getByRole('button', { name: 'Pack: Paper map', exact: true }).focus()
		await page.keyboard.press('Space')
		assert.match(await page.locator('main').innerText(), /1 of 4 items packed/)
		await page.context().setOffline(false)
		// Keyboard activation and tab order use the browser's actual input path.
		await page.getByRole('button', { name: 'Reset packing list' }).focus()
		await page.keyboard.press('Enter')
		assert.match(await page.locator('main').innerText(), /0 of 4 items packed/)
		for (const width of [320, 375, 768]) {
			await page.setViewportSize({ width, height: 812 })
			for (const demo of ['goal-counter', 'packing-list']) {
				await page.goto(`${base}/demo.html?demo=${demo}`)
				await page.locator('main .btn').first().waitFor()
				await page.evaluate(() => {
					document.documentElement.style.fontSize = '200%'
				})

				assert.equal(
					await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
					true,
					`${demo} fits width ${width} at text zoom`,
				)

				const controls = await page
					.getByRole('button')
					.evaluateAll((nodes) =>
						nodes.map((n) => ({ h: n.getBoundingClientRect().height, label: n.textContent })),
					)

				assert.ok(
					controls.every((n) => n.h >= 44 && n.label.trim()),
					'labelled touch targets',
				)
			}
		}

		assert.deepEqual(errors, [])
		console.log(
			`PASS ${engine.name()}: lazy activation, counter, retry, close/focus, search, reset, offline, keyboard, narrow widths and text zoom`,
		)
	} finally {
		await browser.close()
	}
}
