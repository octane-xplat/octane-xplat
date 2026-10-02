import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import assert from 'node:assert/strict'

// Nonvisual regression gate for Q28/Q29 and window disposal.
const preview = spawn('pnpm', ['exec', 'vite', 'preview', '--port', '5218', '--strictPort'], {
	stdio: ['ignore', 'pipe', 'pipe'],
	detached: true,
})

let browser
try {
	await new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error('Preview did not start')), 120000)
		preview.stdout.on('data', (chunk) => {
			if (String(chunk).includes('Local:')) {
				clearTimeout(timer)
				resolve()
			}
		})

		preview.once('exit', (code) => {
			clearTimeout(timer)
			reject(new Error(`Preview exited ${code}`))
		})
	})

	browser = await chromium.launch()
	const page = await browser.newPage({ viewport: { width: 1100, height: 800 } })
	const errors = []
	page.on('pageerror', (error) => errors.push(error.message))
	await page.goto('http://localhost:5218', { waitUntil: 'networkidle' })
	await page.locator('button:text("Apps")').click()
	await page.locator('#menu-vlist').click()
	const list = page.locator('#vlist')
	await list.waitFor()
	const read = () =>
		list.evaluate((node) => {
			const bounds = node.getBoundingClientRect()
			const rows = [...node.querySelectorAll('[id^="row-r"]')].map((row) => ({
				id: row.id,
				top: row.getBoundingClientRect().top - bounds.top,
				bottom: row.getBoundingClientRect().bottom - bounds.top,
				text: row.textContent,
			}))

			return { offset: node.scrollTop, height: node.clientHeight, rows, mounted: rows.length }
		})

	const stable = async () => {
		let previous = await read()
		let matches = 0
		for (let sample = 0; sample < 100; sample++) {
			await page.waitForTimeout(25)
			const next = await read()
			matches =
				JSON.stringify(next) === JSON.stringify(previous) && next.mounted > 1 ? matches + 1 : 0

			if (matches >= 3) {
				return next
			}

			previous = next
		}

		throw new Error('Row geometry did not settle')
	}

	await stable()
	assert.match(await list.locator('.vx-virtual-list-header').innerText(), /Variable-height rows/)
	assert.match(await list.locator('.vx-virtual-list-footer').innerText(), /End of 500 rows/)
	assert((await list.locator('.vx-virtual-list-separator > *').count()) > 0)
	const seekResults = []
	for (const offset of [960, 10800, 20000, 5000, 10800]) {
		await list.evaluate((node, y) => {
			node.scrollTop = y
		}, offset)

		const snapshot = await stable()
		const visible = snapshot.rows.filter((row) => row.bottom > 0 && row.top < snapshot.height)
		assert(visible.length > 0 && snapshot.mounted < 40, `Seek ${offset}: empty/unbounded window`)
		seekResults.push({
			requestedOffset: offset,
			actualOffset: snapshot.offset,
			mounted: snapshot.mounted,
		})
	}

	const beforePress = await stable()
	const selectedAnchor = beforePress.rows.find((row) => row.bottom > 0)
	assert(selectedAnchor, 'No visible anchor')
	await page.locator('#' + selectedAnchor.id).click()
	const before = await stable()
	const anchor = before.rows.find((row) => row.id === selectedAnchor.id)
	await page.locator('#vl-prepend').click()
	const after = await stable()
	const retained = after.rows.find((row) => row.id === anchor.id)
	const drift = retained ? retained.top - anchor.top : null
	console.log(
		JSON.stringify({
			seekResults,
			prepend: { anchor: anchor.id, drift, before: before.offset, after: after.offset },
		}),
	)

	assert(retained?.text?.includes(' · 1'), 'Keyed local state lost on prepend')
	assert(drift !== null && Math.abs(drift) <= 2, `Prepend anchor drift ${drift} px`)
	await list.evaluate((node) => {
		node.scrollTop = 960
	})

	await stable()
	const topBefore = await page
		.locator('#row-r20')
		.evaluate((node) => node.getBoundingClientRect().top)

	await page.locator('#vl-grow').click()
	await stable()
	const topAfter = await page
		.locator('#row-r20')
		.evaluate((node) => node.getBoundingClientRect().top)

	assert(Math.abs(topAfter - topBefore) <= 2, `Remeasure anchor drift ${topAfter - topBefore}`)
	await list.evaluate((node, y) => {
		node.scrollTop = y
	}, after.offset)

	await stable()
	assert.match(
		await page.locator('#' + anchor.id).innerText(),
		/ · 0$/,
		'Off-window local state should reset',
	)

	await page.locator('#vl-clear').click()
	await page.waitForFunction(() => document.querySelector('#vlist .vx-virtual-list-empty'))
	assert.equal(await list.locator('.vx-virtual-list-row').count(), 0)
	await page.locator('#vl-restore').click()
	await stable()
	await page.locator('text=← Back').click()
	await page.waitForFunction(() => !document.querySelector('#vlist'))
	assert.deepEqual(errors, [])
	console.log(
		JSON.stringify({
			remeasureDrift: topAfter - topBefore,
			cleanup: 'row window removed after empty and route disposal',
			errors,
		}),
	)
} finally {
	await browser?.close()
	try {
		process.kill(-preview.pid, 'SIGTERM')
	} catch {}
}
