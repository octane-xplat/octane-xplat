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
