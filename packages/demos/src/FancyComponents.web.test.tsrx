// @vitest-environment jsdom
import { act, createRoot } from 'octane'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FancyComponents } from './FancyComponents'

// Fancy components showcase — first-slice regression checks on the web
// (jsdom) renderer. Fake timers drive the motion clock (rAF) and the
// typewriter/scramble/caret intervals; a matchMedia stub owns the system
// preference so the preview-only path stays honest. The marquee segment is
// measured through useMeasure — getBoundingClientRect is stubbed to a fixed
// segment width so the loop can start under jsdom's layout-free DOM.

let systemReduced = false
const mediaListeners = new Set<() => void>()

const SEGMENT_WIDTH = 240
const realRect = HTMLElement.prototype.getBoundingClientRect

beforeEach(() => {
	vi.useFakeTimers()
	systemReduced = false
	vi.stubGlobal('matchMedia', (query: string) => ({
		get matches() {
			return systemReduced
		},
		addEventListener: (_type: string, cb: () => void) => mediaListeners.add(cb),
		removeEventListener: (_type: string, cb: () => void) => mediaListeners.delete(cb),
	}))

	HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
		if (this.classList?.contains('fc-marquee-segment')) {
			return {
				...realRect.call(this),
				width: SEGMENT_WIDTH,
				right: SEGMENT_WIDTH,
			}
		}

		return realRect.call(this)
	}

})

afterEach(() => {
	vi.useRealTimers()
	vi.unstubAllGlobals()
	mediaListeners.clear()
	HTMLElement.prototype.getBoundingClientRect = realRect
	document.body.innerHTML = ''
})

function mount() {
	const container = document.createElement('div')
	document.body.append(container)
	const root = createRoot(container)
	act(() => root.render(<FancyComponents />))
	return {
		container,
		close() {
			act(() => root.unmount())
			container.remove()
		},
	}
}

const advance = async (ms: number) => {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(ms)
	})
}

const click = (container: HTMLElement, id: string) => {
	const el = container.querySelector<HTMLElement>('#' + id)
	if (!el) throw new Error('missing #' + id)
	act(() => el.click())
}

const segment = (container: HTMLElement, controlId: string, label: string) => {
	const el = [...container.querySelectorAll<HTMLElement>('#' + controlId + ' .vx-segment')].find(
		(e) => e.textContent === label,
	)

	if (!el) throw new Error('missing segment ' + label)
	act(() => el.click())
}

const text = (container: HTMLElement, id: string) =>
	container.querySelector('#' + id)?.textContent ?? ''

const trackX = (container: HTMLElement) => {
	const transform =
		container.querySelector<HTMLElement>('.fc-marquee-track')?.style.transform ?? ''

	const match = /translateX\((-?[\d.]+)px\)/.exec(transform)

	return match ? Number(match[1]) : null
}

