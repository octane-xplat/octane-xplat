/** Markdown browser probes — DOM/ARIA/geometry only, never screenshots.
 *  Same probe sequence runs against each side and observations diff pairwise. */

import type { Browser, Page } from 'playwright'

declare global {
	interface Window {
		__parity: { events: string[]; resolve(): void }
	}
}

export type Observation = { step: string; value: unknown }

const CONTEXT_OPTIONS = {
	viewport: { width: 1024, height: 800 },
	deviceScaleFactor: 1,
	colorScheme: 'light',
	reducedMotion: 'reduce',
	locale: 'en-US',
	timezoneId: 'UTC',
} as const

async function settle(page: Page) {
	await page.evaluate(
		() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
	)
}

/** Wait until a locator's textContent stops changing (stream smoothing drain). */
async function waitStable(page: Page, sel: string, idleMs = 300, timeoutMs = 8000) {
	const start = Date.now()
	let last = ''
	for (;;) {
		const cur = (await page.locator(sel).textContent().catch(() => '')) ?? ''
		if (cur === last && Date.now() - start > idleMs) return cur
		if (Date.now() - start > timeoutMs) return cur
		last = cur
		await page.waitForTimeout(60)
	}
}

/** DOM/event parity probes on /markdown/behavior. */
export async function markdownBehaviorProbes(browser: Browser, baseUrl: string) {
	const context = await browser.newContext(CONTEXT_OPTIONS)
	const page = await context.newPage()
	const out: Observation[] = []
	const record = (step: string, value: unknown) => out.push({ step, value })

	try {
		await page.goto(`${baseUrl}/markdown/behavior`)
		await settle(page)

		// DOM semantics per fixture.
		for (const key of [
			'links',
			'unsafe-link',
			'citation',
			'heading-id',
			'inline-display',
			'task-list',
		]) {
			const sel = `[data-parity-key="${key}"]`
			if ((await page.locator(sel).count()) === 0) {
				record(`${key}/missing`, true)
				continue
			}
			record(`${key}/snapshot`, await page.locator(sel).ariaSnapshot())
			record(
				`${key}/dom`,
				await page.locator(sel).evaluate((el) => {
					const links = [...el.querySelectorAll('a')].map((a) => ({
						href: a.getAttribute('href'),
						target: a.getAttribute('target'),
						rel: a.getAttribute('rel'),
					}))
					const headings = [...el.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')].map(
						(h) => ({ tag: h.tagName, id: h.id, level: h.getAttribute('aria-level') }),
					)
					return {
						text: el.textContent,
						links,
						headings,
						checkboxes: el.querySelectorAll('input[type="checkbox"],[role="checkbox"]').length,
					}
				}),
			)
		}

		// Link interception: click the cancel fixture, then the allow fixture.
		for (const key of ['link-cancel', 'link-allow']) {
			const sel = `[data-parity-key="${key}"] a, [data-parity-key="${key}"] [role="link"]`
			const count = (await page.evaluate(() => window.__parity.events.length)) as number
			if ((await page.locator(sel).count()) > 0) {
				await page.locator(sel).first().click()
				await settle(page)
			}
			record(`${key}/events`, await page.evaluate(() => [...window.__parity.events]))
			void count
		}

		// DOM probes on the extended fixtures.
		for (const key of [
			'citation-activate',
			'heading-shift',
			'empty-repeated-headings',
			'image-ok',
			'image-fail',
			'custom-renderers',
			'plugin-error',
			'plugin-decline',
		]) {
			const sel = `[data-parity-key="${key}"]`
			if ((await page.locator(sel).count()) === 0) {
				record(`${key}/missing`, true)
				continue
			}
			record(
				`${key}/dom`,
				await page.locator(sel).evaluate((el) => {
					const img = el.querySelector('img')
					return {
						text: el.textContent,
						headings: [...el.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')].map((h) => ({
							tag: h.tagName,
							id: h.id,
							level: h.getAttribute('aria-level'),
						})),
						links: [...el.querySelectorAll('a')].map((a) => a.getAttribute('href')),
						customs: [...el.querySelectorAll('[data-custom]')].map((n) => n.getAttribute('data-custom')),
						img: img
							? { alt: img.getAttribute('alt'), complete: img.complete, w: img.naturalWidth }
							: null,
						citeLinks: [...el.querySelectorAll('a[href^="#cite"]')].map((a) => a.getAttribute('href')),
					}
				}),
			)
		}

		// Citation activation: hash navigation stays on-page.
		const citeSel = `[data-parity-key="citation-activate"] a[href^="#cite"]`
		if ((await page.locator(citeSel).count()) > 0) {
			await page.locator(citeSel).first().click()
			await settle(page)
			record('citation-activate/hash', await page.evaluate(() => window.location.hash))
		} else {
			record('citation-activate/hash', null)
		}

		// Source/document changes through component state.
		await page.locator('[data-parity-action="source-swap"] button, [data-parity-action="source-swap"]').first().click()
		await settle(page)
		record(
			'source-swap/text',
			await page.locator('[data-parity-key="source-swap"]').textContent(),
		)
		await page.locator('[data-parity-action="source-id-change"] button, [data-parity-action="source-id-change"]').first().click()
		await settle(page)
		record(
			'source-id-change/dom',
			await page.locator('[data-parity-key="source-id-change"]').evaluate((el) => ({
				text: el.textContent,
				cites: el.querySelectorAll('a[href^="#cite"]').length,
			})),
		)

		// Streaming pump: append each chunk, wait for the smoothing drain, then
		// record final text + fade spans + their computed transition duration
		// (reduced motion is set on the context → duration collapses to 0s).
		for (let i = 0; i < 4; i++) {
			await page.locator('[data-parity-action="stream-pump/next"] button, [data-parity-action="stream-pump/next"]').first().click()
		}
		await waitStable(page, '[data-parity-key="stream-pump"]')
		record(
			'stream-pump/drained',
			await page.locator('[data-parity-key="stream-pump"]').evaluate((el) => {
				const fade = el.querySelector('[class*="fade"]')
				return {
					text: el.textContent,
					fadeSpans: el.querySelectorAll('[class*="fade"]').length,
					fadeDuration: fade ? getComputedStyle(fade).transitionDuration : null,
				}
			}),
		)

		// Reset mid-stream, then a different document parses clean.
		await page.locator('[data-parity-action="stream-pump/next"] button, [data-parity-action="stream-pump/next"]').first().click()
		await page.locator('[data-parity-action="stream-pump/reset"] button, [data-parity-action="stream-pump/reset"]').first().click()
		await page.locator('[data-parity-action="stream-pump/next"] button, [data-parity-action="stream-pump/next"]').first().click()
		await waitStable(page, '[data-parity-key="stream-pump"]')
		record(
			'stream-pump/after-reset',
			await page.locator('[data-parity-key="stream-pump"]').textContent(),
		)

		// Unmount mid-stream (navigation away), remount, re-pump to the end.
		await page.locator('[data-parity-action="stream-pump/mount"] button, [data-parity-action="stream-pump/mount"]').first().click()
		await settle(page)
		record(
			'stream-pump/unmounted',
			await page.locator('[data-parity-key="stream-pump"]').textContent(),
		)
		await page.locator('[data-parity-action="stream-pump/mount"] button, [data-parity-action="stream-pump/mount"]').first().click()
		for (let i = 0; i < 4; i++) {
			await page.locator('[data-parity-action="stream-pump/next"] button, [data-parity-action="stream-pump/next"]').first().click()
		}
		await waitStable(page, '[data-parity-key="stream-pump"]')
		record(
			'stream-pump/remounted',
			await page.locator('[data-parity-key="stream-pump"]').textContent(),
		)

		// Two simultaneous streams: pump A fully, B once — outputs stay
		// independent.
		for (let i = 0; i < 4; i++) {
			await page.locator('[data-parity-action="stream-a/next"] button, [data-parity-action="stream-a/next"]').first().click()
		}
		await page.locator('[data-parity-action="stream-b/next"] button, [data-parity-action="stream-b/next"]').first().click()
		await waitStable(page, '[data-parity-key="stream-a"]')
		await waitStable(page, '[data-parity-key="stream-b"]')
		record(
			'stream-multi',
			await Promise.all([
				page.locator('[data-parity-key="stream-a"]').textContent(),
				page.locator('[data-parity-key="stream-b"]').textContent(),
			]),
		)
	} finally {
		await context.close()
	}
	return out
}

