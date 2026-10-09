// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { RollingText } from './RollingText.web.tsrx'

// jsdom has no layout — getBoundingClientRect returns 0 — so the roll
// distance is stubbed and the y-channel writes become observable.

function mount(extra: any = {}) {
	const el = document.createElement('div')
	document.body.appendChild(el)
	const root = createRoot(el)
	act(() => root.render(<RollingText value="9" {...extra} />))
	return { el, root }
}

function cells(el: HTMLElement): HTMLElement[] {
	return [...el.querySelectorAll('.vx-rolling-text > span[aria-hidden] > span')] as HTMLElement[]
}

function texts(el: HTMLElement) {
	return cells(el).map((cell) => cell.textContent)
}

function commit(el: HTMLElement) {
	return texts(el).join('')
}

function semantic(el: HTMLElement) {
	return el.querySelector('.vx-rolling-text-value')?.textContent
}

describe('RollingText (web leaf)', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
			height: 20,
			width: 10,
			x: 0,
			y: 0,
			top: 0,
			left: 0,
			bottom: 20,
			right: 10,
			toJSON: () => ({}),
		} as DOMRect)
	})

	afterEach(() => {
		vi.restoreAllMocks()
		vi.useRealTimers()
	})

	it('mounts settled: one cell per grapheme, one semantic value', () => {
		const { el, root } = mount({ value: '9 seconds' })
		expect(texts(el).join('')).toBe('9 seconds')
		expect(el.querySelectorAll('[aria-hidden]')).toHaveLength(1)
		expect(semantic(el)).toBe('9 seconds')
		root.unmount()
		el.remove()
	})

	it('rolls only the changed cells; survivors keep their elements', () => {
		const { el, root } = mount({ value: '9 seconds' })
		const before = cells(el)
		act(() => root.render(<RollingText value="10 seconds" />))
		// During the roll: ghost '9' + entering '1','0' + survivors.
		expect(texts(el).join('')).toBe('910 seconds')
		const after = cells(el)
		expect(after[3]).toBe(before[1]) // ' ' survives identity
		expect(after[4]).toBe(before[2]) // 's'
		expect(after[1].style.transform).toContain('translateY') // entering rolls
		expect(after[1].style.opacity).toBe('0')
		// The semantic value already reads the new text mid-roll.
		expect(semantic(el)).toBe('10 seconds')
		act(() => vi.advanceTimersByTime(1000))
		expect(commit(el)).toBe('10 seconds')
		expect(cells(el).every((cell) => cell.style.transform === '')).toBe(true)
		root.unmount()
		el.remove()
	})

	it('settles instantly under reducedMotion="always"', () => {
		const { el, root } = mount({ value: '9', reducedMotion: 'always' })
		act(() => root.render(<RollingText value="10" reducedMotion="always" />))
		expect(commit(el)).toBe('10')
		expect(cells(el).every((cell) => cell.style.transform === '')).toBe(true)
		expect(semantic(el)).toBe('10')
		root.unmount()
		el.remove()
	})

	it('equal values do nothing', () => {
		const { el, root } = mount({ value: 'same' })
		const before = cells(el)
		act(() => root.render(<RollingText value="same" />))
		expect(cells(el)).toEqual(before)
		root.unmount()
		el.remove()
	})

	it("'interrupt' snaps the running roll to its target before the next", () => {
		const { el, root } = mount({ value: 'a', transition: { duration: 0.3 } })
		act(() => root.render(<RollingText value="b" transition={{ duration: 0.3 }} />))
		act(() => root.render(<RollingText value="c" transition={{ duration: 0.3 }} />))
		// The interrupted run committed 'b' — its ghost rolls out beside 'c'.
		expect(commit(el)).toBe('bc')
		act(() => vi.advanceTimersByTime(1000))
		expect(commit(el)).toBe('c')
		root.unmount()
		el.remove()
	})

	it("'latest' holds one pending destination", () => {
		const { el, root } = mount({ value: 'a', updatePolicy: 'latest', transition: { duration: 0.3 } })
		act(() => root.render(<RollingText value="b" updatePolicy="latest" transition={{ duration: 0.3 }} />))
		act(() => root.render(<RollingText value="c" updatePolicy="latest" transition={{ duration: 0.3 }} />))
		act(() => vi.advanceTimersByTime(400)) // run toward 'b' completes
		expect(commit(el)).toBe('bc') // the pending roll now targets 'c', 'b' exiting
		act(() => vi.advanceTimersByTime(600))
		expect(commit(el)).toBe('c')
		root.unmount()
		el.remove()
	})

	it('accessibilityLabel overrides the semantic text', () => {
		const { el, root } = mount({ value: '3', accessibilityLabel: '3 items' })
		expect(semantic(el)).toBe('3 items')
		root.unmount()
		el.remove()
	})

	it('unmount mid-roll cancels work and removes the tree', () => {
		const { el, root } = mount({ value: 'a' })
		act(() => root.render(<RollingText value="b" />))
		act(() => root.unmount())
		expect(el.querySelectorAll('span')).toHaveLength(0)
		act(() => vi.advanceTimersByTime(2000))
		el.remove()
	})
})
