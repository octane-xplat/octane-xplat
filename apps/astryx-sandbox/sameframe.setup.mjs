// Sameframe per-page setup for the astryx-sandbox parity matrix.
//
// Sameframe invokes this once per target per capture with
// { page, target, route: { referenceUrl, candidateUrl }, viewport }, after the
// initial navigation and before stabilization/serialization. Everything here
// is driven by `sf-*` query params on the route path (see sameframe.yaml) and
// is deterministic on both targets.
//
// Two normalization duties beyond state setup:
//
// 1. Pinned-baseline drift (sf-pin=1, reference only): the live site carries a
//    "DiffViewer Perf" tool card added after the pinned commit ebd939b; the
//    port follows the pin. Removing that card restores the pinned grid flow so
//    the comparison measures parity, not upstream drift. This is the
//    "allow-list known post-pin additions" option from section 11 of the parity
//    plan — pending a human pin-bump decision.
//
// 2. Landmarks (all pages): data-sameframe-key is stamped on semantically
//    shared nodes so matching survives intentional DOM-shape differences (the
//    port's router host and providers render extra display:contents wrappers
//    upstream doesn't have). Keys are only injected — never content, layout,
//    or style changes.

const FILTER_LABELS = {
	'components-patterns': 'Components & Patterns',
	themes: 'Themes',
	tools: 'Tools',
}

// Runs inside the page. `targetName` is 'reference' | 'candidate'. Landmark
// selectors are per-target because the two apps use different class
// vocabularies (astryx-* vs vx-*) and different wrapper depths.
function injectKeys(targetName) {
	const doc = document
	const key = (name, el) => el?.setAttribute('data-sameframe-key', name)
	const sideNavPanel = doc.querySelector(
		targetName === 'reference' ? '.astryx-app-shell-sidenav' : '.vx-appshell-sidenav',
	)

	key('appshell', doc.querySelector(targetName === 'reference' ? '.astryx-app-shell' : '.vx-appshell'))
	key('layout', doc.querySelector(targetName === 'reference' ? '.astryx-layout' : '.vx-appshell-body'))
	key('midrow', targetName === 'reference' ? sideNavPanel?.parentElement : doc.querySelector('.vx-appshell-middle'))
	key('sidenav', sideNavPanel)
	const main = doc.querySelector('[role="main"], main')
	key('main', main)
	// Page-level Layout chain inside main: both sides are
	// main > layout root > inner flex row, so firstElementChild walks align
	// despite different wrapper vocabularies upstream.
	const pageLayout = main?.firstElementChild
	key('page-layout', pageLayout)
	// Upstream wraps the content column in an extra visible div plus a
	// display:contents marker the port doesn't have. Pin the visible wrapper
	// to the port's layout-inner row and the contents marker to the port's
	// router contents wrapper so neither steals a visible node's match.
	key(
		'content-wrap',
		targetName === 'reference' ? sideNavPanel?.nextElementSibling : pageLayout?.firstElementChild,
	)
	key(
		'contents-wrap',
		targetName === 'reference'
			? sideNavPanel?.nextElementSibling?.firstElementChild
			: doc.querySelector('.vx-appshell')?.parentElement,
	)
	key(
		'skiplink',
		targetName === 'reference'
			? doc.querySelector('.astryx-app-shell > a[href^="#"]')
			: doc.querySelector('.vx-appshell-skiplink'),
	)
	key('title', doc.querySelector('[role="main"] h1, main h1'))
	key('search', doc.querySelector('input[placeholder="Search..."]'))
	key('filters', doc.querySelector('[aria-label="Filter by category"]'))

	// Label-hiding mechanics differ legitimately in the collapsed rail:
	// upstream clips section titles to 1px and wraps labels in role=tooltip
	// nodes; the port hides them with visibility:hidden. Stamp data-sf-ignore
	// (see ignore.selectors in sameframe.yaml) on those mechanism nodes so the
	// comparison isn't dominated by invisible-label bookkeeping. Expanded
	// titles stay visible and keep comparing normally.
	for (const el of doc.querySelectorAll('div[role="tooltip"]')) {
		el.setAttribute('data-sf-ignore', '')
	}
	for (const el of [...doc.querySelectorAll('nav *')]) {
		const text = el.textContent?.trim()
		if (text !== 'Sandbox' && text !== 'Audits') continue
		if ([...el.children].some((c) => c.textContent?.trim() === text)) continue
		let top = el
		while (
			top.parentElement?.closest('nav') &&
			top.parentElement.children.length === 1 &&
			top.parentElement.textContent.trim() === text
		) {
			top = top.parentElement
		}
		const rect = top.getBoundingClientRect()
		if (getComputedStyle(top).visibility === 'hidden' || rect.width <= 2 || rect.height === 0) {
			top.setAttribute('data-sf-ignore', '')
		}
	}

	// Category filter toggles render two label spans — a visible one and a
	// hidden semibold width reservation. Key the button and its visible span so
	// the matcher doesn't pair a visible span with the hidden twin.
	const group = doc.querySelector('[aria-label="Filter by category"]')
	if (group) {
		for (const btn of group.querySelectorAll('button')) {
			const name = btn.getAttribute('aria-label') ?? ''
			if (!name) continue
			btn.setAttribute('data-sameframe-key', `toggle-${name}`)
			const visible = [...btn.querySelectorAll('span')].find((span) => {
				const rect = span.getBoundingClientRect()
				return (
					span.textContent.trim() === name &&
					rect.height > 0 &&
					getComputedStyle(span).visibility !== 'hidden'
				)
			})
			visible?.setAttribute('data-sameframe-key', `toggle-label-${name}`)
		}
	}
}

