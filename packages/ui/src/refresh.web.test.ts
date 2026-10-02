// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPullToRefresh } from './refresh.web'
import { REFRESH_HEADER_HEIGHT } from './refresh-metrics'

// Unit-level check of the web pull-to-refresh state machine: synthetic
// pointer events drive the controller, assertions read the composed
// transform writes (setTranslate → translateX/translateY pair). jsdom has
// no PointerEvent constructor — plain Events carry the fields the
// handlers read.

function host() {
	const wrapper = document.createElement('div')
	const scroller = document.createElement('div')
	const indicator = document.createElement('div')
	wrapper.appendChild(indicator)
	wrapper.appendChild(scroller)
	document.body.appendChild(wrapper)
	return { wrapper, scroller, indicator }
}

function pointer(type: string, y: number) {
	const e = new Event(type, { cancelable: true, bubbles: true })
	Object.assign(e, { pointerType: 'mouse', clientY: y, button: 0 })
	return e
}

const ty = (el: HTMLElement) => el.style.transform

describe('createPullToRefresh (web)', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
		document.body.innerHTML = ''
	})

	it('tracks a sub-threshold drag and resets on release', () => {
		const { scroller, indicator } = host()
		const cfg = { current: { onRefresh: vi.fn() } }
		const ctl = createPullToRefresh({ scroller, indicator, cfg })

		scroller.dispatchEvent(pointer('pointerdown', 100))
		scroller.dispatchEvent(pointer('pointermove', 180))
		// damped: 80 * 0.5 = 40
		expect(ty(scroller)).toContain('translateY(40px)')
		expect(ty(indicator)).toContain(`translateY(${40 - REFRESH_HEADER_HEIGHT}px)`)

		scroller.dispatchEvent(pointer('pointerup', 180))
		expect(cfg.current.onRefresh).not.toHaveBeenCalled()
		expect(ty(scroller)).toContain('translateY(0px)')
		ctl.detach()
	})

	it('fires onRefresh and docks past the threshold; refreshless release collapses after grace', () => {
		const { scroller, indicator } = host()
		const cfg = { current: { onRefresh: vi.fn(), refreshing: false } }
		const ctl = createPullToRefresh({ scroller, indicator, cfg })

		scroller.dispatchEvent(pointer('pointerdown', 100))
		scroller.dispatchEvent(pointer('pointermove', 320))
		scroller.dispatchEvent(pointer('pointerup', 320))
		// 220 * 0.5 = 110 >= 64 → docked
		expect(cfg.current.onRefresh).toHaveBeenCalledTimes(1)
		expect(ty(scroller)).toContain(`translateY(${REFRESH_HEADER_HEIGHT}px)`)
		expect(ty(indicator)).toContain('translateY(0px)')

		// refreshing never arrives → grace collapse
		vi.advanceTimersByTime(400)
		expect(ty(scroller)).toContain('translateY(0px)')
		ctl.detach()
	})

	it('refreshing keeps the dock; sync(false) collapses', () => {
		const { scroller, indicator } = host()
		const cfg = { current: { onRefresh: vi.fn(), refreshing: false } }
		const ctl = createPullToRefresh({ scroller, indicator, cfg })

		scroller.dispatchEvent(pointer('pointerdown', 100))
		scroller.dispatchEvent(pointer('pointermove', 320))
		cfg.current.refreshing = true
		ctl.sync()
		scroller.dispatchEvent(pointer('pointerup', 320))
		expect(cfg.current.onRefresh).toHaveBeenCalledTimes(1)

		vi.advanceTimersByTime(400)
		expect(ty(scroller)).toContain(`translateY(${REFRESH_HEADER_HEIGHT}px)`)

		cfg.current.refreshing = false
		ctl.sync()
		expect(ty(scroller)).toContain('translateY(0px)')
		expect(ty(indicator)).toContain(`translateY(${-REFRESH_HEADER_HEIGHT}px)`)
		ctl.detach()
	})

	it('ignores drags that start below the top edge', () => {
		const { scroller } = host()
		Object.defineProperty(scroller, 'scrollTop', { value: 30, writable: true })
		const cfg = { current: { onRefresh: vi.fn() } }
		const ctl = createPullToRefresh({ scroller, indicator: document.createElement('div'), cfg })

		scroller.dispatchEvent(pointer('pointerdown', 100))
		scroller.dispatchEvent(pointer('pointermove', 320))
		scroller.dispatchEvent(pointer('pointerup', 320))
		expect(cfg.current.onRefresh).not.toHaveBeenCalled()
		expect(ty(scroller)).toBe('')
		ctl.detach()
	})
})
