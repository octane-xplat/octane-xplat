// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
/**
 * Workshop web e2e — drives the demo's own `xplat workshop dev` server in a
 * real browser and asserts the adaptive shell end to end:
 *   catalog/search/filter, mount through the real Octane DOM renderer,
 *   interaction, typed controls, reset, wide/compact/phone layout, stage-only
 *   mode, fixture/render failure surfaces, recovery.
 *
 * Usage: node scripts/e2e-web.ts  (spawns its own server on :5299)
 *        node scripts/e2e-web.ts http://host:port/  (attach to a running one)
 */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const base = process.argv[2] ?? null
let server = null
let url = base

if (!base) {
	url = await new Promise((resolve, reject) => {
		server = spawn(
			fileURLToPath(new URL('../node_modules/.bin/xplat', import.meta.url)),
			['workshop', 'dev', '--target', 'web'],
			{ cwd: fileURLToPath(new URL('..', import.meta.url)), stdio: ['ignore', 'pipe', 'inherit'] },
		)

		let output = ''
		server.stdout.on('data', (chunk) => {
			output += chunk
			const match = /WORKSHOP_READY (https?:\/\/\S+)/.exec(output)
			if (match) {
				resolve(match[1])
			}
		})

		server.on('exit', () => reject(new Error('workshop dev exited before WORKSHOP_READY')))
		setTimeout(() => reject(new Error('workshop dev did not report ready in 30s')), 30_000).unref()
	})
}

const results = []
const check = (name, ok, detail = '') => {
	results.push([name, ok])
	console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
}

