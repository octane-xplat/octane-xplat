import { chromium } from 'playwright'

// Start this worktree's Vite server yourself; strictPort prevents attaching
// to another task's fallback port. This smoke never captures images.
const base = process.argv[2] ?? 'http://127.0.0.1:4327'
const browser = await chromium.launch()
try {
	const page = await browser.newPage()
	const errors = []
	page.on('pageerror', (error) => errors.push(error.message))
	page.on('console', (message) => {
		if (message.text().startsWith('[data]')) {
			console.log(message.text())
		}
	})

	await page.goto(base + '/data-probe.html')
	await page.waitForFunction(
		() => window.__dataProbe?.assertions > 0 || window.__dataProbe?.error,
		{ timeout: 30000 },
	)

	const report = await page.evaluate(() => ({
		assertions: window.__dataProbe.assertions,
		error: window.__dataProbe.error,
	}))

	if (report.error) {
		throw new Error(report.error)
	}

	await page.locator('#data-suspend').click()
	await page.locator('#data-pending').waitFor({ state: 'visible' })
	if (await page.locator('#data-body').isVisible()) {
		throw new Error('Retained body remains visible while pending')
	}

	await page.evaluate(() => window.__dataProbe.resolve())
	await page.locator('#data-body').waitFor({ state: 'visible' })
	if ((await page.locator('#data-body').textContent()) !== 'resolved') {
		throw new Error('Retained body did not settle')
	}

	await page.locator('#data-throw').click()
	// DOM listener failures are reported as browser errors; universal roots
	// use onUncaughtError. Do not conflate the two reporting contracts.
	await page.waitForTimeout(50)
	if (errors.length !== 1 || errors[0] !== 'probe handler failure') {
		throw new Error('Unexpected browser errors: ' + errors.join('\n'))
	}

	console.log(
		'[data] WEB PASS ' +
			report.assertions +
			' lifecycle assertions + retained suspense + real clicks + expected handler error',
	)
} finally {
	await browser.close()
}
