import { afterEach, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'

const fixture = vi.hoisted(() => ({ context: null as any, clip: { setClip: vi.fn(), clear: vi.fn() } }))
vi.mock('@octane-xplat/ui', () => ({ View: () => null, HStack: () => null, Pressable: () => null }))
vi.mock('./root.tsrx', () => ({
	useLightboxCtx: () => fixture.context,
	useSlideCtx: () => ({ index: 0 }),
}))
vi.mock('./clip', () => ({ createClipWriter: () => fixture.clip }))

import { Image } from './Image.tsrx'
import { SETTLE } from './constants'

afterEach(() => {
	vi.useRealTimers()
	vi.clearAllMocks()
})

it.each(['open', 'close-before-layout', 'close-during-morph'])('handles delayed layout: %s', async (action) => {
	const closeBeforeLayout = action === 'close-before-layout'
	vi.useFakeTimers()
	let measured = false
	let send: ((intent: any) => void) | undefined
	const listeners = new Set<() => void>()
	const slide = {
		getActualSize: () => measured ? { width: 400, height: 800 } : { width: 0, height: 0 },
		getLocationOnScreen: () => ({ x: 0, y: 0 }),
		on: (_: string, listener: () => void) => listeners.add(listener),
		off: (_: string, listener: () => void) => listeners.delete(listener),
	}
	const trigger = {
		parent: slide,
		getActualSize: () => ({ width: 120, height: 80 }),
		getLocationOnScreen: () => ({ x: 20, y: 30 }),
	}
	fixture.context = {
		items: [{ src: '', alt: 'Photo', width: 800, height: 600 }],
		index: 0, phase: 'opening', reducedMotion: false,
		images: new Map(), viewport: { current: { registerInput(_index: number, listener: typeof send) { send = listener; return () => {} } } }, openTrigger: { current: trigger },
		options: { maxZoom: 4, open: { duration: 0.2 }, close: { duration: 0.2 } },
		presence: { get: () => 1, set: vi.fn(), animate: vi.fn(() => ({ stop: vi.fn(), finished: Promise.resolve() })) },
		pickTrigger: () => trigger, hideTrigger: vi.fn(), onOpened: vi.fn(), setZoomed: vi.fn(), setDragging: vi.fn(),
	}
	const container = createObjectContainer('nativescript')
	const object = createObjectDriver('nativescript')
	const root = createUniversalRoot(container, {
		...object,
		getPublicInstance(container, id) {
			const view = object.getPublicInstance(container, id)
			if (view) {Object.assign(view, {
				parent: slide, on: slide.on, off: slide.off,
				getActualSize: () => measured ? { width: 400, height: 300 } : { width: 0, height: 0 },
			})}
			return view
		},
	})
	try {
		root.render(Image, {})
		flushUniversalSync(() => {})
		expect(fixture.context.images.has(0)).toBe(true)
		expect(fixture.clip.setClip).not.toHaveBeenCalled()
		await vi.advanceTimersByTimeAsync(50)
		expect(fixture.context.presence.animate).not.toHaveBeenCalled()
		if (closeBeforeLayout) {
			fixture.context.phase = 'closing'
			await fixture.context.images.get(0).animateOut(trigger)
		}
		measured = true
		flushUniversalSync(() => { for (const listener of listeners) {listener()} })
		await vi.advanceTimersByTimeAsync(16)
		if (closeBeforeLayout) {
			expect(fixture.clip.setClip).not.toHaveBeenCalled()
			expect(fixture.context.hideTrigger).not.toHaveBeenCalled()
		} else {
			expect(fixture.clip.setClip).toHaveBeenCalled()
			expect(fixture.context.hideTrigger).toHaveBeenCalledWith(trigger)
			await vi.advanceTimersByTimeAsync(32)
			expect(fixture.context.presence.set.mock.calls.some(([p]: [number]) => p > 0 && p < 1)).toBe(true)
			if (action === 'open') {
				fixture.context.phase = 'open'
				send!({ kind: 'panStart', at: { x: 100, y: 100 }, pointer: 'touch' })
				send!({ kind: 'panMove', at: { x: 100, y: 120 } })
				send!({ kind: 'panMove', at: { x: 100, y: 130 } })
				send!({ kind: 'panEnd', at: { x: 100, y: 130 }, velocity: { x: 0, y: 0 }, cancelled: true })
				expect(fixture.context.presence.animate).toHaveBeenLastCalledWith(1, SETTLE)
			}
			if (action === 'close-during-morph') {
				fixture.context.phase = 'closing'
				void fixture.context.images.get(0).animateOut(trigger)
				await Promise.resolve()
				expect(fixture.context.onOpened).not.toHaveBeenCalled()
				expect(fixture.clip.clear).not.toHaveBeenCalled()
			}
		}
	} finally {
		root.unmount()
		vi.clearAllTimers()
	}
})