const browser = await chromium.launch({ headless: true })
try {
	const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
	const text = async (sel) => (await page.textContent(sel).catch(() => null))?.trim()

	const pageErrors = []
	page.on('pageerror', (e) => pageErrors.push('pageerror: ' + e.message))
	page.on('console', (m) => {
		if (m.type() === 'error' && !m.text().includes('Failed to load resource')) {
			pageErrors.push('console: ' + m.text())
		}
	})

	await page.goto(url, { waitUntil: 'load' })
	await page.waitForSelector('.xw-root', { timeout: 15_000 }).catch((error) => {
		console.error('Browser startup diagnostics:', pageErrors.join('\n'))
		throw error
	})

	check('wide layout', (await page.getAttribute('.xw-root', 'class'))?.includes('xw-wide'))

	const stories = await page.$$eval('.xw-story', (els) =>
		els.map((el) => ({ name: el.textContent?.trim(), disabled: el.disabled })),
	)

	check('catalog lists stories', stories.length === 10, `${stories.length} stories`)
	check('foreign leaf stories listed disabled', stories.filter((s) => s.disabled).length === 2)

	await page.fill('.xw-search', 'async')
	const found = await page.$$eval('.xw-story', (els) => els.map((el) => el.textContent?.trim()))
	check('search filters', found.length === 1 && found[0] === 'Async fixture')
	await page.fill('.xw-search', '')

	await page.click('.xw-story >> text=Basic')
	await page.waitForSelector('.xw-stage-mount', { timeout: 60_000 }).catch(async (error) => {
		console.error(
			'Story startup diagnostics:',
			pageErrors.join('\n'),
			await page.textContent('.xw-stage-area'),
		)
		throw error
	})

	await page.waitForTimeout(400)
	check('mount renders real component', (await text('.xw-stage-mount')) === 'Demo: 0 (+1)')

	// Chrome regressions use DOM geometry and computed styles only.
	const palette = () =>
		page.evaluate(() => {
			const style = (selector) => getComputedStyle(document.querySelector(selector))
			return {
				surface: style('.xw-catalog').backgroundColor,
				text: style('.xw-catalog').color,
				muted: style('.xw-phase').color,
				fieldBorder: style('.xw-search').borderTopColor,
				stage: style('.xw-stage-mount').color,
				selected: style('.xw-story-active').backgroundColor,
			}
		})

	const light = await palette()
	const contrast = (foreground, background) => {
		const luminance = (color) => {
			const rgb = color
				.match(/[\d.]+/g)
				.slice(0, 3)
				.map(Number)
				.map((n) => {
					const v = n / 255
					return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
				})
			return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
		}
		const a = luminance(foreground),
			b = luminance(background)
		return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
	}

	check(
		'light chrome contrast',
		contrast(light.text, light.surface) >= 4.5 &&
			contrast(light.muted, light.surface) >= 4.5 &&
			contrast(light.fieldBorder, light.surface) >= 3,
	)

	await page.hover('.xw-reset')
	const hover = await page.$eval('.xw-reset', (el) => getComputedStyle(el).backgroundColor)
	await page.mouse.move(0, 0)
	const resting = await page.$eval('.xw-reset', (el) => getComputedStyle(el).backgroundColor)
	check('toolbar hover state', hover !== resting)
	await page.keyboard.press('Tab')
	await page.focus('.xw-search')
	check(
		'keyboard focus visible',
		await page.$eval('.xw-search', (el) => {
			const style = getComputedStyle(el)
			return (
				el.matches(':focus-visible') &&
				style.outlineStyle !== 'none' &&
				parseFloat(style.outlineWidth) >= 2
			)
		}),
	)

	check('selected story distinct', light.selected !== light.surface)
	check(
		'unsupported story remains disabled',
		await page.$eval('.xw-story:disabled', (el) => el.disabled),
	)

	await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
	const dark = await palette()
	check(
		'dark chrome contrast',
		contrast(dark.text, dark.surface) >= 4.5 &&
			contrast(dark.muted, dark.surface) >= 4.5 &&
			contrast(dark.fieldBorder, dark.surface) >= 3 &&
			dark.surface !== light.surface,
	)

	check('theme preserves specimen color', dark.stage === light.stage)
	await page.evaluate(() => document.documentElement.classList.add('light'))
	check('explicit light overrides system dark', (await palette()).surface === light.surface)
	await page.evaluate(() => document.documentElement.classList.remove('light'))
	check(
		'reduced motion chrome is immediate',
		await page.$eval('.xw-reset', (el) => {
			const style = getComputedStyle(el)
			return style.animationName === 'none' && style.transitionDuration === '0s'
		}),
	)

	await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' })
	await page.evaluate(() => document.documentElement.classList.add('dark'))
	check('explicit dark chrome', (await palette()).surface === dark.surface)
	await page.evaluate(() => document.documentElement.classList.remove('dark'))
	for (const width of [320, 390, 640, 800]) {
		await page.setViewportSize({ width, height: 844 })
		await page.waitForFunction(
			() => document.querySelector('.xw-root').classList.contains('xw-wide') === false,
		)

		check(
			`toolbar fits ${width}px`,
			await page.$$eval('.xw-statusbar .xw-btn', (els) =>
				els.every((el) => {
					const rect = el.getBoundingClientRect()
					return rect.left >= 0 && rect.right <= window.innerWidth && rect.height >= 32
				}),
			),
		)
	}

	await page.setViewportSize({ width: 1400, height: 900 })
	await page.waitForFunction(() => document.querySelector('.xw-root').classList.contains('xw-wide'))

	await page.click('.xw-stage-mount >> role=button')
	await page.waitForTimeout(300)
	check('interaction updates state', (await text('.xw-stage-mount')) === 'Demo: 1 (+1)')

	// Control commit on blur: fill then blur by clicking the stage.
	await page.fill('.xw-field input[aria-label="step"]', '5')
	await page.click('.xw-stage-mount >> role=button')
	await page.waitForTimeout(300)
	check('control edit applies to props', (await text('.xw-stage-mount')) === 'Demo: 6 (+5)')

	await page.click('.xw-reset')
	await page.waitForTimeout(500)
	check('reset restores defaults', (await text('.xw-stage-mount')) === 'Demo: 0 (+1)')

	await page.setViewportSize({ width: 800, height: 900 })
	await page.waitForTimeout(400)
	check(
		'compact keeps mounted stage',
		(await page.getAttribute('.xw-root', 'class'))?.includes('xw-compact') &&
			(await text('.xw-stage-mount')) === 'Demo: 0 (+1)',
	)

	await page.setViewportSize({ width: 390, height: 844 })
	await page.waitForTimeout(400)
	const phoneStageKept = (await text('.xw-stage-mount')) === 'Demo: 0 (+1)'
	await page.click('.xw-statusbar >> text=Stories')
	await page.waitForSelector('.xw-overlay', { timeout: 3_000 })
	await page.keyboard.press('Escape')
	await page.waitForTimeout(300)
	check(
		'phone: overlay opens, Esc closes, stage kept',
		(await page.getAttribute('.xw-root', 'class'))?.includes('xw-phone') &&
			(await page.$('.xw-overlay')) === null &&
			phoneStageKept,
	)

	await page.setViewportSize({ width: 1400, height: 900 })
	await page.waitForTimeout(300)
	await page.click('text=Stage only')
	await page.waitForSelector('.xw-stageonly', { timeout: 3_000 })
	await page.click('.xw-stageonly-bar >> text=Workshop')
	await page.waitForTimeout(300)
	check(
		'stage-only round-trip',
		!(await page.getAttribute('.xw-root', 'class'))?.includes('stageonly'),
	)

	await page.click('.xw-story >> text=Broken story')
	await page.waitForTimeout(1_000)
	check(
		'render failure surfaces readable error',
		(await text('.xw-stage-area'))?.includes('render failed'),
	)

	await page.click('.xw-story >> text=Fixture failure')
	await page.waitForTimeout(1_000)
	check(
		'fixture failure surfaces readable error',
		(await text('.xw-stage-area'))?.includes('fixture'),
	)

	await page.click('.xw-story >> text=Basic')
	await page.waitForTimeout(600)
	check('recovers after failure', (await text('.xw-stage-mount')) === 'Demo: 0 (+1)')

	await page.click('.xw-story >> text=Isolation and overlay')
	await page.waitForSelector('[data-isolation-value]')
	check(
		'provider receives fixture',
		(await text('[data-isolation-value]')) === 'default / fixture / account / 0',
	)

	await page.click('text=Open owned overlay')
	await page.waitForSelector('[aria-label="Story account overlay"]')
	await page.click('text=Mutate data')
	await page.waitForFunction(() =>
		document
			.querySelector('[data-isolation-value]')
			?.textContent?.includes('changed / changed / 1'),
	)

	check(
		'secondary root carries provider store',
		(await text('[aria-label="Story account overlay"]')) === 'changed',
	)

	await page.click('.xw-unset')
	await page.waitForFunction(() =>
		document.querySelector('[data-isolation-value]')?.textContent?.startsWith('unset'),
	)

	check(
		'Unset removes optional value without resetting state or providers',
		(await text('[data-isolation-value]')) === 'unset / changed / changed / 1' &&
			(await page.evaluate(
				() => !('label' in globalThis.__xplatWorkshopRuntime.session.currentProps),
			)),
	)

	await page.click('.xw-reset')
	await page.waitForFunction(
		() =>
			document.querySelector('[data-isolation-value]')?.textContent ===
			'default / fixture / account / 0',
	)

	check(
		'reset restores nested fixture and local state and releases secondary root',
		(await page.locator('[aria-label="Story account overlay"]').count()) === 0,
	)

	await page.click('text=Open owned overlay')
	await page.click('.xw-story >> text=Basic')
	await page.waitForFunction(() => !document.querySelector('[aria-label="Story account overlay"]'))
	check(
		'switch releases owned overlay',
		(await page.locator('[aria-label="Story account overlay"]').count()) === 0,
	)

	await page.fill('input[aria-label="step"]', '99')
	await page.keyboard.press('Tab')
	await page.waitForSelector('.xw-field-error')
	check('invalid number preserves stage value', (await text('.xw-stage-mount')) === 'Demo: 0 (+1)')
	await page.fill('input[aria-label="step"]', '1')
	await page.keyboard.press('Tab')
	await page.fill('input[aria-label="label"]', 'composing')
	await page.locator('input[aria-label="label"]').evaluate((el) => {
		el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
		el.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true }),
		)
	})

	check(
		'composition Enter does not apply draft',
		(await text('.xw-stage-mount')) === 'Demo: 0 (+1)',
	)

	await page.locator('input[aria-label="label"]').evaluate((el) => {
		el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }))
	})

	await page.keyboard.press('Enter')
	await page.waitForFunction(() =>
		document.querySelector('.xw-stage-mount')?.textContent?.includes('composing'),
	)

	check(
		'composition completion applies explicit Enter',
		(await text('.xw-stage-mount')) === 'composing: 0 (+1)',
	)

	await page.selectOption('[aria-label="Stage background"]', 'dark')
	await page.selectOption('[aria-label="Stage bounds"]', 'small')
	check(
		'stage environment preserves mounted session',
		(await text('.xw-stage-mount')) === 'composing: 0 (+1)' &&
			(await page
				.locator('.xw-stage-slot')
				.evaluate(
					(el) => el.style.width === '320px' && el.classList.contains('xw-background-dark'),
				)),
	)

	await page.selectOption('[aria-label="Stage bounds"]', 'available')
	await page.selectOption('[aria-label="Stage background"]', 'default')
	await page.getByLabel('Workshop targets').click()
	check(
		'six target statuses remain explicit',
		(await page.locator('.xw-target-menu li').count()) === 6 &&
			(await text('.xw-target-menu'))?.includes('unqualified backend'),
	)

	await page.getByLabel('Workshop targets').click()
	await page.click('.xw-story >> text=Editable inputs')
	await page.waitForSelector('[data-input-state]')
	await page.getByRole('checkbox', { name: 'Example toggle' }).check()
	await page.getByRole('textbox', { name: 'Example text', exact: true }).fill('edited')
	await page.waitForFunction(
		() => document.querySelector('[data-input-state]')?.textContent === 'on: edited',
	)

	check('real stage toggle and text input', (await text('[data-input-state]')) === 'on: edited')
	await page.getByRole('checkbox', { name: 'disabled', exact: true }).check()
	check(
		'boolean control preserves component local state',
		(await text('[data-input-state]')) === 'on: edited' &&
			(await page.getByRole('textbox', { name: 'Example text', exact: true }).isDisabled()),
	)

	await page.click('.xw-reset')
	await page.waitForFunction(
		() => document.querySelector('[data-input-state]')?.textContent === 'off: initial',
	)

	check(
		'reset restores toggle and text defaults',
		!(await page.getByRole('textbox', { name: 'Example text', exact: true }).isDisabled()),
	)

	await page.setViewportSize({ width: 1400, height: 300 })
	await page.waitForSelector('.xw-compact')
	check(
		'short wide window collapses chrome without resetting stage',
		(await text('[data-input-state]')) === 'off: initial',
	)

	await page.setViewportSize({ width: 390, height: 844 })
	await page.waitForSelector('.xw-phone')
	const opener = page.locator('.xw-statusbar').getByRole('button', { name: 'Stories', exact: true })
	await opener.focus()
	await page.keyboard.press('Enter')
	await page.waitForSelector('.xw-overlay')
	await page.waitForFunction(() => document.activeElement?.classList.contains('xw-search'))
	check(
		'keyboard opens picker and moves focus to search',
		await page.locator('.xw-search').evaluate((el) => el === document.activeElement),
	)

	await page.keyboard.press('Escape')
	await page.waitForFunction(() => !document.querySelector('.xw-overlay'))
	await page.waitForFunction(
		() => document.activeElement?.getAttribute('data-workshop-opener') === 'stories',
	)

	check(
		'Escape restores opener focus',
		await opener.evaluate((el) => el === document.activeElement),
	)

	const ax = await page.locator('.xw-statusbar').ariaSnapshot()
	check(
		'accessible shell exposes named reset and status',
		ax.includes('button "Reset"') && ax.includes('ready'),
	)

	check('no page errors', pageErrors.length === 0, pageErrors[0])

	const failures = results.filter(([, ok]) => !ok)
	console.log(`${results.length - failures.length}/${results.length} checks passed`)
	process.exitCode = failures.length ? 1 : 0
} finally {
	await browser.close()
	server?.kill('SIGTERM')
}
