import { expect, it, vi } from 'vitest'
import { createAppKitLightboxGestures } from './lightbox-gestures.macos'

function fixture() {
	let state = { open: true, index: 1, count: 3, src: 'photo-b', image: true, zoom: true }
	const changes: number[] = [], zooms: any[] = [], tokens: any[] = [], window: any = {}, stage: any = { window }, outside = {}
	let target: any = stage
	const viewport: any = { window, magnification: 1, contentView: { bounds: { origin: { x: 10, y: 20 }, size: { width: 200, height: 100 } } }, setMagnificationCenteredAtPoint(scale: number, point: any) { zooms.push({ scale, point }); viewport.magnification = scale } }
	window.contentView = { superview: { convertPointFromView(point: any) { return { x: point.x + 5, y: point.y + 7 } } }, hitTest(point: any) { expect(point).toEqual({ x: 15, y: 27 }); return target } }
	let currentStage: any = stage, selection: (() => void) | undefined
	const source = { addLocalMonitorForEventsMatchingMaskHandler(mask: number, callback: (event: any) => any) { expect(mask).toBe(2 ** 31); const token = { callback, removed: false }; tokens.push(token); return token }, removeMonitor(token: any) { token.removed = true } }
	const control = createAppKitLightboxGestures({ state: () => state, stage: () => currentStage, viewport: () => viewport, select(index) { changes.push(index); state = { ...state, index, src: `photo-${index}` }; selection?.() } }, () => ({ NSEvent: source }))
	const event = (extra: any = {}) => ({ type: 31, window, locationInWindow: { x: 10, y: 20 }, deltaX: 1, deltaY: 0, ...extra })
	control.sync()
	return { fault(callback: () => void) { selection = callback }, control, stage, viewport, window, changes, zooms, tokens, event, source, target(view: any) { target = view }, outside, update(next: Partial<typeof state>) { state = { ...state, ...next }; control.sync() }, replaceStage() { currentStage = { window }; control.sync() } }
}
it('double-click uses current clip-center coordinates, toggles 1/2x and resets source/index/zoom changes on the same view', () => {
	const f = fixture()
	try {
		expect(f.viewport.allowsMagnification).toBe(true); expect(f.viewport.minMagnification).toBe(1); expect(f.viewport.maxMagnification).toBe(4)
		expect(f.control.toggleZoom()).toBe(true); expect(f.zooms.at(-1)).toEqual({ scale: 2, point: { x: 110, y: 70 } })
		f.control.toggleZoom(); expect(f.zooms.at(-1).scale).toBe(1); f.viewport.magnification = 3; f.control.toggleZoom(); expect(f.zooms.at(-1).scale).toBe(1)
		f.viewport.magnification = 2; f.update({ index: 2, src: 'new-photo' }); expect(f.viewport.magnification).toBe(1)
		f.update({ zoom: false }); expect(f.viewport.allowsMagnification).toBe(false); expect(f.control.toggleZoom()).toBe(false)
	} finally { f.control.dispose() }
})
it('pointer swipe uses current bounds, keeps edge/vertical/zoomed gestures inert and rejects closed/hidden/detached stage', () => {
	const f = fixture()
	try {
		expect(f.control.swipe(2)).toBe(true); expect(f.changes).toEqual([2]); expect(f.control.swipe(2)).toBe(false); expect(f.control.swipe(4)).toBe(false)
		f.viewport.magnification = 2; expect(f.control.swipe(1)).toBe(false); f.viewport.magnification = 1; expect(f.control.swipe(1)).toBe(true)
		f.stage.hidden = true; expect(f.control.swipe(1)).toBe(false); f.stage.hidden = false; f.stage.window = null; expect(f.control.swipe(1)).toBe(false)
		f.stage.window = f.window; f.update({ open: false }); expect(f.control.swipe(1)).toBe(false); expect(f.tokens.every((token) => token.removed)).toBe(true)
	} finally { f.control.dispose() }
})
it('recognized AppKit swipes use opposite delta convention and consume only completed horizontal gestures hit inside the media stage', () => {
	const f = fixture()
	try {
		const callback = f.tokens[0].callback, left = f.event(); expect(callback(left)).toBeNull(); expect(f.changes).toEqual([2])
		const right = f.event({ deltaX: -1, phase: 8 }); expect(callback(right)).toBeNull(); expect(f.changes).toEqual([2, 1])
		for (const extra of [{ type: 22 }, { window: {} }, { phase: 1 }, { phase: 4 }, { phase: 16 }, { deltaX: 0, deltaY: 1 }, { deltaX: NaN }]) { const event = f.event(extra); expect(callback(event)).toBe(event) }
		f.target(f.outside); const outside = f.event(); expect(callback(outside)).toBe(outside)
		f.target({ isDescendantOf: (view: any) => view === f.stage }); expect(callback(f.event())).toBeNull()
	} finally { f.control.dispose() }
})
it('replacement and disposal remove owned monitors and retire queued callbacks without changing later selection', () => {
	const f = fixture(), old = f.tokens[0]
	f.replaceStage(); expect(old.removed).toBe(true); const event = f.event(); expect(old.callback(event)).toBe(event); expect(f.changes).toEqual([])
	f.control.dispose(); const current = f.tokens.at(-1); expect(current.removed).toBe(true); expect(current.callback(event)).toBe(event); expect(f.control.toggleZoom()).toBe(false); expect(f.control.swipe(1)).toBe(false); expect(f.changes).toEqual([])
})
it('a single item needs no swipe monitor and video/invalid geometry never magnifies', () => {
	const f = fixture()
	try {
		f.update({ count: 1, index: 0 }); expect(f.tokens[0].removed).toBe(true)
		f.update({ image: false }); expect(f.control.toggleZoom()).toBe(false); expect(f.viewport.allowsMagnification).toBe(false)
		f.update({ image: true }); f.viewport.contentView.bounds.size.width = 0; expect(f.control.toggleZoom()).toBe(false)
	} finally { f.control.dispose() }
})

it('consumer selection faults do not escape the native monitor or masquerade as input outside the stage', () => {
	const error = vi.spyOn(console, 'error').mockImplementation(() => {}), f = fixture()
	try { f.fault(() => { throw Error('consumer failed') }); expect(f.tokens[0].callback(f.event())).toBeNull(); expect(f.changes).toEqual([2]); expect(error).toHaveBeenCalledTimes(1) }
	finally { f.control.dispose(); error.mockRestore() }
})
