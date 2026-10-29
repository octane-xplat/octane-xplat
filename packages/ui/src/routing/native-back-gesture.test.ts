// @vitest-environment node
import { expect, it, vi } from 'vitest'

vi.mock('@nativescript/core', () => ({
	GestureStateTypes: { cancelled: 0, began: 1, changed: 2, ended: 3 },
}))

import {
	attachNativeBackGesture,
	isNativeFrameDescendant,
	prepareNativeBackGesture,
} from './native-back-gesture.ios'

function view() {
	const ancestors = new Set<object>()
	return {
		ancestors,
		isEqual(other: object) {
			return this === other
		},
		isDescendantOfView: (candidate: object) => ancestors.has(candidate),
		effectiveUserInterfaceLayoutDirection: 0,
		bounds: { size: { width: 400 } },
	}
}

function fixture() {
	const initial = view()
	const listeners = new Map<string, Set<(event: any) => void>>()
	const frame = {
		currentPage: { id: 'source' },
		nativeViewProtected: initial,
		on(name: string, callback: (event: any) => void) {
			if (!listeners.has(name)) {
				listeners.set(name, new Set())
			}
			listeners.get(name)!.add(callback)
		},
		off(name: string, callback: (event: any) => void) {
			listeners.get(name)?.delete(callback)
		},
	}
	let active = true
	const back = vi.fn(async () => ({ status: 'committed' }))
	const detach = attachNativeBackGesture(frame as any, { canBegin: () => active, back })
	const emit = (state: number, values: Record<string, any> = {}) => {
		const { velocity = { x: 700, y: 0 }, nativeView = frame.nativeViewProtected, ...data } = values
		const event = {
			state,
			startX: 2,
			startY: 200,
			deltaX: 200,
			deltaY: 0,
			ios: { view: nativeView, velocityInView: () => velocity },
			...data,
		}
		for (const listener of listeners.get('pan') ?? []) {
			listener(event)
		}
	}
	return {
		frame,
		initial,
		listeners,
		back,
		detach,
		emit,
		setActive(value: boolean) {
			active = value
		},
		swipe(values: Record<string, any> = {}) {
			emit(1, values)
			emit(3, values)
		},
	}
}

it('disables unprepared UIKit pops only on the owned Page', () => {
	const page = { enableSwipeBackNavigation: true }
	const other = { enableSwipeBackNavigation: true }
	prepareNativeBackGesture(page as any)
	expect(page.enableSwipeBackNavigation).toBe(false)
	expect(other.enableSwipeBackNavigation).toBe(true)
})

it('removes only its own pan subscription and makes disposal idempotent', () => {
	const test = fixture()
	const foreign = vi.fn()
	test.frame.on('pan', foreign)
	test.detach()
	test.detach()
	test.swipe()
	expect([...test.listeners.get('pan')!]).toEqual([foreign])
	expect(foreign).toHaveBeenCalledTimes(2)
	expect(test.back).not.toHaveBeenCalled()
})

it('rejects inactive, wrong-edge, leftward and vertical starts', async () => {
	const test = fixture()
	try {
		test.setActive(false)
		test.swipe()
		test.setActive(true)
		test.swipe({ startX: 100 })
		test.swipe({ startX: -1 })
		test.swipe({ velocity: { x: -700, y: 0 } })
		test.swipe({ velocity: { x: 10, y: 500 } })
		await Promise.resolve()
		expect(test.back).not.toHaveBeenCalled()
	} finally {
		test.detach()
	}
})

it('ignores cancelled, short, reversed and vertical drags', async () => {
	const test = fixture()
	try {
		test.emit(1)
		test.emit(0)
		test.emit(3)
		test.swipe({ deltaX: 30, velocity: { x: 100, y: 0 } })
		test.emit(1)
		test.emit(3, { velocity: { x: -100, y: 0 } })
		test.swipe({ deltaX: 200, deltaY: 250 })
		test.swipe({ deltaX: 20 })
		await Promise.resolve()
		expect(test.back).not.toHaveBeenCalled()
	} finally {
		test.detach()
	}
})

it('requests Back once on release and holds off duplicates until preparation settles', async () => {
	const test = fixture()
	try {
		let release!: () => void
		test.back.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					release = () => resolve({ status: 'committed' })
				}),
		)

		test.emit(1)
		test.emit(2)
		expect(test.back).not.toHaveBeenCalled()
		test.emit(3)
		test.emit(3)
		await vi.waitFor(() => expect(test.back).toHaveBeenCalledTimes(1))
		test.swipe()
		await Promise.resolve()
		expect(test.back).toHaveBeenCalledTimes(1)
		release()
		await new Promise((resolve) => setImmediate(resolve))
		test.swipe()
		await vi.waitFor(() => expect(test.back).toHaveBeenCalledTimes(2))
	} finally {
		test.detach()
	}
})

it('accepts a deliberate fast flick above the minimum distance', async () => {
	const test = fixture()
	try {
		test.swipe({ deltaX: 45 })
		await vi.waitFor(() => expect(test.back).toHaveBeenCalledTimes(1))
	} finally {
		test.detach()
	}
})

it('rechecks active ownership and disposal before the deferred request, independently per Frame', async () => {
	const first = fixture()
	const second = fixture()
	try {
		first.swipe()
		first.detach()
		second.swipe()
		await vi.waitFor(() => expect(second.back).toHaveBeenCalledTimes(1))
		expect(first.back).not.toHaveBeenCalled()
	} finally {
		first.detach()
		second.detach()
	}
	const third = fixture()
	try {
		third.swipe()
		third.setActive(false)
		await Promise.resolve()
		expect(third.back).not.toHaveBeenCalled()
	} finally {
		third.detach()
	}
})

it('uses the leading edge and reversed direction in RTL layouts', async () => {
	const test = fixture()
	try {
		test.initial.effectiveUserInterfaceLayoutDirection = 1
		test.swipe({ startX: 2, deltaX: -200, velocity: { x: -700, y: 0 } })
		await Promise.resolve()
		expect(test.back).not.toHaveBeenCalled()
		test.swipe({ startX: 398, deltaX: -200, velocity: { x: -700, y: 0 } })
		await vi.waitFor(() => expect(test.back).toHaveBeenCalledTimes(1))
	} finally {
		test.detach()
	}
})

it('recognizes nested native Frames and rejects events from a foreign native view', async () => {
	const parent = fixture()
	const child = fixture()
	try {
		child.initial.ancestors.add(parent.initial)
		expect(isNativeFrameDescendant(child.frame as any, parent.frame as any)).toBe(true)
		expect(isNativeFrameDescendant(parent.frame as any, child.frame as any)).toBe(false)
		expect(isNativeFrameDescendant(parent.frame as any, parent.frame as any)).toBe(false)
		parent.swipe({ nativeView: child.initial })
		await Promise.resolve()
		expect(parent.back).not.toHaveBeenCalled()
	} finally {
		parent.detach()
		child.detach()
	}
})

it('does not reuse a drag after its Page changes before or after release', async () => {
	const test = fixture()
	try {
		test.emit(1)
		test.frame.currentPage = { id: 'during-drag' }
		test.emit(3)
		await Promise.resolve()
		expect(test.back).not.toHaveBeenCalled()
		test.swipe()
		test.frame.currentPage = { id: 'after-release' }
		await Promise.resolve()
		expect(test.back).not.toHaveBeenCalled()
	} finally {
		test.detach()
	}
})
