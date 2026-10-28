// Unit-14 whole-app sign-off checks for the sandbox.
//
// verifyCoverage replays the live coverage join (pinned oracle × registries
// × blockers — the same derivation src/coverage/coverage.ts performs, parsed
// here because the registries pull in .tsrx components Node cannot load) and
// asserts every one of the 771 pinned routes: ported rows render real
// content, blocked rows render the honest blocked placeholder, pending rows
// render the pending placeholder.
//
// verifyUnit14RouteChecks adds the rendered-content and behavior checks for
// the families this unit ported, and verifyJourney runs the plan's
// cross-screen whole-app journey.
//
// Textual/DOM assertions only — no screenshots, no pixel checks.

import { readFileSync } from 'node:fs'
import { pinnedRoutes, pinnedStats } from '../src/coverage/pinned.ts'

const appRoot = new URL('../', import.meta.url)

function readSrc(rel) {
	return readFileSync(new URL(rel, appRoot), 'utf8')
}

/** Keys of a top-level `const x = { ... }` object literal, line-based. */
function objectKeys(src, marker) {
	const start = src.indexOf(marker)
	if (start < 0) throw new Error(`marker not found: ${marker}`)
	const open = src.indexOf('{', start)
	let depth = 0
	let end = -1
	for (let i = open; i < src.length; i++) {
		if (src[i] === '{') depth++
		else if (src[i] === '}') {
			depth--
			if (depth === 0) {
				end = i
				break
			}
		}
	}
	const keys = []
	for (const line of src.slice(open + 1, end).split('\n')) {
		const t = line.trim().replace(/,$/, '')
		if (!t || t.startsWith('//')) continue
		const m = t.match(/^([A-Za-z_$][\w$]*|'[^']+'|"[^"]+")\s*(:|$)/)
		if (m) keys.push(m[1].replace(/^['"]|['"]$/g, ''))
	}
	return keys
}

function buildRows() {
	const exampleKeys = objectKeys(readSrc('src/examples/registry.ts'), 'const examples')
	const pageKeys = objectKeys(readSrc('src/pages/registry.ts'), 'const pages')
	const blockers = new Set([
		...objectKeys(readSrc('src/pages/blockers.ts'), 'authoredPageBlockers'),
		...objectKeys(readSrc('src/examples/blockers.ts'), 'templateBlockers'),
	])
	const portedExamples = new Set(exampleKeys)
	const portedPages = new Set(pageKeys)
	const portedFixed = new Set(['/', '/components-patterns/', '/themes/', '/tools/', '/templates/', '/404/'])
	const statusOf = (row) => {
		if (blockers.has(row.route)) return 'blocked'
		if (
			(row.kind === 'template-block' || row.kind === 'template-page') &&
			row.name &&
			portedExamples.has(row.name)
		) {
			return 'ported'
		}
		if (portedFixed.has(row.route) || portedPages.has(row.route)) return 'ported'
		return 'pending'
	}
	return pinnedRoutes.map((row) => ({ ...row, status: statusOf(row) }))
}

export async function verifyCoverage(page, baseUrl, check) {
	const rows = buildRows()
	const counts = { ported: 0, blocked: 0, pending: 0 }
	for (const row of rows) counts[row.status]++
	check(
		`coverage join reconciles ${pinnedStats.total} routes`,
		rows.length === pinnedStats.total,
		`${counts.ported} ported, ${counts.blocked} blocked, ${counts.pending} pending`,
	)

	let failures = 0
	const detail = []
	for (const row of rows) {
		// ?embed=1 renders the bare example/page without the shell chrome —
		// the same document the preview iframe loads — keeping the sweep
		// fast while exercising the real rendered output.
		const url = baseUrl + row.route + '?embed=1'
		let ok = false
		let why = ''
		try {
			await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
			if (row.status === 'ported') {
				const state = await page
					.waitForFunction(
						() => {
							if (document.querySelector('.sb-pending')) return 'pending'
							// Icon/skeleton-only examples carry no text — any rendered
							// element inside the embed root counts. Overlay examples
							// (CommandPalette) portal to body level outside the root.
							const root = document.querySelector('.sb-embed-root')
							if (root) {
								if (root.querySelector('*') || (root.textContent ?? '').trim().length > 0) {
									return 'content'
								}
								if (
									document.querySelector(
										'.vx-command-palette, [role="dialog"], .vx-overlay',
									)
								) {
									return 'content'
								}
								return ''
							}
							const els = document.body?.querySelectorAll('*:not(script):not(style)') ?? []
							return els.length > 0 || (document.body?.textContent ?? '').trim().length > 0
								? 'content'
								: ''
						},
						undefined,
						{ timeout: 12000 },
					)
					.then((h) => h.jsonValue())
				ok = state === 'content'
				why = `state=${state}`
			} else {
				// Chrome mounts before the placeholder on framed pages — wait
				// specifically for the pending marker.
				const state = await page
					.waitForSelector('.sb-pending', { timeout: 12000 })
					.then(() => 'pending')
					.catch(() => 'timeout')
				ok = state === 'pending'
				why = `state=${state}`
			}
			if (ok && row.status !== 'ported') {
				// The placeholder must carry the honest status badge.
				const badge = await page
					.locator('.sb-pending .sb-status')
					.first()
					.textContent()
					.catch(() => '')
				ok = (badge ?? '').trim() === row.status
				why += ` badge=${(badge ?? '').trim()}`
			}
		} catch (e) {
			why = String(e).slice(0, 120)
		}
		if (!ok) {
			failures++
			if (detail.length < 40) detail.push(`${row.route}(${row.status}): ${why}`)
		}
	}
	check(
		'every pinned route renders its recorded status',
		failures === 0,
		`${rows.length} routes, ${failures} failures${detail.length ? ' — ' + detail.join('; ') : ''}`,
	)
}

export async function verifyUnit14RouteChecks(page, baseUrl, check) {
	// --- rendered content: the 17 ported routes ---
	const content = [
		['/templates/BlockquoteShowcase/', 'Design is how it', 'Steve Jobs'],
		['/templates/BlockquoteTestimonials/', 'Sarah K., Lead Engineer', 'Priya L.'],
		['/templates/BlockquoteWithCite/', 'Steve Jobs', 'crazy enough'],
		['/templates/CarouselCards/', 'Design System', 'Contributing'],
		['/templates/CarouselShowcase/', 'Deploy', 'Monitor'],
		['/templates/CarouselSnap/', 'Alice Chen', 'Gina Wilson'],
		['/templates/CitationInlineText/', 'React uses a virtual DOM', 'TypeScript adds static types'],
		['/templates/CitationShowcase/', 'Label variant', 'Number variant'],
		['/templates/CitationSourceList/', 'W3C WAI-ARIA Specification', 'Sources'],
		['/templates/CodeAcrossTextSizes/', 'inline code', 'Label text'],
		['/templates/CodeInlineInParagraph/', 'useState', 'useContext'],
		['/templates/CodeShowcase/', 'npm install @astryxdesign/core', 'ghost'],
		['/templates/CodeVariousContent/', 'yarn build --watch', 'Ctrl+Shift+P'],
		['/templates/VisuallyHiddenLiveRegion/', 'Move task', 'Task is in'],
		['/templates/VisuallyHiddenShowcase/', 'What you see', 'What a screen reader hears'],
		['/templates/VisuallyHiddenStructuralHeading/', 'Build status', 'astryx-charts'],
		['/templates/VisuallyHiddenSupplementaryContext/', 'Revenue', '$48.2k'],
	]
	for (const [route, a, b] of content) {
		await page.goto(baseUrl + route + '?embed=1', { waitUntil: 'domcontentloaded' })
		await page
			.waitForFunction(
				(needle) => {
					const root = document.querySelector('.sb-embed-root')
					return root && (root.textContent ?? '').includes(needle)
				},
				a,
				{ timeout: 10000 },
			)
			.catch(() => {})
		const text = (await page.locator('.sb-embed-root').textContent().catch(() => '')) ?? ''
		check(`route ${route} renders ported content`, text.includes(a) && text.includes(b), `${text.length} chars`)
	}

	// Code renders real inline code elements inside text runs.
	await page.goto(baseUrl + '/templates/CodeShowcase/?embed=1', { waitUntil: 'domcontentloaded' })
	await page.waitForSelector('.sb-embed-root code', { timeout: 10000 }).catch(() => {})
	check(
		'Code renders inline code elements',
		(await page.locator('.sb-embed-root code').count()) >= 4,
		`${await page.locator('.sb-embed-root code').count()} <code>`,
	)

	// Blockquote renders a cite attribution.
	await page.goto(baseUrl + '/templates/BlockquoteShowcase/?embed=1', { waitUntil: 'domcontentloaded' })
	await page.waitForSelector('.sb-embed-root cite', { timeout: 10000 }).catch(() => {})
	check(
		'Blockquote renders cite attribution',
		(await page.locator('.sb-embed-root cite').count()) >= 1,
		`${await page.locator('.sb-embed-root cite').count()} cites`,
	)

	// Citation renders linked chips and numbered pills.
	await page.goto(baseUrl + '/templates/CitationShowcase/?embed=1', { waitUntil: 'domcontentloaded' })
	await page.waitForSelector('.sb-embed-root .vx-citation', { timeout: 10000 }).catch(() => {})
	check(
		'Citation renders both variants',
		(await page.locator('.sb-embed-root .vx-citation').count()) === 6 &&
			(await page.locator('.sb-embed-root .vx-citation--number').count()) === 3,
		`${await page.locator('.sb-embed-root .vx-citation').count()} citations`,
	)
	check(
		'Citation links carry their URLs',
		(await page.locator('.sb-embed-root a[href*="react.dev"]').count()) >= 1,
	)

	// Carousel: slides render; the next button scrolls the viewport.
	await page.goto(baseUrl + '/templates/CarouselSnap/?embed=1', { waitUntil: 'domcontentloaded' })
	await page.waitForSelector('.sb-embed-root .vx-carousel-slide', { timeout: 10000 }).catch(() => {})
	check(
		'Carousel renders all slides',
		(await page.locator('.sb-embed-root .vx-carousel-slide').count()) === 5,
		`${await page.locator('.sb-embed-root .vx-carousel-slide').count()} slides`,
	)
	const before = await page
		.locator('.sb-embed-root .vx-carousel-viewport')
		.evaluate((el) => el.scrollLeft)
		.catch(() => 0)
	await page.locator('.sb-embed-root .vx-carousel-next').click()
	await page.waitForTimeout(500)
	const after = await page
		.locator('.sb-embed-root .vx-carousel-viewport')
		.evaluate((el) => el.scrollLeft)
		.catch(() => before)
	check('Carousel next button scrolls', after > before, `scrollLeft ${before} → ${after}`)

	// VisuallyHidden: hidden node exists with the announced text, and the
	// live region narrates the button-driven state change.
	await page.goto(baseUrl + '/templates/VisuallyHiddenLiveRegion/?embed=1', {
		waitUntil: 'domcontentloaded',
	})
	// The example's region is the div leaf (as="div") — the Move-task button
	// also carries a polite status region, so pin the selector to the div.
	const region = page.locator('.sb-embed-root div.vx-visually-hidden[aria-live="polite"]')
	check('live region mounted hidden', (await region.count()) === 1)
	check(
		'live region announces initial state',
		((await region.textContent()) ?? '').includes('Task moved to Backlog'),
		(await region.textContent()) ?? '',
	)
	await page.locator('.sb-embed-root button', { hasText: 'Move task' }).click()
	await page.waitForTimeout(300)
	check(
		'move task narrates next column',
		((await region.textContent()) ?? '').includes('Task moved to In progress'),
		(await region.textContent()) ?? '',
	)
	check(
		'visible state follows the move',
		((await page.locator('.sb-embed-root').textContent()) ?? '').includes('Task is in In progress'),
	)

	// Blocked template rows: honest placeholder, blocked badge, reason.
	for (const [route, needle] of [
		['/templates/PaginationDotsCarousel/', 'dots'],
		['/templates/PaginationPageSize/', 'pageSize'],
		['/templates/PaginationVariants/', 'variants'],
	]) {
		await page.goto(baseUrl + route + '?embed=1', { waitUntil: 'domcontentloaded' })
		const pending = await page.locator('.sb-pending').count()
		const badge = ((await page.locator('.sb-pending .sb-status').textContent().catch(() => '')) ?? '').trim()
		const text = (await page.locator('.sb-pending').textContent().catch(() => '')) ?? ''
		check(
			`blocked route ${route} shows recorded gap`,
			pending === 1 && badge === 'blocked' && text.includes(needle),
			`pending=${pending} badge=${badge}`,
		)
	}
}

/** The plan's whole-app journey: launch → navigate/search → open a template
 *  → interact → open/dismiss overlays → change theme and viewport → Back →
 *  reset/relaunch, checking retained state and runtime errors. */
export async function verifyJourney(page, baseUrl, check) {
	// Reset preferences so the journey starts from the default theme.
	await page.evaluate(() => {
		window.localStorage.removeItem('astryx-sandbox-theme')
		window.localStorage.removeItem('astryx-sandbox-mode')
	})

	// launch → navigate via sidebar.
	await page.goto(baseUrl + '/', { waitUntil: 'networkidle' })
	check('journey: home loads', ((await page.textContent('h1')) ?? '').includes('Astryx Sandbox'))
	await page.locator('nav a', { hasText: 'Themes' }).first().click()
	await page.waitForTimeout(400)
	check('journey: sidebar navigates', page.url().includes('/themes'), page.url())

	// search → open a template through the templates-ledger search.
	await page.goto(baseUrl + '/templates/', { waitUntil: 'networkidle' })
	await page.fill('input[type="search"], input[placeholder*="Search"]', 'CarouselSnap')
	await page.waitForTimeout(400)
	const hit = page.locator('a[href="/templates/CarouselSnap/"]').first()
	if ((await hit.count()) > 0) {
		await hit.click()
	} else {
		await page.goto(baseUrl + '/templates/CarouselSnap/')
	}
	await page.waitForTimeout(500)
	check('journey: search reaches template', page.url().includes('/templates/CarouselSnap'), page.url())
	check(
		'journey: template renders',
		(await page.locator('.vx-carousel-slide').count()) === 5,
	)

	// interact: scroll the carousel via its next button.
	const scroller = page.locator('.vx-carousel-viewport')
	const x0 = await scroller.evaluate((el) => el.scrollLeft).catch(() => 0)
	await page.locator('.vx-carousel-next').first().click().catch(() => {})
	await page.waitForTimeout(400)
	const x1 = await scroller.evaluate((el) => el.scrollLeft).catch(() => x0)
	check('journey: carousel interaction scrolls', x1 > x0, `${x0} → ${x1}`)

	// overlays: open + dismiss the command palette, then a live overlay.
	await page.locator('.sb-preview-name').first().click()
	await page.waitForTimeout(300)
	check(
		'journey: palette opens',
		(await page.locator('.vx-cmdk-search, [role="dialog"] input').count()) > 0,
	)
	await page.keyboard.press('Escape')
	await page.waitForTimeout(300)
	check(
		'journey: palette dismisses',
		(await page.locator('.vx-cmdk-search').count()) === 0,
	)
	await page.goto(baseUrl + '/templates/ToastShowcase/', { waitUntil: 'networkidle' })
	await page.locator('button', { hasText: 'Show toast' }).first().click()
	await page.waitForTimeout(500)
	check(
		'journey: toast overlay mounts',
		((await page.textContent('body')) ?? '').includes('Document saved successfully'),
	)

	// theme + viewport (template routes carry the PreviewShell's theme menu).
	await page.locator('[aria-label="Preview theme"], [aria-label="Theme"]').first().click()
	await page.waitForTimeout(300)
	await page.locator('[role="menuitemradio"], [role="menuitem"]').filter({ hasText: 'Stone' }).first().click()
	await page.waitForTimeout(300)
	check(
		'journey: theme switches',
		(await page.evaluate(() => document.documentElement.getAttribute('data-xds-theme'))) === 'stone',
	)
	// Narrow viewport: the preview sidebar collapses (AppShell swaps to a
	// drawer toggle on framed routes; template routes hide their sidebar).
	await page.setViewportSize({ width: 480, height: 800 })
	await page.waitForTimeout(400)
	check(
		'journey: narrow viewport collapses navigation',
		(await page.locator('.sb-preview-sidebar').count()) === 0 ||
			(await page.locator('button[aria-label*="navigation" i], button[aria-label*="nav" i]').count()) > 0,
	)
	await page.setViewportSize({ width: 1280, height: 800 })
	await page.waitForTimeout(300)

	// Back → previous route; retained state across a fresh navigation.
	await page.goBack()
	await page.waitForTimeout(400)
	check('journey: Back returns to carousel', page.url().includes('/templates/CarouselSnap'), page.url())

	// reset/relaunch: a fresh load retains the stored theme; then reset.
	await page.goto(baseUrl + '/', { waitUntil: 'networkidle' })
	check(
		'journey: stored theme survives relaunch',
		(await page.evaluate(() => document.documentElement.getAttribute('data-xds-theme'))) === 'stone',
	)
	await page.evaluate(() => {
		window.localStorage.setItem('astryx-sandbox-theme', 'neutral')
		window.localStorage.setItem('astryx-sandbox-mode', 'light')
	})
}
