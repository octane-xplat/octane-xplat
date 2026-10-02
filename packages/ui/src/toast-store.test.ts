import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
	dismissToast,
	FALLBACK_TOAST_VIEWPORT,
	pushToast,
	registerToastViewport,
	toastOnViewport,
	toastStore,
	toastTiming,
} from './toast-store'

describe('toast store', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		toastStore.set([])
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('overwrites or ignores duplicate unique IDs according to collisionBehavior', () => {
		const first = pushToast({ body: 'first', uniqueID: 'save' }, 'screen')
		const second = pushToast({ body: 'second', uniqueID: 'save' }, 'screen')

		expect(toastStore.get()).toHaveLength(1)
		expect(toastStore.get()[0]).toMatchObject({
			id: second,
			viewportId: 'screen',
			options: { body: 'second' },
		})
		expect(second).not.toBe(first)

		const ignored = pushToast(
			{ body: 'ignored', uniqueID: 'save', collisionBehavior: 'ignore' },
			'screen',
		)

		expect(ignored).toBe('')
		expect(toastStore.get()[0].options.body).toBe('second')
	})

	it('notifies once and removes a dismissed entry after its exit window', () => {
		const onHide = vi.fn()
		const id = pushToast({ body: 'Saved', onHide })

		dismissToast(id, 'manual')
		dismissToast(id, 'auto')

		expect(onHide).toHaveBeenCalledOnce()
		expect(onHide).toHaveBeenCalledWith('manual')
		expect(toastStore.get()[0].exiting).toBe(true)
		vi.runAllTimers()
		expect(toastStore.get()).toEqual([])
	})

	it('routes entries to their mounted viewport, then falls back when it unmounts', () => {
		const unregister = registerToastViewport('screen')
		const id = pushToast({ body: 'Hello' }, 'screen')
		const hosted = toastStore.get().find((item) => item.id === id)!

		expect(toastOnViewport(hosted, 'screen')).toBe(true)
		expect(toastOnViewport(hosted, FALLBACK_TOAST_VIEWPORT)).toBe(false)
		unregister()
		expect(toastOnViewport(hosted, FALLBACK_TOAST_VIEWPORT)).toBe(true)
	})

	it('uses status-aware auto-hide defaults and clamps durations at zero', () => {
		expect(toastTiming({})).toEqual({ isAutoHide: true, autoHideDuration: 5000 })
		expect(toastTiming({ type: 'error' })).toEqual({ isAutoHide: false, autoHideDuration: 5000 })
		expect(toastTiming({ type: 'error', isAutoHide: true, autoHideDuration: -1 })).toEqual({
			isAutoHide: true,
			autoHideDuration: 0,
		})
	})
})