describe('FancyComponents showcase', () => {
	it('renders all four effects readable before effects finish', async () => {
		const { container, close } = mount()
		expect(container.textContent).toContain('Fancy components')
		expect(container.querySelectorAll('.fc-marquee-segment').length).toBe(4)
		expect(container.querySelector('#fc-marquee-state')?.textContent).toBe('Playing')
		expect(container.querySelector('#fc-typewriter')).not.toBeNull()
		expect(container.querySelector('#fc-ticker')?.textContent).toBe('0')
		for (const id of ['fc-marquee-toggle', 'fc-type-replay', 'fc-scramble-replay', 'fc-ticker-replay']) {
			expect(container.querySelector('#' + id)).not.toBeNull()
		}

		await advance(600)
		close()
	})

	it('loops the marquee, pauses without jumping, and flips direction', async () => {
		const { container, close } = mount()
		// Segment width 240 at 60 px/s → 4s per leg.
		await advance(1000)
		const first = trackX(container)
		expect(first).not.toBeNull()
		expect(first!).toBeLessThan(-30)
		expect(first!).toBeGreaterThan(-100)

		click(container, 'fc-marquee-toggle')
		expect(text(container, 'fc-marquee-state')).toBe('Paused')
		const held = trackX(container)
		await advance(2000)
		expect(trackX(container)).toBe(held)

		click(container, 'fc-marquee-toggle')
		await advance(600)
		expect(trackX(container)).toBeLessThan(held!)

		// Direction flip keeps the loop phase — travel reverses in place.
		segment(container, 'fc-marquee-dir', 'Right')
		const flipped = trackX(container)
		await advance(600)
		expect(trackX(container)).toBeGreaterThan(flipped!)
		close()
	})

	it('renders duplicate marquee copies hidden from assistive tech', async () => {
		const { container, close } = mount()
		const segments = [...container.querySelectorAll<HTMLElement>('.fc-marquee-segment')]
		expect(segments.length).toBe(4)
		expect(segments[0].getAttribute('aria-hidden')).toBeNull()
		for (const copy of segments.slice(1)) {
			expect(copy.getAttribute('aria-hidden')).toBe('true')
		}

		close()
	})

	it('types, dwells, deletes, and advances the typewriter phrases', async () => {
		const { container, close } = mount()
		const shown = () => container.querySelector('.fc-typewriter-text')?.textContent ?? ''
		const first = 'Type once, run everywhere.'

		await advance(9 * 45)
		expect(shown().length).toBeGreaterThan(0)
		expect(shown().length).toBeLessThan(first.length)
		expect(first.startsWith(shown())).toBe(true)

		await advance(first.length * 45)
		expect(shown()).toBe(first)

		// Dwell (2400ms) + full delete (26 × 25ms) + dwell → next phrase types.
		await advance(2400 + first.length * 25 + 2400 + 10 * 45)
		const next = 'Same markup on web and phones.'
		expect(shown().length).toBeGreaterThan(0)
		expect(next.startsWith(shown())).toBe(true)
		close()
	})

	it('restarts the typewriter from the first phrase on replay', async () => {
		const { container, close } = mount()
		await advance(2400 + 30 * 45 + 2400)
		click(container, 'fc-type-replay')
		expect(container.querySelector('.fc-typewriter-text')?.textContent).toBe('')
		await advance(8 * 45)
		expect('Type once, run everywhere.'.startsWith(
			container.querySelector('.fc-typewriter-text')?.textContent ?? '',
		)).toBe(true)

		close()
	})

	it('reveals the scramble left to right and settles on the real text', async () => {
		const { container, close } = mount()
		const full = 'Fancy components, ported'
		const shown = () => text(container, 'fc-scramble')

		expect(shown().length).toBeLessThanOrEqual(3)
		await advance(10 * 40)
		// Ten real glyphs revealed plus the trailing noise window.
		const mid = shown()
		expect(mid.length).toBe(13)
		expect(mid.slice(0, 10)).toBe(full.slice(0, 10))

		await advance((full.length + 3) * 40)
		expect(shown()).toBe(full)
		expect(text(container, 'fc-scramble-state')).toBe('Settled')
		close()
	})

	it('replays the scramble and reports scrambling again', async () => {
		const { container, close } = mount()
		await advance((24 + 3) * 40)
		expect(text(container, 'fc-scramble-state')).toBe('Settled')
		click(container, 'fc-scramble-replay')
		expect(text(container, 'fc-scramble-state')).toBe('Scrambling')
		await advance((24 + 3) * 40)
		expect(text(container, 'fc-scramble')).toBe('Fancy components, ported')
		close()
	})

	it('counts the ticker to the exact target and reports done', async () => {
		const { container, close } = mount()
		expect(text(container, 'fc-ticker')).toBe('0')
		await advance(500)
		const mid = Number(text(container, 'fc-ticker').replace(/,/g, ''))
		expect(mid).toBeGreaterThan(0)
		expect(mid).toBeLessThan(12847)
		await advance(1300)
		expect(text(container, 'fc-ticker')).toBe('12,847')
		expect(text(container, 'fc-ticker-state')).toBe('Done')
		// The settled value is the announced one.
		expect(container.querySelector('#fc-ticker')?.getAttribute('aria-label')).toBe(
			'Count: 12,847',
		)

		close()
	})

	it('settles everything directly under the reduced-motion preview', async () => {
		const { container, close } = mount()
		await advance(400)
		click(container, 'fc-reduce')
		expect(text(container, 'fc-reduce-effective')).toBe('Reduced (preview)')

		expect(text(container, 'fc-marquee-state')).toBe('Static (reduced motion)')
		expect(trackX(container)).toBe(0)
		expect(container.querySelector('.fc-typewriter-text')?.textContent).toBe(
			'Type once, run everywhere.',
		)

		expect(text(container, 'fc-scramble')).toBe('Fancy components, ported')
		expect(text(container, 'fc-scramble-state')).toBe('Settled')
		expect(text(container, 'fc-ticker')).toBe('12,847')
		expect(text(container, 'fc-ticker-state')).toBe('Done')
		close()
	})

	it('honors the system preference over the preview', async () => {
		systemReduced = true
		const { container, close } = mount()
		await advance(400)
		expect(text(container, 'fc-reduce-effective')).toBe('Reduced (system preference)')
		expect(text(container, 'fc-marquee-state')).toBe('Static (reduced motion)')
		expect(text(container, 'fc-ticker')).toBe('12,847')
		close()
	})
})
