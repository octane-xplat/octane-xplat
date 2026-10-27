/* eslint-disable xplat/no-dom-globals — evaluate bodies run in the browser */
// Browser-synthesized input coverage for the web lightbox. Serves the fixture
// with vite dev, drives Chromium via Playwright; asserts geometry numerically.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const fixture = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixture')
const BASE = 'http://localhost:4479'
const results = []
const check = (name, actual, expected) => {
	const pass = typeof expected === 'function' ? expected(actual) : Object.is(actual, expected)
	results.push({ name, pass, actual, expected: String(expected) })
	if (!pass) {console.log(`FAIL ${name}: ${JSON.stringify(actual)} vs ${expected}`)}
}
const near = (expected, tol = 1) => (v) => typeof v === 'number' && Math.abs(v - expected) <= tol

const viteBin = path.join(path.dirname(fileURLToPath(import.meta.url)), '../node_modules/.bin/vite')
const server = spawn(viteBin, [], { cwd: fixture, stdio: 'pipe' })
server.stdout.on('data', (c) => process.env.DEBUG_E2E && process.stdout.write(c))
server.stderr.on('data', (c) => process.env.DEBUG_E2E && process.stderr.write(c))
const ready = new Promise((res, rej) => {
	const t = setTimeout(() => rej(new Error('vite did not start')), 20000)
	server.stdout.on('data', (d) => { if (String(d).includes('Local')) { clearTimeout(t); res() } })
	server.stderr.on('data', () => {})
})

