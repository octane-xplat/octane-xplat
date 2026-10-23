/** Scripted behavior probes — the identical sequence runs against each
 *  side's /button/behavior route and observations are diffed pairwise. */

import { chromium, type Browser, type Page } from 'playwright'

declare global {
	interface Window {
		__parity: { events: string[]; resolve(): void }
	}
}

export type BehaviorDiff = {
	probe: string
	step: string
	reference: unknown
	candidate: unknown
}

type Observation = {
	probe: string
	step: string
	value: unknown
}

const CONTEXT_OPTIONS = {
	viewport: { width: 1024, height: 600 },
	deviceScaleFactor: 1,
	colorScheme: 'light',
	reducedMotion: 'reduce',
	locale: 'en-US',
	timezoneId: 'UTC',
} as const

const CONTROL = 'button, [role="button"], [tabindex]'
const ASYNC_CONTROL = '[data-parity-key="async"] button, [data-parity-key="async"] [role="button"]'

/** Two rAFs so a just-dispatched state change commits before observation. */
async function settle(page: Page) {
	await page.evaluate(
		() =>
			new Promise<void>((resolve) => {
				requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
			}),
	)
}

/** Wait for the event log to grow past `previousCount`; a timed-out wait is a
 *  valid observation (e.g. a disabled control that must not fire). */
async function waitForEvents(page: Page, previousCount: number, timeoutMs = 1000) {
	try {
		await page.waitForFunction((n) => window.__parity.events.length > n, previousCount, {
			timeout: timeoutMs,
		})
	} catch {
		// No event arrived within the bound — record whatever is there.
	}

	await settle(page)
}

async function events(page: Page) {
	return page.evaluate(() => [...window.__parity.events])
}

async function activeKey(page: Page) {
	return page.evaluate(() => {
		const el = document.activeElement?.closest('[data-parity-key]')
		return el?.getAttribute('data-parity-key') ?? null
	})
}

async function controlState(page: Page, key: string) {
	const control = page.locator(`[data-parity-key="${key}"]`).locator(CONTROL).first()

	return {
		ariaBusy: await control.getAttribute('aria-busy'),
		disabled: await control.evaluate((el) => (el as HTMLButtonElement).disabled ?? null),
		ariaDisabled: await control.getAttribute('aria-disabled'),
	}
}

async function runSide(browser: Browser, baseUrl: string): Promise<Observation[]> {
	const context = await browser.newContext(CONTEXT_OPTIONS)
	const page = await context.newPage()
	const url = `${baseUrl}/button/behavior`
	const out: Observation[] = []
	const record = (probe: string, step: string, value: unknown) => {
		out.push({ probe, step, value })
	}

	try {
		// Focus order: before → Tab ×4, recording the owning parity key.
		await page.goto(url)
		await page.locator('[data-parity-key="before"]').focus()

		for (let i = 1; i <= 4; i++) {
			await page.keyboard.press('Tab')
			await settle(page)
			record('focusOrder', `tab-${i}`, await activeKey(page))
		}

		// Keyboard activation — one key per probe so Enter's transition cannot
		// dedupe a following Space on the reference side.
		await page.goto(url)
		await page.locator('[data-parity-key="sync"]').locator(CONTROL).first().focus()
		let count = (await events(page)).length
		await page.keyboard.press('Enter')
		await waitForEvents(page, count)
		record('keyboard', 'enter', await events(page))

		await page.goto(url)
		await page.locator('[data-parity-key="sync"]').locator(CONTROL).first().focus()
		count = (await events(page)).length
		await page.keyboard.press('Space')
		await waitForEvents(page, count)
		record('keyboard', 'space', await events(page))

		// Pointer: click sync; force-click the disabled control.
		await page.goto(url)
		count = (await events(page)).length
		await page.locator('[data-parity-key="sync"]').locator(CONTROL).first().click()
		await waitForEvents(page, count)
		record('pointer', 'click-sync', await events(page))
		count = (await events(page)).length
		await page.locator('[data-parity-key="disabled"]').locator(CONTROL).first().click({ force: true })
		await waitForEvents(page, count)
		record('pointer', 'click-disabled', await events(page))

		// Pending: click async, observe pending state, blocked re-click,
		// resolve, then a post-resolve click.
		await page.goto(url)
		const asyncControl = page.locator(ASYNC_CONTROL).first()
		count = (await events(page)).length
		await asyncControl.click()
		await waitForEvents(page, count)
		record('pending', 'after-first-click', {
			events: await events(page),
			...(await controlState(page, 'async')),
			wrapper: await page.locator('[data-parity-key="async"]').ariaSnapshot(),
		})
		count = (await events(page)).length
		await asyncControl.click({ force: true })
		await waitForEvents(page, count)
		record('pending', 'second-click-events', await events(page))
		await page.evaluate(() => window.__parity.resolve())
		// Bounded wait for pending affordances to clear, then settle — reading
		// synchronously after 'async:end' races the renderer's commit.
		try {
			await page.waitForFunction(
				(sel) => {
					const el = document.querySelector(sel)
					return el != null && !el.matches('[aria-busy="true"], :disabled')
				},
				ASYNC_CONTROL,
				{ timeout: 1000 },
			)
		} catch {
			// Control never cleared its pending affordances — a valid observation.
		}

		await settle(page)
		record('pending', 'after-resolve', {
			events: await events(page),
			...(await controlState(page, 'async')),
		})
		count = (await events(page)).length
		await asyncControl.click()
		await waitForEvents(page, count)
		record('pending', 'post-resolve-click-events', await events(page))

		// ARIA snapshots at rest.
		await page.goto(url)

		for (const key of ['sync', 'disabled', 'async']) {
			record('aria', key, await page.locator(`[data-parity-key="${key}"]`).ariaSnapshot())
		}
	} finally {
		await context.close()
	}

	return out
}

export async function runBehaviorProbes(referenceUrl: string, candidateUrl: string) {
	const browser = await chromium.launch()

	try {
		const reference = await runSide(browser, referenceUrl)
		const candidate = await runSide(browser, candidateUrl)
		const referenceIndex = new Map<string, unknown>(
			reference.map((o) => [`${o.probe}/${o.step}`, o.value] as const),
		)
		const candidateIndex = new Map<string, unknown>(
			candidate.map((o) => [`${o.probe}/${o.step}`, o.value] as const),
		)
		const diffs: BehaviorDiff[] = []

		for (const { probe, step, value } of reference) {
			const key = `${probe}/${step}`
			const other = candidateIndex.get(key)
			candidateIndex.delete(key)

			if (JSON.stringify(value) !== JSON.stringify(other)) {
				diffs.push({ probe, step, reference: value, candidate: other })
			}
		}

		for (const [key, value] of candidateIndex) {
			const slash = key.indexOf('/')
			diffs.push({
				probe: key.slice(0, slash),
				step: key.slice(slash + 1),
				reference: referenceIndex.get(key),
				candidate: value,
			})
		}

		return { reference, candidate, diffs }
	} finally {
		await browser.close()
	}
}