/** Geometry probes on /markdown/layout — bounding boxes, computed spacing,
 *  overflow, and content-width behavior per keyed scenario cell. */
export async function markdownLayoutProbes(browser: Browser, baseUrl: string) {
	const context = await browser.newContext(CONTEXT_OPTIONS)
	const page = await context.newPage()
	const out: Observation[] = []

	try {
		await page.goto(`${baseUrl}/markdown/layout`)
		await settle(page)

		for (const cell of await page.locator('[data-parity-key]').all()) {
			const key = await cell.getAttribute('data-parity-key')
			out.push({
				step: key!,
				value: await cell.evaluate((el) => {
					const blocks = [...el.children].map((child) => {
						const r = (child as HTMLElement).getBoundingClientRect()
						const cs = getComputedStyle(child as HTMLElement)
						return {
							tag: child.tagName,
							h: Math.round(r.height * 100) / 100,
							w: Math.round(r.width * 100) / 100,
							mt: cs.marginTop,
							mb: cs.marginBottom,
							fs: cs.fontSize,
						}
					})
					const table = el.querySelector('table')
					const scroller = el.querySelector('[class*="scroll" i], [data-scroll]')
					return {
						cellWidth: (el as HTMLElement).getBoundingClientRect().width,
						blocks,
						tableScrollWidth: table?.scrollWidth ?? null,
						tableClientWidth: (table?.closest('[class]') as HTMLElement | null)?.clientWidth ?? null,
						scrollerOverflow: scroller
							? (scroller as HTMLElement).scrollWidth - (scroller as HTMLElement).clientWidth
							: null,
					}
				}),
			})
		}
	} finally {
		await context.close()
	}
	return out
}