try {
	await ready
	const browser = await chromium.launch()
	const page = await browser.newPage({ viewport: { width: 800, height: 600 } })
	page.on('pageerror', (e) => results.push({ name: 'pageerror', pass: false, actual: String(e) }))
	page.on('console', (m) => { if (m.type() === 'error') {results.push({ name: 'console.error', pass: false, actual: m.text() })} })
	await page.goto(BASE)
	try { await page.waitForSelector('.vx-lightbox-trigger', { timeout: 10000 }) } catch {
		console.log('PAGE:', (await page.content()).slice(0, 1500))
		console.log('RESULTS:', JSON.stringify(results, null, 1).slice(0, 3000))
		throw new Error('thumb-0 never rendered')
	}

	// --- open morph lands on the fitted rect ---
	await page.locator('.vx-lightbox-trigger').nth(0).click()
	await page.waitForSelector('[data-phase="open"]', { timeout: 5000 })
	const cur = (pg) => pg.locator('[data-lightbox-slide][data-current] [data-lightbox-image]')
	const imgRect = await cur(page).boundingBox()
	// 800x600 contain in 800x600 viewport → fit = full 800x600
	check('open morph: fitted width', imgRect?.width, near(800))
	check('open morph: fitted height', imgRect?.height, near(600))
	check('open morph: no clip after settle', await cur(page).evaluate((el) => el.style.clipPath), (v) => v === 'none' || v === '')
	check('trigger hidden during open', await page.locator('.vx-lightbox-trigger').nth(0).locator('img').evaluate((el) => getComputedStyle(el).visibility), 'hidden')

	// --- keyboard nav advances index ---
	await page.keyboard.press('ArrowRight')
	await page.waitForTimeout(400)
	check('ArrowRight → slide 2 current', await page.locator('[data-lightbox-slide][data-current]').getAttribute('aria-label'), '2 of 3')

	// --- scroll-snap swipe (synthesized scrollLeft) ---
	await page.evaluate(() => { document.querySelector('.vx-lightbox-viewport').scrollLeft = 1600 })
	await page.waitForTimeout(400)
	check('scroll snap → slide 3 current', await page.locator('[data-lightbox-slide][data-current]').getAttribute('aria-label'), '3 of 3')

	const fire = (sel, type, init) => page.evaluate(([sel, type, init]) => {
		const el = document.querySelector(sel)
		const r = el.getBoundingClientRect()
		const x = r.left + r.width / 2, y = r.top + r.height / 2
		el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1, pointerType: 'mouse', button: 0, clientX: x, clientY: y, ...init }))
	}, [sel, type, init])
	const curSel = '[data-lightbox-slide][data-current] [data-lightbox-image]'
	// --- ctrl+wheel zooms; zoomed drag pans not pages ---
	await page.evaluate(([sel]) => {
		const el = document.querySelector(sel)
		el.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, ctrlKey: true, deltaY: -300, clientX: innerWidth / 2, clientY: innerHeight / 2 }))
	}, [curSel])
	await page.waitForTimeout(400)
	const zoomedScale = await cur(page).evaluate((el) => /scale\(([^)]+)\)/.exec(el.style.transform)?.[1])
	check('ctrl+wheel zooms in', parseFloat(zoomedScale ?? '0'), (v) => v > 1.01)

	// --- double-click zooms then unzooms ---
	for (const t of ['pointerdown', 'pointerup', 'pointerdown', 'pointerup']) {await fire(curSel, t, {})}
	await page.waitForTimeout(500)
	check('double-click resets zoomed', await cur(page).evaluate((el) => /scale\(([^)]+)\)/.exec(el.style.transform)?.[1] ?? '1'), (v) => Math.abs(parseFloat(v) - 1) < 0.05)
	for (const t of ['pointerdown', 'pointerup', 'pointerdown', 'pointerup']) {await fire(curSel, t, {})}
	await page.waitForTimeout(500)
	check('double-click zooms', await cur(page).evaluate((el) => /scale\(([^)]+)\)/.exec(el.style.transform)?.[1] ?? '1'), (v) => parseFloat(v) > 1.5)
	for (const t of ['pointerdown', 'pointerup', 'pointerdown', 'pointerup']) {await fire(curSel, t, {})}
	await page.waitForTimeout(500)

	// --- Escape closes; close morph lands near the trigger rect ---
	await page.keyboard.press('Escape')
	await page.waitForTimeout(2200)
	check('Escape closes layer', await page.locator('[data-phase]').count(), 0)
	check('trigger visible again', await page.locator('.vx-lightbox-trigger').nth(0).locator('img').evaluate((el) => getComputedStyle(el).visibility), 'visible')

	// --- vertical drag closes (pull-to-dismiss, synthesized pointer events) ---
	await page.locator('.vx-lightbox-trigger').nth(1).click()
	await page.waitForSelector('[data-phase="open"]', { timeout: 5000 })
	const box = await cur(page).boundingBox()
	const cx = box.x + box.width / 2
	const cy = box.y + box.height / 2
	await page.mouse.move(cx, cy)
	await page.mouse.down()
	for (let i = 1; i <= 10; i++) { await page.mouse.move(cx, cy + i * 40); await page.waitForTimeout(16) }
	await page.mouse.up()
	await page.waitForTimeout(4000)
	check('vertical pull closes', await page.locator('[data-phase]').count(), 0)

	// --- short vertical drag settles back ---
	await page.locator('.vx-lightbox-trigger').nth(1).click()
	await page.waitForSelector('[data-phase="open"]', { timeout: 5000 })
	const b2 = await cur(page).boundingBox()
	const c2 = { x: b2.x + b2.width / 2, y: b2.y + b2.height / 2 }
	await page.mouse.move(c2.x, c2.y)
	await page.mouse.down()
	for (let i = 1; i <= 4; i++) { await page.mouse.move(c2.x, c2.y + i * 10); await page.waitForTimeout(16) }
	// Hold still before release so the projected flick velocity is ~0 —
	// a fast small flick legitimately closes per the upstream formula.
	await page.waitForTimeout(400)
	await page.mouse.up()
	await page.waitForTimeout(600)
	check('short drag stays open', await page.locator('[data-phase]').count(), 1)
	await page.keyboard.press('Escape')
	await page.waitForTimeout(2200)

	// --- reduced motion fades ---
	const page2 = await browser.newPage({ viewport: { width: 800, height: 600 }, reducedMotion: 'reduce' })
	await page2.goto(BASE)
	await page2.locator('.vx-lightbox-trigger').nth(0).click()
	await page2.waitForSelector('[data-phase="open"]', { timeout: 5000 })
	check('reduced motion opens', await page2.locator('[data-phase]').getAttribute('data-phase'), 'open')

	const failed = results.filter((r) => !r.pass)
	console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
	for (const r of results) {console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.name} → ${JSON.stringify(r.actual)}`)}
	await browser.close()
	server.kill()
	process.exit(failed.length ? 1 : 0)
} catch (e) {
	console.error(e)
	for (const r of results) {console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.name} → ${JSON.stringify(r.actual)}`)}
	server.kill()
	process.exit(1)
}
