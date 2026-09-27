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

	// VirtualList: a 500-row data set must keep a bounded DOM window, preserve
	// a visible anchor when a measured row above it grows, and retain keyed row
	// state when items are prepended.
	await page.click('#menu-vlist')
	await page.waitForFunction(() => location.pathname === '/demos/demo/vlist', null, {
		timeout: 5000,
	})
	await page.waitForSelector('#vlist .vx-virtual-list-row', { timeout: 5000 })
	await page.waitForFunction(
		() => document.querySelectorAll('#vlist .vx-virtual-list-row').length > 1,
		null,
		{ timeout: 5000 },
	)
	const virtualList = page.locator('#vlist')
	let mountedRows = await virtualList.locator('.vx-virtual-list-row').count()
	ok('VirtualList bounds mounted rows', mountedRows > 1 && mountedRows < 40, mountedRows + '/500')
	const slots = await virtualList.evaluate((list) => {
		const separators = Array.from(list.querySelectorAll('.vx-virtual-list-separator'))
		return {
			header: list
				.querySelector('.vx-virtual-list-header')
				?.textContent?.includes('Variable-height rows'),
			footer: list
				.querySelector('.vx-virtual-list-footer')
				?.textContent?.includes('End of 500 rows'),
			separator: separators.some((separator) => separator.children.length > 0),
		}
	})
	ok(
		'VirtualList renders header, footer, and separators',
		slots.header && slots.footer && slots.separator,
	)
	await page.click('#vl-clear')
	await page.waitForFunction(
		() => document.querySelector('#vlist .vx-virtual-list-empty')?.textContent?.includes('No rows'),
		null,
		{ timeout: 3000 },
	)
	ok('VirtualList renders its empty state', true)
	await page.click('#vl-restore')
	await page.waitForSelector('#row-r0', { timeout: 3000 })
	ok('VirtualList restores rows after the empty state', true)

	await virtualList.evaluate((list) => {
		list.scrollTop = 960
	})
	await page.waitForFunction(
		() => {
			const list = document.getElementById('vlist')
			const row15 = document.getElementById('row-r15')
			const anchor = document.getElementById('row-r20')
			return (
				list &&
				row15 &&
				anchor &&
				row15.getBoundingClientRect().bottom <= list.getBoundingClientRect().top + 1 &&
				anchor.getBoundingClientRect().top < list.getBoundingClientRect().bottom
			)
		},
		null,
		{ timeout: 5000 },
	)
	const before = await page.evaluate(() => {
		const list = document.getElementById('vlist')
		const row = document.getElementById('row-r20')
		return {
			anchorTop: row.getBoundingClientRect().top - list.getBoundingClientRect().top,
			rowHeight: document.getElementById('row-r15').getBoundingClientRect().height,
		}
	})
	await page.click('#vl-grow')
	await page.waitForFunction(
		(height) => document.getElementById('row-r15')?.getBoundingClientRect().height >= height + 23,
		before.rowHeight,
		{ timeout: 5000 },
	)
	await page.waitForTimeout(50)
	const after = await page.evaluate(() => {
		const list = document.getElementById('vlist')
		return {
			anchorTop:
				document.getElementById('row-r20').getBoundingClientRect().top -
				list.getBoundingClientRect().top,
			rowHeight: document.getElementById('row-r15').getBoundingClientRect().height,
		}
	})
	ok('VirtualList records changed row height', after.rowHeight >= before.rowHeight + 23)
	ok(
		'VirtualList corrects the visible anchor within 2 px',
		Math.abs(after.anchorTop - before.anchorTop) <= 2,
		(after.anchorTop - before.anchorTop).toFixed(2) + ' px',
	)
	mountedRows = await virtualList.locator('.vx-virtual-list-row').count()
	ok(
		'VirtualList keeps the resized window bounded',
		mountedRows > 0 && mountedRows < 40,
		mountedRows + ' mounted',
	)

	await virtualList.evaluate((list) => {
		list.scrollTop = 10800
	})
	await page.waitForSelector('#row-r200', { timeout: 5000 })
	await page.click('#row-r200')
	await page.waitForFunction(
		() => document.getElementById('row-r200')?.textContent?.includes('Row 200 · 1'),
		null,
		{ timeout: 3000 },
	)
	await page.click('#vl-prepend')
	await page.waitForFunction(
		() =>
			document.body.textContent?.includes('501 rows · tap a row to test keyed state') &&
			document.getElementById('row-r200')?.textContent?.includes('Row 200 · 1'),
		null,
		{ timeout: 5000 },
	)
	ok('VirtualList prepend updates count and preserves keyed state', true)
	await virtualList.evaluate((list) => {
		list.scrollTop = 0
	})
	await page.waitForFunction(
		() =>
			Array.from(document.querySelectorAll('#vlist .vx-virtual-list-row')).some((row) =>
				row.textContent?.includes('Prepended · 0'),
			),
		null,
		{ timeout: 5000 },
	)
	mountedRows = await virtualList.locator('.vx-virtual-list-row').count()
	ok(
		'VirtualList keeps the prepended window bounded',
		mountedRows > 0 && mountedRows < 40,
		mountedRows + ' mounted',
	)
	await page.click('text=← Back')
	await page.waitForFunction(() => location.pathname === '/', null, { timeout: 3000 })

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
		(await page.locator('meta[name="description"]').getAttribute('content')) ===
			'Detail opened from home',
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

	// Overlay demo: useMeasure readout, Hoverable card on hover-intent,
	// positional + anchored toasts.
	await page.goto(BASE + '/test/demo/overlay', { waitUntil: 'networkidle' })
	await page.waitForSelector('text=Overlay primitives', { timeout: 5000 })
	const echo = await page.locator('#measure-echo').innerText()
	ok('useMeasure reports bounds', /^Bounds \d+×\d+ @ \d+,\d+$/.test(echo), echo)
	await page.hover('text=Hoverable trigger')
	await page.waitForSelector('text=Hint card text', { timeout: 3000 })
	ok('hoverable opens card on hover intent', true)
	await page.hover('text=Tooltip trigger')
	await page.waitForSelector('[role="tooltip"]:has-text("Saved automatically")', { timeout: 3000 })
	const described = page.locator('[aria-describedby]')
	const tipId = await page.locator('[role="tooltip"]').getAttribute('id')
	ok(
		'tooltip opens on hover intent + aria-describedby wiring',
		(await described.count()) === 1 && (await described.getAttribute('aria-describedby')) === tipId,
	)

	await page.keyboard.press('Escape')
	await page.waitForSelector('[role="tooltip"]', { state: 'detached', timeout: 3000 })
	ok('tooltip dismisses on Escape', true)
	await page.click('text=Toast top')
	await page.waitForSelector('text=Top toast', { timeout: 3000 })
	ok('toast position=top renders', true)
	await page.click('text=Toast anchored')
	await page.waitForSelector('text=Anchored toast', { timeout: 3000 })
	ok('toast anchored renders', true)

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
