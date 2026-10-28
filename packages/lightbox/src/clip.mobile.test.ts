import { afterEach, expect, it, vi } from 'vitest'
import { createClipWriter } from './clip.ios'
import { createClipWriter as createAndroidClipWriter } from './clip.android'

afterEach(() => vi.unstubAllGlobals())

it('attaches after native layout and clips in untransformed local coordinates', () => {
	const mask = { frame: null as any, cornerRadius: 0, backgroundColor: null }
	vi.stubGlobal('CALayer', { layer: () => mask })
	vi.stubGlobal('UIColor', { whiteColor: { CGColor: 'white' } })
	vi.stubGlobal('CGRectMake', (x: number, y: number, width: number, height: number) => ({ x, y, width, height }))
	const transaction = { begin: vi.fn(), setDisableActions: vi.fn(), commit: vi.fn() }
	vi.stubGlobal('CATransaction', transaction)

	const view: any = { getActualSize: vi.fn(() => ({ width: 120, height: 90 })) }
	const writer = createClipWriter(view)
	const host = { bounds: { size: { width: 400, height: 300 } }, mask: null as any }
	view.nativeViewProtected = { layer: host }
	writer.setClip({ top: 50, bottom: 50, left: 0, right: 0 }, 12)
	expect(host.mask).toBe(mask)
	expect(mask.frame).toEqual({ x: 0, y: 50, width: 400, height: 200 })
	expect(mask.cornerRadius).toBe(12)
	expect(view.getActualSize).not.toHaveBeenCalled()
	expect(transaction.setDisableActions).toHaveBeenCalledWith(true)
	expect(transaction.commit).toHaveBeenCalledTimes(1)

	// A later native style pass may replace the mask; the next frame restores it.
	host.mask = null
	writer.setClip({ top: 0, bottom: 0, left: 0, right: 0 }, 0)
	expect(host.mask).toBe(mask)
	writer.clear()
	expect(host.mask).toBeNull()
	const replacement = {}
	host.mask = replacement
	writer.clear()
	expect(host.mask).toBe(replacement)
})

it('converts Android insets to pixels and restores the previous outline on close', () => {
	vi.stubGlobal('android', { view: { ViewOutlineProvider: {
		extend: (methods: object) => function (this: object) { Object.assign(this, methods) },
	} } })
	const previous = {}
	let provider: any = previous
	let clipped = false
	const native = {
		getWidth: () => 800, getHeight: () => 600,
		getOutlineProvider: () => provider,
		setOutlineProvider: (value: any) => { provider = value },
		getClipToOutline: () => clipped,
		setClipToOutline: (value: boolean) => { clipped = value },
		invalidateOutline: vi.fn(),
	}
	const view: any = {}
	const writer = createAndroidClipWriter(view)
	writer.setClip({ top: 50, right: 10, bottom: 50, left: 10 }, 12)
	expect(native.invalidateOutline).not.toHaveBeenCalled()
	view.nativeViewProtected = native
	writer.setClip({ top: 50, right: 10, bottom: 50, left: 10 }, 12)
	const outline = { setRoundRect: vi.fn() }
	provider.getOutline(native, outline)
	expect(outline.setRoundRect).toHaveBeenCalledWith(20, 100, 780, 500, 24)
	expect(clipped).toBe(true)
	writer.clear()
	expect(provider).toBe(previous)
	expect(clipped).toBe(false)

	writer.setClip({ top: 0, right: 0, bottom: 0, left: 0 }, 0)
	const replacement = {}
	provider = replacement
	writer.clear()
	expect(provider).toBe(replacement)
})
