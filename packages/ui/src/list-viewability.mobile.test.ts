import { afterEach, describe, expect, it, vi } from 'vitest'
import { createListViewabilityTracker } from './list-viewability-core'
import {
	createInitialListScrollRestorer,
	observeLoadedListPeer,
	scrollListToIndex,
} from './list-viewability-runtime'

describe('platform list viewability', () => {
	afterEach(() => vi.useRealTimers())

	it('uses the 50 percent and 250 ms defaults, then reports sorted logical rows', () => {
		vi.useFakeTimers()
		const rows = ['first', 'second', 'third']
		const onChange = vi.fn()
		const tracker = createListViewabilityTracker<string>()

		tracker.update(
			[
				{ index: 2, visiblePercent: 49 },
				{ index: 1, visiblePercent: 50 },
				{ index: 0, visiblePercent: 100 },
			],
			rows,
			undefined,
			onChange,
		)
		expect(onChange).not.toHaveBeenCalled()
		vi.advanceTimersByTime(249)
		expect(onChange).not.toHaveBeenCalled()
		vi.advanceTimersByTime(1)
		expect(onChange).toHaveBeenCalledTimes(2)
		expect(onChange).toHaveBeenLastCalledWith({
			viewableItems: [
				{ index: 0, item: 'first' },
				{ index: 1, item: 'second' },
			],
			changed: [{ index: 0, item: 'first', isViewable: true }],
		})
		tracker.dispose()
	})

	it('drops rows immediately below threshold and emits recycled-item leave and enter changes', () => {
		const onChange = vi.fn()
		const tracker = createListViewabilityTracker<{ id: string }>()
		const before = { id: 'A' }
		const after = { id: 'B' }
		tracker.update([{ index: 0, visiblePercent: 75 }], [before], { minimumViewTime: 0 }, onChange)
		expect(onChange).toHaveBeenLastCalledWith({
			viewableItems: [{ index: 0, item: before }],
			changed: [{ index: 0, item: before, isViewable: true }],
		})

		tracker.update([{ index: 0, visiblePercent: 100 }], [after], { minimumViewTime: 0 }, onChange)
		expect(onChange).toHaveBeenLastCalledWith({
			viewableItems: [{ index: 0, item: after }],
			changed: [
				{ index: 0, item: before, isViewable: false },
				{ index: 0, item: after, isViewable: true },
			],
		})

		tracker.update([{ index: 0, visiblePercent: 49 }], [after], { minimumViewTime: 0 }, onChange)
		expect(onChange).toHaveBeenLastCalledWith({
			viewableItems: [],
			changed: [{ index: 0, item: after, isViewable: false }],
		})
		tracker.dispose()
	})

	it('cancels a dwell timer when a recycled row changes item before qualifying', () => {
		vi.useFakeTimers()
		const onChange = vi.fn()
		const tracker = createListViewabilityTracker<{ id: string }>()
		const before = { id: 'A' }
		const after = { id: 'B' }
		tracker.update([{ index: 0, visiblePercent: 80 }], [before], { minimumViewTime: 250 }, onChange)
		vi.advanceTimersByTime(125)
		tracker.update([{ index: 0, visiblePercent: 80 }], [after], { minimumViewTime: 250 }, onChange)
		vi.advanceTimersByTime(125)
		expect(onChange).not.toHaveBeenCalled()
		vi.advanceTimersByTime(125)
		expect(onChange).toHaveBeenCalledWith({
			viewableItems: [{ index: 0, item: after }],
			changed: [{ index: 0, item: after, isViewable: true }],
		})
		tracker.dispose()
	})

	it('clears active rows and dwell timers when a list detaches', () => {
		vi.useFakeTimers()
		const onChange = vi.fn()
		const tracker = createListViewabilityTracker<string>()
		tracker.update([{ index: 0, visiblePercent: 100 }], ['active'], { minimumViewTime: 0 }, onChange)
		tracker.update([{ index: 1, visiblePercent: 100 }], ['active', 'pending'], undefined, onChange)
		tracker.reset()
		vi.advanceTimersByTime(250)

		expect(onChange).toHaveBeenLastCalledWith({
			viewableItems: [],
			changed: [{ index: 0, item: 'active', isViewable: false }],
		})
		expect(onChange).toHaveBeenCalledTimes(2)
		tracker.dispose()
	})

	it('attaches after loaded, refreshes on layout, and disposes peers across unload/reload', () => {
		const listeners = new Map<string, Set<() => void>>()
		const list = {
			isLoaded: false,
			on: (event: string, callback: () => void) => {
				const handlers = listeners.get(event) ?? new Set()
				handlers.add(callback)
				listeners.set(event, handlers)
			},
			off: (event: string, callback: () => void) => listeners.get(event)?.delete(callback),
		}
		const emit = (event: string) => {
			for (const callback of listeners.get(event) ?? []) callback()
		}
		const firstPeer = {}
		const secondPeer = {}
		let currentPeer: object | null = null
		const attach = vi.fn(() => ({ refresh: vi.fn(), dispose: vi.fn() }))
		const reset = vi.fn()
		const observer = observeLoadedListPeer(list, () => currentPeer, attach, reset)
		observer.refresh()
		expect(attach).not.toHaveBeenCalled()

		list.isLoaded = true
		currentPeer = firstPeer
		emit('loaded')
		expect(attach).toHaveBeenCalledTimes(1)
		emit('layoutChanged')
		expect(attach).toHaveBeenCalledTimes(1)
		expect(attach.mock.results[0].value.refresh).toHaveBeenCalled()

		list.isLoaded = false
		currentPeer = null
		emit('unloaded')
		expect(attach.mock.results[0].value.dispose).toHaveBeenCalledTimes(1)
		expect(reset).toHaveBeenCalledTimes(1)

		list.isLoaded = true
		currentPeer = secondPeer
		emit('loaded')
		expect(attach).toHaveBeenCalledTimes(2)
		observer.dispose()
		expect(attach.mock.results[1].value.dispose).toHaveBeenCalledTimes(1)
		expect([...listeners.values()].every(handlers => handlers.size === 0)).toBe(true)
		expect(reset).toHaveBeenCalledTimes(2)
	})

	it('retries an initial index when data arrives and only applies it once per target/list', () => {
		const list = { scrollToIndex: vi.fn(), scrollToIndexAnimated: vi.fn() }
		const restore = createInitialListScrollRestorer()
		expect(restore.tryScroll(list, 2, 1)).toBe(false)
		expect(restore.tryScroll(list, 2, 3)).toBe(true)
		expect(restore.tryScroll(list, 2, 4)).toBe(false)
		expect(restore.tryScroll(list, 1, 4)).toBe(true)
		expect(restore.tryScroll(list, 2, 4)).toBe(true)
		expect(list.scrollToIndex.mock.calls).toEqual([[2], [1], [2]])
	})

	it('treats missing lists and invalid indices as no-ops', () => {
		const list = { scrollToIndex: vi.fn(), scrollToIndexAnimated: vi.fn() }
		scrollListToIndex(null, 0, 2)
		scrollListToIndex(list, -1, 2)
		scrollListToIndex(list, 2, 2)
		scrollListToIndex(list, 0.5, 2)
		expect(list.scrollToIndex).not.toHaveBeenCalled()
		expect(list.scrollToIndexAnimated).not.toHaveBeenCalled()
		scrollListToIndex(list, 1, 2, true)
		expect(list.scrollToIndexAnimated).toHaveBeenCalledWith(1)
		scrollListToIndex(list, 0, 2)
		expect(list.scrollToIndex).toHaveBeenCalledWith(0)
	})
})