async function clickByText(page, text) {
	await page.evaluate((wanted) => {
		const el = [...document.querySelectorAll('button, a')].find(
			(node) =>
				node.textContent.trim() === wanted &&
				node.getBoundingClientRect().height > 0,
		)
		el?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
	}, text)
}

async function clickByAriaLabel(page, match) {
	await page.evaluate((wanted) => {
		const el = [...document.querySelectorAll('button')].find((node) => {
			const label = (node.getAttribute('aria-label') ?? '').toLowerCase()
			return label.includes(wanted) && node.getBoundingClientRect().height > 0
		})
		el?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
	}, match)
}

export default async function setup({ page, target }) {
	const url = new URL(page.url())
	const params = url.searchParams

	// Theme/mode variants ride the upstream `?embed=1&theme=&mode=` contract in
	// the route URL itself (see sameframe.yaml) — synchronous on both targets,
	// no storage or reload needed.

	// App mount: wait for a deep-rendered page, not just the shell. Embed mode
	// client-renders both targets through a lazy page load, so early DOM
	// mutations can be wiped when the real content swaps in.
	await page
		.waitForSelector('[role="main"], main, nav', { timeout: 20000 })
		.catch(() => {})
	await page
		.waitForFunction(() => document.querySelectorAll('a[href]').length > 10, {
			timeout: 20000,
		})
		.catch(() => {})
	await page.waitForTimeout(400)

	// Pinned-baseline normalization (see header note). Runs again after the
	// state interactions below — filter clicks re-render the card grid and can
	// resurrect the removed node.
	const removeDrift = () =>
		target === 'reference' && params.get('sf-pin') === '1'
			? page.evaluate(() => {
					for (const card of document.querySelectorAll('a[href$="diffviewer-perf/"]')) {
						card.remove()
					}
				})
			: Promise.resolve()
	await removeDrift()

	// Route states.
	const state = params.get('sf-state')
	if (state === 'nav-collapsed') {
		await clickByAriaLabel(page, 'ollapse sidebar')
		await page.waitForTimeout(300)
	} else if (state === 'nav-hover') {
		await page
			.locator('a[href$="/tools/"]')
			.first()
			.hover({ timeout: 5000 })
			.catch(() => {})
	} else if (state === 'menu-theme') {
		await clickByAriaLabel(page, 'theme')
		await page.waitForTimeout(300)
	} else if (state === 'menu-mode') {
		await clickByAriaLabel(page, ' mode')
		await page.waitForTimeout(300)
	} else if (state === 'mobile-nav') {
		await clickByAriaLabel(page, 'avigation')
		await page.waitForTimeout(400)
	}

	// Home search + category filter.
	const search = params.get('sf-search')
	if (search != null) {
		const selector = 'input[placeholder="Search..."]'
		await page.waitForSelector(selector, { timeout: 15000 }).catch(() => {})
		await page.fill(selector, search).catch(() => {})
		await page.waitForTimeout(400)
	}
	const filter = params.get('sf-filter')
	if (filter) {
		const label = FILTER_LABELS[filter] ?? filter
		await clickByText(page, label)
		await page.waitForTimeout(400)
	}

	await removeDrift()

	// Landmarks last — after every DOM mutation above.
	await page.evaluate(injectKeys, target)
}
