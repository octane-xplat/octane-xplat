import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPullToRefresh } from './refresh.ts'

const platform = vi.hoisted(() => ({ ios: false }))
vi.mock('@nativescript/core', () => ({
	get isIOS() {
		return platform.ios
	},
	get isAndroid() {
		return !platform.ios
	},
}))
afterEach(() => vi.useRealTimers())

function setup(ios: boolean) {
	platform.ios = ios
	const listeners = new Map<string, (event: any) => void>()
	const makeView = () => ({
		translateY: 0,
		animate: vi.fn(function (
			this: { translateY: number },
			definition: { translate: { y: number } },
		) {
			this.translateY = definition.translate.y
			return Promise.resolve()
		}),
	})
	const scroller = {
		...makeView(),
		ios: { contentInset: { top: 0, left: 0, right: 0, bottom: 0 }, contentOffset: { y: 0 } },
		on: (name: string, listener: (event: any) => void) => {
			listeners.set(name, listener)
		},
		off: (name: string) => {
			listeners.delete(name)
		},
	}
	const indicator = makeView()
	const cfg = { current: { refreshing: false, onRefresh: vi.fn() } }
	const controller = createPullToRefresh({ scroller, indicator, isAtTop: () => true, cfg })
	const emit = (state: number, deltaY = 0) => {
		if (ios) {
			scroller.ios.contentOffset.y = -deltaY - scroller.ios.contentInset.top
		}
		listeners.get('pan')?.({ state, deltaY })
	}
	return { scroller, indicator, cfg, controller, emit, listeners }
}

describe.each([false, true])('native refresh cancellation (iOS=%s)', (ios) => {
	it('collapses a cancelled pull past the threshold without refreshing', () => {
		const host = setup(ios)
		try {
			host.emit(1)
			host.emit(2, 200)
			host.emit(0, 200)
			expect(host.cfg.current.onRefresh).not.toHaveBeenCalled()
			expect(host.indicator.translateY).toBe(-64)
			if (!ios) {
				expect(host.scroller.translateY).toBe(0)
			}
		} finally {
			host.controller.detach()
		}
	})
	it('keeps a controlled refresh docked when a pull is cancelled', () => {
		const host = setup(ios)
		try {
			host.cfg.current.refreshing = true
			host.controller.sync()
			host.emit(1)
			host.emit(2, 200)
			host.emit(0, 200)
			expect(host.cfg.current.onRefresh).not.toHaveBeenCalled()
			expect(host.indicator.translateY).toBe(0)
			if (ios) {
				expect(host.scroller.ios.contentInset.top).toBe(64)
			} else {
				expect(host.scroller.translateY).toBe(64)
			}
		} finally {
			host.controller.detach()
		}
	})
	it('applies a controlled dock deferred while a cancelled gesture was active', () => {
		const host = setup(ios)
		try {
			host.emit(1)
			host.cfg.current.refreshing = true
			host.controller.sync()
			host.emit(0)
			expect(host.cfg.current.onRefresh).not.toHaveBeenCalled()
			expect(host.indicator.translateY).toBe(0)
			if (ios) {
				expect(host.scroller.ios.contentInset.top).toBe(64)
			} else {
				expect(host.scroller.translateY).toBe(64)
			}
		} finally {
			host.controller.detach()
		}
	})
	it('still refreshes once on a completed pull and removes its observer', () => {
		vi.useFakeTimers()
		const host = setup(ios)
		host.emit(1)
		host.emit(2, 200)
		host.emit(3, 200)
		expect(host.cfg.current.onRefresh).toHaveBeenCalledOnce()
		host.controller.detach()
		expect(host.listeners.size).toBe(0)
		vi.runAllTimers()
		expect(host.cfg.current.onRefresh).toHaveBeenCalledOnce()
	})
})
