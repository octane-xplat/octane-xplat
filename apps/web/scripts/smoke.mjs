// Real-browser smoke for the shared app — the web target's first runtime
// evidence. Serves apps/web/dist via `vite preview`, drives headless
// Chromium, asserts render + tab nav + chip→path-route + interaction,
// and fails on any pageerror/console.error.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const webDir = path.dirname(fileURLToPath(import.meta.url)) + '/..'
const PORT = 4319
const BASE = `http://localhost:${PORT}`

const preview = spawn('pnpm', ['exec', 'vite', 'preview', '--port', String(PORT)], {
	cwd: webDir,
	stdio: ['ignore', 'pipe', 'pipe'],
})

await new Promise((r) => preview.stdout.on('data', (d) => String(d).includes('Local') && r()))
await new Promise((r) => setTimeout(r, 500))

const results = []
const errors = []
const ok = (name, cond, extra = '') => {
	results.push([cond, name])
	console.log('[smoke] ' + name + ': ' + (cond ? 'OK' : 'FAIL') + (extra ? ' ' + extra : ''))
}

try {
	const browser = await chromium.launch()
	const page = await browser.newPage()
	page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
	page.on('console', (m) => m.type() === 'error' && errors.push('console.error: ' + m.text()))

	await page.goto(BASE, { waitUntil: 'networkidle' })

	// Mount: Home tab content exists.
	await page.waitForSelector('text=Count: 0', { timeout: 10000 })
	ok('app mounts — Count: 0', true)

	// Interact: Increment bumps state.
	await page.click('text=Increment')
	await page.waitForSelector('text=Count: 1', { timeout: 3000 })
	ok('pressable onClick → state update', true)

	// TextArea leaf: real <textarea>, controlled round-trip, autoGrow re-fit.
	await page.waitForSelector('#probe-textarea', { timeout: 5000 })
	const taH0 = await page.evaluate(() => document.getElementById('probe-textarea').offsetHeight)
	await page.fill('#probe-textarea', 'line one\nline two\nline three')
	const taVal = await page.evaluate(() => document.getElementById('probe-textarea').value)
	ok('textarea controlled input', taVal === 'line one\nline two\nline three')
	await page.waitForTimeout(100)
	const taH1 = await page.evaluate(() => document.getElementById('probe-textarea').offsetHeight)
	ok('textarea autoGrow expands', taH1 > taH0, taH0 + '→' + taH1)

	// Multi-child Pressable (native regression parity) — lives on the
	// Probes tab: label + sibling views inside the pressable element.
	await page.click('button:text("Test")')
	await page.waitForSelector('#multi-pressable', { timeout: 3000 })
	const mp = page.locator('#multi-pressable')
	ok('pressable multi-child label', (await mp.locator('text=Multi').count()) === 1)
	ok('pressable multi-child sibling', (await mp.locator('#multi-sibling').count()) === 1)

	// Tab switch: web Tabs leaf renders a button row.
	await page.click('button:text("Apps")')
	await page.waitForSelector('text=Last opened:', { timeout: 3000 })
	ok('tab switch → demos catalog mounts', true)
	const chipCount = await page.locator('[role="button"]:has-text("Counter")').count()
	ok('gallery chips render', chipCount >= 1, 'chips=' + chipCount)

	// Chip click → navigate('demo/:id',{id},{into:'demos'}) → real path +
	// the pushed screen renders inside the Demos pane (tab bar stays).
	await page.click('[role="button"]:has-text("Counter")')
	await page.waitForFunction(() => location.pathname.includes('demo'), null, { timeout: 3000 })
	const path = await page.evaluate(() => location.pathname + location.search)
	ok('chip → pushRoute writes real path', path === '/demos/demo/counter', path)
	await page.waitForSelector('text=Demo count: 0', { timeout: 3000 })
	ok('pushed screen renders inside pane', true)
	const tabbarVisible = await page.locator('.vx-tabbar').isVisible()
	ok('tab bar stays visible (nested-route semantics)', tabbarVisible)
	// goBack → history.back → URL + pane revert to gallery.
	await page.click('text=← Back')
	await page.waitForFunction(() => location.pathname === '/', null, { timeout: 3000 })
	await page.waitForSelector('text=Counter', { timeout: 3000 })
	ok('goBack → popstate → gallery restored', true)
	// The gallery's Last opened shows the popped screen's store write —
	// same-root swap on web vs cross-root write on native.
	await page.waitForSelector('text=Last opened: counter', { timeout: 3000 })
	ok('cross-route store write (lastDemo)', true)

	// Root push (Detail →) covers the whole shell.
	await page.click('button:text("Home")')
	const detailLink = page.getByRole('link', { name: 'Detail →' })
	const detailHref = await detailLink.getAttribute('href')
	const timeOrigin = await page.evaluate(() => performance.timeOrigin)
	ok('NavLink renders a real href', detailHref === '/detail?from=home', detailHref)
	await page.click('text=Detail →')
	await page.waitForFunction(() => location.pathname === '/detail', null, { timeout: 3000 })
	ok(
		'NavLink click uses SPA navigation',
		await page.evaluate((origin) => performance.timeOrigin === origin, timeOrigin),
	)
	await page.waitForSelector('text=guard: home', { timeout: 3000 })
	ok('beforeLoad context reaches screen props', true)
	ok('head export updates title', (await page.title()) === 'Detail · Octane Xplat')
	ok(
		'head export updates meta',
		(await page.locator('meta[name="description"]').getAttribute('content')) === 'Detail opened from home',
	)
	ok('useCanGoBack renders the back affordance', (await page.locator('#detail-back').count()) === 1)

	const tabsCovered = (await page.locator('.vx-tabbar').count()) === 0
	ok('root route covers tab shell', tabsCovered)
	await page.goBack()
	await page.waitForSelector('.vx-tabbar', { timeout: 3000 })
	ok('browser back → shell restored', true)

	// Deep link: fresh page load at /demos/demo renders demo in Demos pane.
	await page.goto(BASE + '/demos/demo/watch', { waitUntil: 'networkidle' })
	await page.waitForSelector('text=/\\d{2}:\\d{2}:\\d{2}/', { timeout: 5000 })
	ok('deep link → correct tab + pushed screen', true)

	// Settings tab: sheet seam mounts a real portal layer; backdrop dismisses.
	const logs = []
	page.on('console', (m) => logs.push(m.text()))
	await page.click('button:text("Test")')
	await page.click('text=Open sheet')
	await page.waitForSelector('.vx-sheet-layer .sheet-panel', { timeout: 3000 })
	ok(
		'sheet opens + logs probe',
		logs.some((l) => l.includes('sheet open')),
	)
	await page.click('.vx-sheet-backdrop')
	ok('sheet backdrop dismisses', (await page.locator('.vx-sheet-layer').count()) === 0)

	// Services tab: platform services catalog mounts with live read-outs.
	await page.click('button:text("Test")')
	await page.waitForSelector('text=Platform services', { timeout: 3000 })
	ok('services catalog renders', (await page.locator('text=/web · browser/').count()) === 1)

	// Seam-proof chips push into the Test pane's own stack (/test/...).
	await page.click('#menu-layout')
	await page.waitForFunction(() => location.pathname.startsWith('/test/demo/'), { timeout: 3000 })
	ok('proof chip → test-stack push', true)
	await page.goBack()
	await page.waitForSelector('text=Seam proofs', { timeout: 3000 })
	ok('back → test tab restored', true)

	// beforeLoad redirect seam: 'private' never commits — lands on detail.
	await page.click('#guarded-btn')
	await page.waitForSelector('text=guard: private', { timeout: 3000 })
	ok('guard redirect → detail', true)
	await page.goBack()
	await page.waitForSelector('text=Seam proofs', { timeout: 3000 })

	// Home tab: imperative overlay seam mounts a portal layer under body.
	await page.click('button:text("Home")')
	await page.click('#overlay-btn')
	await page.waitForSelector('.vx-overlay .overlay-panel', { timeout: 3000 })
	await page.click('.vx-overlay-shade')
	ok('imperative overlay open + shade dismiss', (await page.locator('.vx-overlay').count()) === 0)

	// No leaked platform failures.
	ok('zero pageerrors/console.error', errors.length === 0, errors[0] ?? '')

	await browser.close()
} finally {
	preview.kill()
}

const fails = results.filter(([c]) => !c).length
console.log(`[smoke] ${results.length - fails}/${results.length} passed`)
process.exit(fails ? 1 : 0)
