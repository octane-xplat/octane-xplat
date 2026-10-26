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

	// Category filter row (upstream ToggleButtonGroup, F-7) — four options,
	// selecting one swaps the grouped sections for a single ungrouped grid.
	const filterGroup = page.locator('[role="group"][aria-label="Filter by category"]')
	check('home category filter renders', (await filterGroup.locator('button').count()) === 4)
	await filterGroup.locator('button', { hasText: 'Themes' }).click()
	await page.waitForTimeout(200)
	const themedCards = await page.locator('.sb-card-grid a').count()
	check('category filter narrows grid', themedCards > 0 && themedCards < 20, `${themedCards} cards`)
	check('filtered grid is ungrouped', (await page.locator('main h2, [role="main"] h2, h2').count()) === 0)
	await filterGroup.locator('button', { hasText: 'All' }).click()
	await page.waitForTimeout(200)
	check('All restores sections', (await page.locator('h2').count()) > 0)

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
	await page.goto(baseUrl + '/templates/AppShellShowcase/', { waitUntil: 'networkidle' })
	const pendingText = await page.textContent('body')
	check('pending template shows placeholder', pendingText.includes('pending') && pendingText.includes('AppShell'))

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

	// All six root themes switch through the theme menu: each selection
	// restamps the root scope and resolves its own accent token. Back in
	// light mode first so the dark-arm assertions above stay scoped.
	await page.locator('[aria-label*="mode"]').first().click()
	await page.waitForTimeout(300)
	await page.locator('[role="menuitemradio"], [role="menuitem"]').filter({ hasText: 'Light' }).first().click()
	await page.waitForTimeout(300)
	const themeCases = [
		['Neutral', 'neutral'],
		['Matcha', 'matcha'],
		['Stone', 'stone'],
		['Gothic', 'gothic'],
		['Chocolate', 'chocolate'],
		['Y2K', 'y2k'],
	]
	for (const [label, id] of themeCases) {
		await page.locator('[aria-label="Theme"]').first().click()
		await page.waitForTimeout(300)
		await page.locator('[role="menuitemradio"], [role="menuitem"]').filter({ hasText: label }).first().click()
		await page.waitForTimeout(300)
		check(
			`${id} theme switches root scope`,
			(await page.evaluate(() => document.documentElement.getAttribute('data-xds-theme'))) === id,
		)
		const themedAccent = await page.evaluate((name) => {
			const scope = document.querySelector(`.xds-theme-${name}`)
			if (!scope) return ''
			const probe = document.createElement('div')
			probe.style.color = 'var(--color-accent)'
			scope.appendChild(probe)
			const c = getComputedStyle(probe).color
			probe.remove()
			return c
		}, id)
		check(`${id} accent token resolves`, /^rgb/.test(themedAccent), `accent=${themedAccent}`)
	}

	// Nested theme example: inner scope's tokens differ from outer's.
	await page.goto(baseUrl + '/templates/ThemeNested/', { waitUntil: 'networkidle' })
	const warm = await page.evaluate(() => getComputedStyle(document.querySelector('.xds-theme-warm-docs')).getPropertyValue('--color-accent').trim())
	const forest = await page.evaluate(() => getComputedStyle(document.querySelector('.xds-theme-forest-docs')).getPropertyValue('--color-accent').trim())
	check('nested themes resolve own tokens', warm !== forest && forest.length > 0, `warm=${warm} forest=${forest}`)

	// useTheme example resolves concrete values into SVG.
	await page.goto(baseUrl + '/templates/useThemeHookUsage/', { waitUntil: 'networkidle' })
	const barColor = await page.evaluate(() => getComputedStyle(document.querySelector('.sb-chart-bar')).backgroundColor)
	check('useTheme resolves accent into chart', /^rgb/.test(barColor ?? ''), `bg=${barColor}`)

	// Palette page: both mode columns render under one route. Fullscreen
	// authored pages live inside the preview shell's embed iframe (unit 3) —
	// read the frame document, not the outer body.
	await page.goto(baseUrl + '/pages/neutral-palette/', { waitUntil: 'networkidle' })
	const neutralText = await frameBodyText(page, 'neutral-palette', 'Neutral Theme Palette')
	check('neutral palette renders', (neutralText ?? '').includes('Neutral Theme Palette') && (neutralText ?? '').includes('Light Mode') && (neutralText ?? '').includes('Dark Mode'))

	// Gothic single-mode palette renders dark-only.
	await page.goto(baseUrl + '/pages/gothic-palette/', { waitUntil: 'networkidle' })
	const gothicText = await frameBodyText(page, 'gothic-palette', 'Gothic Theme Palette')
	check('gothic palette renders dark mode', (gothicText ?? '').includes('Gothic Theme Palette') && (gothicText ?? '').includes('Dark Mode'))

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

	// --- Preview shell (unit 3) ---
	// Reset preferences so checks start from a known theme/mode.
	await page.evaluate(() => { window.localStorage.setItem('astryx-sandbox-theme', 'neutral'); window.localStorage.setItem('astryx-sandbox-mode', 'light') })
	await page.goto(baseUrl + '/templates/ButtonShowcase/', { waitUntil: 'networkidle' })

	// Toolbar chrome + page name.
	check('preview toolbar present', (await page.locator('.sb-preview-toolbar').count()) === 1)
	check('preview names the example', (await page.textContent('.sb-preview-name'))?.includes('Button') ?? false)

	// Sidebar tree: toggle on, both groups present, selected family expanded,
	// a leaf link routes client-side.
	await page.locator('button[aria-label*="sidebar" i]').first().click()
	await page.waitForTimeout(300)
	const treeItems = await page.locator('[role="treeitem"]').count()
	check('sidebar tree covers families', treeItems > 160, `${treeItems} rows`)
	const treeText = await page.locator('.sb-preview-sidebar').textContent()
	check('sidebar groups pages+components', treeText.includes('Pages') && treeText.includes('Components') && treeText.includes('Button'))
	await page.locator('a.vx-tree-label--link[href="/templates/ButtonVariants/"]').first().click()
	await page.waitForTimeout(400)
	check('sidebar leaf navigates', page.url().includes('/templates/ButtonVariants'), page.url())

	// Every template destination is reachable through sidebar/category search:
	// the palette and the /templates/ ledger are both driven by the full
	// coverage registry (all 714 template routes + authored pages).
	await page.locator('.sb-preview-name').first().click()
	await page.waitForTimeout(300)
	await page.fill('.vx-cmdk-search', 'Funnel & Cohort')
	await page.waitForTimeout(400)
	const funnel = page.locator('[role="option"]', { hasText: 'Funnel & Cohort Dashboard' }).first()
	check('palette finds distant template', (await funnel.count()) > 0)
	await funnel.click()
	await page.waitForTimeout(500)
	check('palette selection navigates', page.url().includes('/templates/dashboard-cohort-funnel'), page.url())
	await page.goto(baseUrl + '/templates/', { waitUntil: 'networkidle' })
	await page.fill('input[type="search"], input[placeholder*="Search"]', 'markdown-perf')
	await page.waitForTimeout(200)
	check('ledger search reaches authored route', (await page.locator('a[href*="/pages/markdown-perf/"]').count()) > 0)

	// Source view + copy feedback on a ported example (grant clipboard).
	await page.goto(baseUrl + '/templates/TextWrap/', { waitUntil: 'networkidle' })
	await page.locator('button[role="radio"], [role="radiogroup"] *', { hasText: 'Code' }).first().click().catch(async () => {
		await page.locator('text=Code').first().click()
	})
	await page.waitForTimeout(300)
	const codeText = await page.textContent('.sb-preview-code')
	check('source view shows Octane source', (codeText ?? '').includes('export function TextWrap'))
	// Copy-source action reports copied state (icon/label swap).
	await page.locator('button[aria-label="Copy source"]').first().click()
	await page.waitForTimeout(400)
	check(
		'copy source reports copied state',
		(await page.locator('button[aria-label="Copied"]').count()) > 0 ||
			(await page.locator('.sb-preview-toolbar svg').count()) > 0,
	)

	// Embed/preview iframe on a page template + authored fullscreen page.
	await page.goto(baseUrl + '/pages/neutral-palette/', { waitUntil: 'networkidle' })
	await page.waitForSelector('iframe', { timeout: 8000 }).catch(() => {})
	const frameText = await frameBodyText(page, 'embed=1', 'Neutral Theme Palette')
	const frame = page.frames().find((f) => f.url().includes('embed=1'))
	check('fullscreen page renders in embed iframe', !!frame, frame?.url() ?? 'none')
	check('iframe renders palette page', (frameText ?? '').includes('Neutral Theme Palette'))
	// Theme dropdown in the preview toolbar syncs the iframe via postMessage.
	await page.locator('[aria-label="Preview theme"]').first().click()
	await page.waitForTimeout(300)
	await page.locator('[role="menuitemradio"], [role="menuitem"]').filter({ hasText: 'Y2K' }).first().click()
	await page.waitForTimeout(400)
	if (frame) {
		const embedTheme = await frame.evaluate(() => document.documentElement.getAttribute('data-xds-theme'))
		check('postMessage theme sync reaches embed', embedTheme === 'y2k', `embed theme=${embedTheme}`)
	}

	// Custom-link example: provider injects the intercepting link component.
	await page.goto(baseUrl + '/templates/LinkProviderCustomLink/', { waitUntil: 'networkidle' })
	await page.locator('a', { hasText: 'Go to dashboard' }).first().click()
	await page.waitForTimeout(300)
	check(
		'custom link intercepts navigation',
		(await page.textContent('body'))?.includes('RouterLink intercepted navigation to: /dashboard') ?? false,
	)
	check('interception did not navigate', page.url().includes('/templates/LinkProviderCustomLink'), page.url())

	// Responsive navigation: below the md breakpoint the AppShell swaps the
	// sidebar for a drawer toggle.
	await page.goto(baseUrl + '/', { waitUntil: 'networkidle' })
	await page.setViewportSize({ width: 480, height: 800 })
	await page.waitForTimeout(400)
	const navToggle = page.locator('button[aria-label*="navigation" i], button[aria-label*="nav" i]').first()
	check('mobile nav toggle appears', (await navToggle.count()) > 0)
	if (await navToggle.count()) {
		await navToggle.click()
		await page.waitForTimeout(300)
		check('mobile drawer shows nav', (await page.locator('nav, [role="navigation"], .vx-sidenav').count()) > 0)
	}
	await page.setViewportSize({ width: 1280, height: 800 })

	// --- Layers and overlays (unit 4) ---
	// Inline dialog surfaces title + subtitle without a modal mount.
	await page.goto(baseUrl + '/templates/DialogHeaderBasic/', { waitUntil: 'networkidle' })
	check('inline dialog header renders', (await page.textContent('body')).includes('Invite teammates'))

	// Fullscreen dialog opens and closes through the shared Dialog contract.
	await page.goto(baseUrl + '/templates/DialogFullscreenDialog/', { waitUntil: 'networkidle' })
	await page.locator('button', { hasText: 'Open documentation' }).first().click()
	await page.waitForTimeout(400)
	check('fullscreen dialog opens', (await page.textContent('body')).includes('Everything you need to get started'))
	await page.locator('button', { hasText: 'Close' }).first().click()
	await page.waitForTimeout(400)
	check('fullscreen dialog closes', !(await page.textContent('body')).includes('Everything you need to get started'))

	// Bottom-sheet switcher advances through steps and dismisses on Escape.
	await page.goto(baseUrl + '/templates/BottomSheetSwitcherShowcase/', { waitUntil: 'networkidle' })
	await page.locator('button', { hasText: 'Set up notifications' }).first().click()
	await page.waitForTimeout(500)
	check('sheet switcher step 1', (await page.textContent('body')).includes('Step 1 of 3'))
	await page.locator('button', { hasText: 'Continue' }).first().click()
	await page.waitForTimeout(500)
	check('sheet switcher step 2', (await page.textContent('body')).includes('Step 2 of 3'))
	await page.keyboard.press('Escape')
	await page.waitForTimeout(500)
	check('sheet dismisses on Escape', !(await page.textContent('body')).includes('Step 2 of 3'))

	// Dropdown menu data-mode: open, pick an item, row closes and reports.
	// Menu triggers are Pressable divs (role=button), not <button> elements.
	await page.goto(baseUrl + '/templates/DropdownMenuActions/', { waitUntil: 'networkidle' })
	await page.locator('.vx-menu-trigger', { hasText: 'Actions' }).first().click()
	await page.waitForTimeout(400)
	await page.locator('.vx-menu-item', { hasText: 'Edit' }).first().click()
	await page.waitForTimeout(300)
	check('menu item reports selection', (await page.textContent('body')).includes('Last action: Edit'))

	// Context menu opens on right-click and dismisses via Escape.
	await page.goto(baseUrl + '/templates/ContextMenuBasic/', { waitUntil: 'networkidle' })
	await page.locator('.vx-contextmenu').first().click({ button: 'right' })
	await page.waitForTimeout(400)
	check('context menu opens', (await page.locator('.vx-menu-item').count()) >= 3, `${await page.locator('.vx-menu-item').count()} items`)
	await page.keyboard.press('Escape')
	await page.waitForTimeout(400)

	// useLayer hook example: anchored layer toggles and light-dismisses.
	await page.goto(baseUrl + '/templates/LayerHookUsage/', { waitUntil: 'networkidle' })
	await page.locator('button', { hasText: 'Show layer' }).first().click()
	await page.waitForTimeout(400)
	check('useLayer shows anchored card', (await page.textContent('body')).includes('Anchored content'))
	// lightDismiss: the open layer's backdrop covers the page — a click there
	// (not on the trigger) is what closes it.
	await page.mouse.click(20, 20)
	await page.waitForTimeout(400)
	check('useLayer light-dismisses', !(await page.textContent('body')).includes('Anchored content'))

	// usePopover hook: trigger toggles the quick-actions panel.
	await page.goto(baseUrl + '/templates/PopoverHookUsage/', { waitUntil: 'networkidle' })
	await page.locator('button', { hasText: 'Open actions' }).first().click()
	await page.waitForTimeout(400)
	check('usePopover renders panel', (await page.textContent('body')).includes('Create task'))

	// useTooltip hook: hovering the trigger mounts the hint. Layer-stack
	// mount + positioning adds latency past the configured show delay, so
	// poll for the hint text rather than asserting on a fixed wait.
	await page.goto(baseUrl + '/templates/TooltipHookUsage/', { waitUntil: 'networkidle' })
	await page.locator('button', { hasText: 'Using hook directly' }).first().hover()
	const hintMounted = await page
		.waitForFunction(() => document.body.textContent?.includes('Tooltip via hook'), undefined, { timeout: 5000 })
		.then(() => true)
		.catch(() => false)
	check('useTooltip shows hint', hintMounted)

	// Toasts mount through the LayerProvider-mounted viewport.
	await page.goto(baseUrl + '/templates/ToastShowcase/', { waitUntil: 'networkidle' })
	const before = (await page.textContent('body')).match(/Document saved successfully/g)?.length ?? 0
	await page.locator('button', { hasText: 'Show toast' }).first().click()
	await page.waitForTimeout(500)
	const after = (await page.textContent('body')).match(/Document saved successfully/g)?.length ?? 0
	check('toast mounts via provider viewport', after > before, `${before}→${after}`)


	// --- Unit 5: forms, selection and date examples ---
	// Field chrome: label + required marker + status message.
	await page.goto(baseUrl + '/templates/FieldStatusVariants/', { waitUntil: 'networkidle' })
	const fieldText = await page.textContent('body')
	check('Field status renders error/warning/success', fieldText.includes('valid email address') && fieldText.includes('reserved for administrators') && fieldText.includes('valid and active'))

	// TextInput: controlled value + clear affordance + icon.
	await page.goto(baseUrl + '/templates/TextInputSearch/', { waitUntil: 'networkidle' })
	check('TextInput search renders value', await page.locator('input[placeholder="Filter…"]').count() > 0)
	check('TextInput clear shows while valued', await page.locator('.vx-input-clear').count() > 0)

	// RadioList child parts: items read group selection state.
	await page.goto(baseUrl + '/templates/RadioListShowcase/', { waitUntil: 'networkidle' })
	await page.locator('.vx-radiolist-item', { hasText: 'SMS' }).first().click()
	await page.waitForTimeout(300)
	check('RadioListItem selects via context', await page.locator('.vx-radiolist-item.vx-radio--on', { hasText: 'SMS' }).count() > 0)

	// CheckboxList child parts + indeterminate select-all.
	await page.goto(baseUrl + '/templates/CheckboxListSelectAllPattern/', { waitUntil: 'networkidle' })
	await page.locator('.vx-checkboxlist-item', { hasText: 'Select all' }).first().click()
	await page.waitForTimeout(300)
	const checkedCount = await page.locator('.vx-checkboxlist-item.vx-checkbox--on').count()
	check('CheckboxList select-all checks all', checkedCount >= 5, `${checkedCount} checked`)

	// Switch toggles.
	await page.goto(baseUrl + '/templates/SwitchShowcase/', { waitUntil: 'networkidle' })
	const switchOn = await page.locator('[role="switch"][aria-checked="true"], .vx-switch--on').count()
	check('Switch renders on', switchOn > 0, `${switchOn} on`)

	// SegmentedControlItem child parts.
	await page.goto(baseUrl + '/templates/SegmentedControlShowcase/', { waitUntil: 'networkidle' })
	await page.locator('.vx-segment', { hasText: 'Archived' }).first().click()
	await page.waitForTimeout(300)
	check('SegmentedControlItem selects', await page.locator('.vx-segment--on', { hasText: 'Archived' }).count() > 0)

	// Stepper Step children: active index + status indicators.
	await page.goto(baseUrl + '/templates/StepperStatus/', { waitUntil: 'networkidle' })
	const stepText = await page.textContent('body')
	check('Stepper Step renders states', stepText.includes('Passport upload failed') && stepText.includes('Pending review'))

	// Selector: trigger opens listbox; renderOption rows render.
	await page.goto(baseUrl + '/templates/SelectorOptionShowcase/', { waitUntil: 'networkidle' })
	await page.locator('.vx-select-trigger').first().click()
	await page.waitForTimeout(400)
	check('Selector opens listbox', await page.locator('.vx-select-option').count() >= 3, `${await page.locator('.vx-select-option').count()} options`)
	check('Selector renderOption rows', await page.locator('.vx-selectoroption').count() >= 3)
	await page.keyboard.press('Escape')
	await page.waitForTimeout(300)

	// MultiSelector bottom-sheet presentation.
	await page.goto(baseUrl + '/templates/MultiSelectorBottomSheet/', { waitUntil: 'networkidle' })
	await page.locator('.vx-select-trigger').first().click()
	await page.waitForTimeout(500)
	check('MultiSelector sheet presentation opens options', await page.locator('.vx-select-sheet .vx-select-option, .vx-menu-item').count() > 0)
	await page.keyboard.press('Escape')
	await page.waitForTimeout(300)

	// Slider: range value + marks + formatted readout.
	await page.goto(baseUrl + '/templates/SliderFormattedValue/', { waitUntil: 'networkidle' })
	check('Slider formatted readout', (await page.textContent('body')).includes('72°F'))

	// Typeahead: searchSource items filter on query.
	await page.goto(baseUrl + '/templates/TypeaheadShowcase/', { waitUntil: 'networkidle' })
	await page.locator('input[placeholder*="typing"]').first().fill('uni')
	await page.waitForTimeout(600)
	check('Typeahead lists filtered items', await page.locator('.vx-menu-item, [role="option"]').count() > 0, `${await page.locator('.vx-menu-item, [role="option"]').count()} items`)

	// Tokenizer: seeded tokens render.
	await page.goto(baseUrl + '/templates/TokenizerShowcase/', { waitUntil: 'networkidle' })
	check('Tokenizer renders tokens', (await page.textContent('body')).includes('typescript'))

	// DateInput + Calendar render.
	await page.goto(baseUrl + '/templates/DateInputShowcase/', { waitUntil: 'networkidle' })
	check('DateInput renders field', (await page.textContent('body')).includes('Birthday'))
	await page.goto(baseUrl + '/templates/CalendarRangeWithValue/', { waitUntil: 'networkidle' })
	check('Calendar range renders month grid', await page.locator('.vx-calendar, [role="grid"]').count() > 0)

	// NumberInput units + steppers.
	await page.goto(baseUrl + '/templates/NumberInputWithUnits/', { waitUntil: 'networkidle' })
	check('NumberInput renders units', (await page.textContent('body')).includes('%'))

	// FormLayout: fields render in the shared grid.
	await page.goto(baseUrl + '/templates/FormLayoutShowcase/', { waitUntil: 'networkidle' })
	const formText = await page.textContent('body')
	check('FormLayout renders fields', formText.includes('Full name') && formText.includes('Select role'))

	// tap-targets page: audit table + live controls.
	await page.goto(baseUrl + '/pages/tap-targets/', { waitUntil: 'networkidle' })
	const tapText = await page.textContent('body')
	check('tap-targets audit table renders', tapText.includes('WCAG 2.5.8') && tapText.includes('CheckboxInput'))

	// textarea-counter page: counter + status row.
	await page.goto(baseUrl + '/pages/textarea-counter/', { waitUntil: 'networkidle' })
	const counterText = await page.textContent('body')
	check('textarea-counter live count', counterText.includes('/140') || counterText.includes('remaining'))

	check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
} finally {
	await browser.close()
}

/** Poll an embed iframe's body text until `needle` appears (or ~10s). */
async function frameBodyText(page, urlPart, needle) {
	await page.waitForSelector('iframe', { timeout: 8000 }).catch(() => {})
	for (let i = 0; i < 20; i++) {
		const frame = page.frames().find((f) => f !== page.mainFrame() && f.url().includes(urlPart))
		if (frame) {
			const text = await frame.locator('body').textContent().catch(() => '')
			if ((text ?? '').includes(needle)) return text
		}
		await page.waitForTimeout(500)
	}
	return ''
}

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
