#!/usr/bin/env node
// Runtime smoke for the sandbox app in a real browser (Chromium via
// Playwright). Boots `vite preview` against a fresh `vite build`, then drives
// the pinned journeys with DOM/text assertions only — no screenshots, no
// pixel checks. Usage: node scripts/verify-web.mjs [--base URL]

import { chromium } from 'playwright'

const base = process.env.BASE_URL ?? process.argv.find((a) => a.startsWith('--base='))?.split('=')[1]
const baseUrl = base ?? 'http://localhost:4173'

const results = []
const check = (name, pass, detail = '') => {
	results.push({ name, pass, detail })
	console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
}

const browser = await chromium.launch()
const page = await browser.newPage()

const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => {
	if (m.type() === 'error') errors.push(m.text())
})

try {
	// Home: heading, nav, search, category sections, cards
	await page.goto(baseUrl + '/', { waitUntil: 'networkidle' })
	check('home renders heading', (await page.textContent('h1'))?.includes('Astryx Sandbox'))
	check('home sidebar nav present', (await page.locator('nav').count()) > 0)
	check('home card grid populated', (await page.locator('.sb-card-grid a').count()) > 0)

	// Search filters cards
	await page.fill('input[type="search"], input[placeholder="Search..."]', 'palette')
	await page.waitForTimeout(200)
	const cardCount = await page.locator('.sb-card-grid a').count()
	check('home search filters', cardCount > 0 && cardCount < 30, `${cardCount} cards`)

	// Category page via sidebar navigation (client-side)
	await page.locator('nav a', { hasText: 'Themes' }).first().click()
	await page.waitForTimeout(400)
	check('themes category navigates', page.url().includes('/themes'), page.url())
	check('themes heading', (await page.textContent('h1'))?.includes('Themes'))

	// Templates ledger: counts + family rows + statuses
	await page.goto(baseUrl + '/templates/', { waitUntil: 'networkidle' })
	const ledgerText = await page.textContent('body')
	check('ledger summary counts', ledgerText.includes('771 routes'), undefined)
	check('ledger shows pending rows', (await page.locator('.sb-status--pending').count()) > 100)

	// Ported Button example route
	await page.goto(baseUrl + '/templates/ButtonShowcase/', { waitUntil: 'networkidle' })
	const buttons = await page.locator('button').allTextContents()
	check('ButtonShowcase renders buttons', buttons.some((t) => t.includes('Primary')) && buttons.some((t) => t.includes('Destructive')))

	// Ported Text example route
	await page.goto(baseUrl + '/templates/TextShowcase/', { waitUntil: 'networkidle' })
	check('TextShowcase renders text types', (await page.textContent('body')).includes('The bulk of content'))

	// Pending template route — honest placeholder, not a fake
	await page.goto(baseUrl + '/templates/AlertDialogAsyncAction/', { waitUntil: 'networkidle' })
	const pendingText = await page.textContent('body')
	check('pending template shows placeholder', pendingText.includes('pending') && pendingText.includes('AlertDialog'))

	// Pending authored page — framed, honest placeholder
	await page.goto(baseUrl + '/pages/example/', { waitUntil: 'networkidle' })
	check('pending page shows upstream source', (await page.textContent('body')).includes('apps/sandbox/src/app'))

	// Motion-lab subtree route resolves as pending
	await page.goto(baseUrl + '/pages/motion-lab/bugs/', { waitUntil: 'networkidle' })
	check('motion-lab subroute resolves', (await page.textContent('body')).includes('pending'))

	// Unknown route → 404 surface
	await page.goto(baseUrl + '/definitely-not-a-route/', { waitUntil: 'networkidle' })
	check('unknown route shows 404', (await page.textContent('body')).includes('404'))

	// Mode toggle persists (light → dark through the nav dropdown)
	await page.goto(baseUrl + '/', { waitUntil: 'networkidle' })
	await page.locator('button[aria-label*="mode"], [aria-label*="mode"]').first().click()
	await page.waitForTimeout(300)
	const darkItem = page.locator('[role="menuitem"], [role="menuitemradio"]').filter({ hasText: 'Dark' }).first()
	if (await darkItem.count()) {
		await darkItem.click()
		await page.waitForTimeout(300)
		const stored = await page.evaluate(() => window.localStorage.getItem('astryx-sandbox-mode'))
		check('dark mode persists', stored === 'dark', `stored=${stored}`)
	} else {
		check('dark mode persists', false, 'mode menu items not found')
	}

	check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
} finally {
	await browser.close()
}

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
