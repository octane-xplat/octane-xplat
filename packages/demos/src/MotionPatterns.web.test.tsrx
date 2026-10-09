// @vitest-environment jsdom
import { act, createRoot } from 'octane'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MotionPatterns } from './MotionPatterns'

// Motion patterns showcase — first-slice regression checks on the web
// (jsdom) renderer. Fake timers drive the motion clock (rAF) and the
// TextLoop dwell interval; a matchMedia stub owns the system preference so
// the preview-only path stays honest.

let systemReduced = false
const mediaListeners = new Set<() => void>()

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
})

afterEach(() => {
	vi.useRealTimers()
	vi.unstubAllGlobals()
	mediaListeners.clear()
	document.body.innerHTML = ''
})

function mount() {
	const container = document.createElement('div')
	document.body.append(container)
	const root = createRoot(container)
	act(() => root.render(<MotionPatterns />))
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

const items = (container: HTMLElement) =>
	[...container.querySelectorAll('.mp-activity-item')].map((e) => e.textContent)

describe('MotionPatterns showcase', () => {
	it('renders the dashboard readable before effects finish', async () => {
		const { container, close } = mount()
		expect(container.textContent).toContain('Activity overview')
		expect(container.querySelector('#mp-total')?.textContent).toBe('1,284')
		expect(items(container).length).toBe(3)
		expect(container.querySelector('#mp-phrase')?.textContent).toBe('Review today')
		for (const key of ['panels', 'group', 'number', 'loop']) {
			expect(container.querySelector('#mp-index-' + key)).not.toBeNull()
		}

		await advance(600)
		close()
	})

	it('switches ranges wait-style and converges on the latest selection', async () => {
		const { container, close } = mount()
		await advance(400)
		segment(container, 'mp-range', 'Week')
		await advance(60)
		// Rapid re-selection before the exit finishes — Month wins; Week never settles.
		segment(container, 'mp-range', 'Month')
		await advance(800)
		expect(container.textContent).toContain('This month')
		expect(container.textContent).not.toContain('This week')
		expect(container.textContent).toContain('18 runs')
		expect(container.querySelectorAll('.mp-panel').length).toBe(1)
		close()
	})

	it('swaps panels directly under the reduced-motion preview', async () => {
		const { container, close } = mount()
		await advance(400)
		click(container, 'mp-reduce')
		expect(container.querySelector('#mp-reduce-effective')?.textContent).toBe(
			'Reduced (preview)',
		)

		segment(container, 'mp-range', 'Month')
		// No exit wait: the new content is present in the same commit.
		expect(container.textContent).toContain('This month')
		expect(container.textContent).not.toContain('8:04 AM')
		close()
	})

	it('interpolates the total and settles on the exact target', async () => {
		const { container, close } = mount()
		await advance(400)
		const total = container.querySelector('#mp-total') as HTMLElement
		click(container, 'mp-inc')
		// Assistive tech gets the latest meaningful target immediately.
		expect(total.getAttribute('aria-label')).toBe('Total: 1,534')
		await advance(600)
		expect(total.textContent).toBe('1,534')
		// Mid-flight retarget heads to the latest value.
		click(container, 'mp-inc')
		await advance(100)
		click(container, 'mp-dec')
		await advance(600)
		expect(total.textContent).toBe('1,534')
		for (const [id, text] of [
			['mp-sample-0', '0'],
			['mp-sample--120', '-120'],
			['mp-sample-98765', '98,765'],
		] as const) {
			click(container, id)
			await advance(600)
			expect(total.textContent).toBe(text)
		}

		close()
	})

	it('settles the total instantly under reduced motion', async () => {
		const { container, close } = mount()
		await advance(400)
		click(container, 'mp-reduce')
		click(container, 'mp-inc')
		expect(container.querySelector('#mp-total')?.textContent).toBe('1,534')
		close()
	})

	it('replays the group without changing items or order', async () => {
		const { container, close } = mount()
		await advance(600)
		const before = items(container)
		click(container, 'mp-replay')
		await advance(800)
		expect(items(container)).toEqual(before)
		close()
	})

	it('opens a focused view with its own isolated example', async () => {
		const { container, close } = mount()
		await advance(400)
		click(container, 'mp-index-group')
		expect(container.querySelector('#mp-focus-group')).not.toBeNull()
		segment(container, 'fp-group-size', '0 items')
		await advance(200)
		expect(container.querySelector('#fp-group-empty')?.textContent).toBe(
			'No activity in this range',
		)

		segment(container, 'fp-group-size', '1 item')
		await advance(600)
		expect(
			container.querySelectorAll('#mp-focus-group .mp-activity-item').length,
		).toBe(1)

		segment(container, 'fp-group-size', '4 items')
		await advance(800)
		expect(
			container.querySelectorAll('#mp-focus-group .mp-activity-item').length,
		).toBe(4)

		close()
	})

	it('cycles phrases on play, pauses, and steps with next', async () => {
		const { container, close } = mount()
		await advance(400)
		const phrase = () => container.querySelector('#mp-phrase')?.textContent
		expect(phrase()).toBe('Review today')
		click(container, 'mp-loop-toggle')
		expect(container.querySelector('#mp-loop-state')?.textContent).toBe('Playing')
		await advance(3200 + 800)
		expect(phrase()).toBe('Track this week')
		click(container, 'mp-loop-toggle')
		expect(container.querySelector('#mp-loop-state')?.textContent).toBe('Paused')
		const held = phrase()
		await advance(7000)
		expect(phrase()).toBe(held)
		click(container, 'mp-loop-next')
		await advance(600)
		expect(phrase()).toBe('Explore trends')
		close()
	})

	it('disables autonomous cycling and swaps directly under reduced motion', async () => {
		const { container, close } = mount()
		await advance(400)
		click(container, 'mp-reduce')
		// Play is disabled while reduced — autonomous cycling never starts.
		expect(container.querySelector('#mp-loop-toggle')?.getAttribute('aria-disabled')).toBe('true')
		expect(container.querySelector('#mp-loop-state')?.textContent).toBe('Reduced motion — cycling off')
		await advance(10000)
		expect(container.querySelector('#mp-phrase')?.textContent).toBe('Review today')
		// Next still changes the phrase directly.
		click(container, 'mp-loop-next')
		expect(container.querySelector('#mp-phrase')?.textContent).toBe('Track this week')
		close()
	})

	it('pauses cycling when reduced motion turns on mid-play', async () => {
		const { container, close } = mount()
		await advance(400)
		click(container, 'mp-loop-toggle')
		click(container, 'mp-reduce')
		expect(container.querySelector('#mp-loop-state')?.textContent).toBe('Reduced motion — cycling off')
		close()
	})

	it('honors the system preference over the preview and reports it', async () => {
		systemReduced = true
		const { container, close } = mount()
		await advance(400)
		expect(container.querySelector('#mp-reduce-effective')?.textContent).toBe(
			'Reduced (system preference)',
		)

		// Preview off → still reduced; the switch cannot force full motion.
		segment(container, 'mp-range', 'Week')
		expect(container.textContent).toContain('This week')
		close()
	})

	it('shows and recovers the empty-range state in the focused view', async () => {
		const { container, close } = mount()
		await advance(400)
		click(container, 'mp-index-panels')
		await advance(400)
		click(container, 'fp-empty')
		expect(container.querySelector('#fp-panels-empty')?.textContent).toBe(
			'No activity in this range',
		)

		segment(container, 'fp-range', 'Month')
		await advance(600)
		expect(container.querySelector('#fp-panels-empty')?.textContent).toBe(
			'No activity in this range',
		)

		click(container, 'fp-empty')
		await advance(600)
		expect(container.textContent).toContain('18 runs')
		close()
	})
})
