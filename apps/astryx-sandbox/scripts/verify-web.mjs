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

	// --- Theme runtime (unit 2) ---
	// Root scope carries the named theme + mode markers.
	await page.goto(baseUrl + '/', { waitUntil: 'networkidle' })
	const rootTheme = await page.evaluate(() => document.documentElement.getAttribute('data-xds-theme'))
	check('root theme scope on <html>', rootTheme === 'neutral', `data-xds-theme=${rootTheme}`)
	const scopeCount = await page.locator('.xds-theme-neutral').count()
	check('root theme scope class stamped', scopeCount > 0, `${scopeCount} scopes`)

	// Theme switch: pick Matcha from the nav theme menu, verify the root
	// scope + stored preference change and chrome tokens re-resolve.
	await page.locator('[aria-label="Theme"]').first().click()
	await page.waitForTimeout(300)
	await page.locator('[role="menuitemradio"], [role="menuitem"]').filter({ hasText: 'Matcha' }).first().click()
	await page.waitForTimeout(300)
	check('matcha theme switches root scope', (await page.evaluate(() => document.documentElement.getAttribute('data-xds-theme'))) === 'matcha')
	check('matcha persists', (await page.evaluate(() => window.localStorage.getItem('astryx-sandbox-theme'))) === 'matcha')
	const accent = await page.evaluate(() => getComputedStyle(document.querySelector('.xds-theme-matcha')).getPropertyValue('--color-accent').trim())
	check('matcha accent token resolves', accent === '#3E481D' || accent.length > 0, `accent=${accent}`)

	// Dark mode through the menu: scope class + resolved dark accent arm.
	await page.locator('[aria-label*="mode"]').first().click()
	await page.waitForTimeout(300)
	await page.locator('[role="menuitemradio"], [role="menuitem"]').filter({ hasText: 'Dark' }).first().click()
	await page.waitForTimeout(300)
	const darkScope = await page.locator('.xds-theme-matcha.dark').count()
	check('dark mode marker on scope', darkScope > 0, `${darkScope}`)
	const darkAccent = await page.evaluate(() => {
		const scope = document.querySelector('.xds-theme-matcha.dark')
		const probe = document.createElement('div')
		probe.style.color = 'var(--color-accent)'
		scope.appendChild(probe)
		const c = getComputedStyle(probe).color
		probe.remove()
		return c
	})
	check('dark accent resolves dark arm', darkAccent === 'rgb(192, 203, 169)', `dark=${darkAccent}`)

	// Nested theme example: inner scope's tokens differ from outer's.
	await page.goto(baseUrl + '/templates/ThemeNested/', { waitUntil: 'networkidle' })
	const warm = await page.evaluate(() => getComputedStyle(document.querySelector('.xds-theme-warm-docs')).getPropertyValue('--color-accent').trim())
	const forest = await page.evaluate(() => getComputedStyle(document.querySelector('.xds-theme-forest-docs')).getPropertyValue('--color-accent').trim())
	check('nested themes resolve own tokens', warm !== forest && forest.length > 0, `warm=${warm} forest=${forest}`)

	// useTheme example resolves concrete values into SVG.
	await page.goto(baseUrl + '/templates/useThemeHookUsage/', { waitUntil: 'networkidle' })
	const barColor = await page.evaluate(() => getComputedStyle(document.querySelector('.sb-chart-bar')).backgroundColor)
	check('useTheme resolves accent into chart', /^rgb/.test(barColor ?? ''), `bg=${barColor}`)

	// Palette page: both mode columns render under one route.
	await page.goto(baseUrl + '/pages/neutral-palette/', { waitUntil: 'networkidle' })
	const neutralText = await page.textContent('body')
	check('neutral palette renders', neutralText.includes('Neutral Theme Palette') && neutralText.includes('Light Mode') && neutralText.includes('Dark Mode'))

	// Gothic single-mode palette renders dark-only.
	await page.goto(baseUrl + '/pages/gothic-palette/', { waitUntil: 'networkidle' })
	const gothicText = await page.textContent('body')
	check('gothic palette renders dark mode', gothicText.includes('Gothic Theme Palette') && gothicText.includes('Dark Mode'))

	// Embed query: theme+mode from URL beat stored prefs, no storage write.
	await page.evaluate(() => window.localStorage.setItem('astryx-sandbox-theme', 'stone'))
	await page.goto(baseUrl + '/?embed=1&theme=y2k&mode=dark', { waitUntil: 'networkidle' })
	check('embed theme wins over storage', (await page.evaluate(() => document.documentElement.getAttribute('data-xds-theme'))) === 'y2k')
	const embedStored = await page.evaluate(() => window.localStorage.getItem('astryx-sandbox-theme'))
	check('embed leaves storage untouched', embedStored === 'stone', `stored=${embedStored}`)

	// Persistence: stored stone + dark apply on plain relaunch.
	await page.evaluate(() => { window.localStorage.setItem('astryx-sandbox-theme', 'stone'); window.localStorage.setItem('astryx-sandbox-mode', 'dark') })
	await page.goto(baseUrl + '/', { waitUntil: 'networkidle' })
	check('stored theme applies on relaunch', (await page.evaluate(() => document.documentElement.getAttribute('data-xds-theme'))) === 'stone')
	check('stored mode applies on relaunch', (await page.locator('.xds-theme-stone.dark').count()) > 0)

	check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
} finally {
	await browser.close()
}

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
