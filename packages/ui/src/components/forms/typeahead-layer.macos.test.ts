import { expect, it, vi } from 'vitest'
import { appKitTypeaheadOwnsFocus, createAppKitTypeaheadLayer } from './typeahead-layer.macos'

function fixture() {
	const viewport = { origin: { x: 0, y: 0 }, size: { width: 600, height: 400 } }
	const window: any = { contentView: { bounds: viewport, flipped: true }, firstResponder: {} }
	const bounds = { origin: { x: 100, y: 50 }, size: { width: 180, height: 30 } }
	const anchor: any = { window, bounds, convertRectToView: () => bounds }, input: any = { window }
	const state = { open: true, anchor, input, rtl: false, width: undefined as number | undefined, placement: 'bottom' as 'bottom' | 'top' }
	const observers = new Map<object, any>(), publications: any[] = [], sizes: any[] = [], layers: any[] = []
	const dismiss = vi.fn(), canDismiss = vi.fn(() => true)
	const native = { NSNotificationCenter: { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock(_: unknown, __: unknown, ___: unknown, callback: any) { const token = {}; observers.set(token, callback); return token },
		removeObserver(token: object) { observers.delete(token) },
	} } }
	const host: any = { showLayer(options: any) {
		const target = { window }, root = options.createContentRoot(target)
		const layer = { options, target, root, closed: false, point: null as any,
			show: vi.fn(), close: vi.fn(() => { if (layer.closed) {return;} layer.closed = true; root.unmount() }),
			update: vi.fn(() => root.whenCommitted(() => { layer.point = options.position({ left: bounds.origin.x, top: bounds.origin.y, ...bounds.size }, { width: 220, height: 100 }, { left: 0, top: 0, ...viewport.size }) })),
		}
		layers.push(layer); layer.update(); return layer
	} }
	const options = { state: () => state, publish: (target: any, retired?: object) => publications.push({ target, retired }), resize: (size: any) => sizes.push(size), dismiss, canDismiss }
	const controller = createAppKitTypeaheadLayer(options, () => host, () => native)
	const token = () => [...publications].reverse().find((entry) => entry.target)?.target.token
	const notify = (object = window) => { for (const callback of [...observers.values()]) {callback({ object })} }
	return { controller, options, state, input, anchor, window, bounds, viewport, publications, sizes, dismiss, canDismiss, layers, observers, host, token, notify }
}

it('stages a source outlet, bounds the list and reveals only after the source commit without moving focus', () => {
	const f = fixture(), responder = f.window.firstResponder
	try {
		f.controller.update(); const layer = f.layers[0]
		expect(layer.options).toMatchObject({ anchor: f.anchor, deferPresentation: true, lightDismiss: true, excludeAnchorFromDismiss: true })
		expect(layer.options.component).toBeUndefined(); expect(f.sizes).toEqual([{ width: 180, maxHeight: 312 }]); expect(layer.show).not.toHaveBeenCalled(); expect(f.controller.isPresent()).toBe(false)
		f.controller.committed(f.token()); expect(layer.show).toHaveBeenCalledTimes(1); expect(f.controller.isPresent()).toBe(true); expect(f.window.firstResponder).toBe(responder)
		f.controller.committed(f.token()); expect(layer.show).toHaveBeenCalledTimes(1)
	} finally { f.controller.dispose() }
})
it('uses current RTL/placement and waits for resized source content before completing positioning', () => {
	const f = fixture()
	try {
		f.controller.update(); f.controller.committed(f.token()); expect(f.layers[0].point.left).toBe(100)
		f.state.rtl = true; f.state.placement = 'top'; f.state.width = 1000; f.viewport.size.width = 320; f.bounds.origin.y = 250
		f.controller.update(); expect(f.sizes.at(-1)).toEqual({ width: 304, maxHeight: 242 })
		f.controller.committed(f.token()); expect(f.layers[0].point).toMatchObject({ left: 60, top: 142, placement: 'top' })
	} finally { f.controller.dispose() }
})
it('replaces native owners and ignores old source commits and unmounts', () => {
	const f = fixture()
	try {
		f.controller.update(); const token = f.token(), old = f.layers[0]
		f.state.anchor = { ...f.anchor }; f.controller.update(); const current = f.token(); expect(current).not.toBe(token); expect(old.close).toHaveBeenCalledTimes(1)
		const count = f.publications.length; old.root.unmount(); f.controller.committed(token); expect(f.publications).toHaveLength(count); expect(f.layers[1].show).not.toHaveBeenCalled()
		f.controller.committed(current); expect(f.layers[1].show).toHaveBeenCalledTimes(1)
	} finally { f.controller.dispose() }
})
it('outside dismissal honors current layer ownership and remains a controlled request', () => {
	const f = fixture()
	try {
		f.controller.update(); f.controller.committed(f.token()); f.canDismiss.mockReturnValue(false); f.layers[0].options.onClose(); expect(f.dismiss).not.toHaveBeenCalled()
		f.canDismiss.mockReturnValue(true); f.layers[0].options.onClose(); expect(f.dismiss).toHaveBeenCalledTimes(1); expect(f.layers[0].closed).toBe(false)
		f.state.open = false; f.controller.update(); expect(f.layers[0].closed).toBe(true); expect(f.observers.size).toBe(0)
	} finally { f.controller.dispose() }
})
it('window migration retires the request until an explicit close/reopen', () => {
	const f = fixture()
	try {
		f.controller.update(); f.controller.committed(f.token()); f.input.window = { contentView: f.window.contentView }; f.anchor.window = f.input.window
		f.notify(f.window); expect(f.layers[0].closed).toBe(true); expect(f.dismiss).toHaveBeenCalledTimes(1); expect(f.observers.size).toBe(0)
		f.controller.update(); expect(f.layers).toHaveLength(1)
		f.state.open = false; f.controller.update(); f.state.open = true; f.controller.update(); expect(f.layers).toHaveLength(2)
	} finally { f.controller.dispose() }
})
it('native owner closure cancels the current request without resurrection from retained callbacks', () => {
	const f = fixture()
	try {
		f.controller.update(); const old = f.layers[0]; old.close(); old.options.onClose(); expect(f.dismiss).toHaveBeenCalledTimes(1)
		f.controller.update(); old.options.onClose(); f.controller.committed(f.token()); expect(f.layers).toHaveLength(1); expect(f.observers.size).toBe(0)
	} finally { f.controller.dispose() }
})
it('late attachment waits for the current window and ignores unrelated notifications', () => {
	const f = fixture(); f.anchor.window = null
	try {
		f.controller.update(); expect(f.layers).toHaveLength(0); expect(f.observers.size).toBe(1)
		f.anchor.window = f.window; f.notify({}); expect(f.layers).toHaveLength(0); f.notify(); expect(f.layers).toHaveLength(1)
	} finally { f.controller.dispose() }
})
it('missing and legacy hosts fail explicitly instead of rendering a detached or inline copy', () => {
	for (const legacy of [false, true]) {
		const f = fixture()
		if (legacy) {f.host.showLayer = () => ({ closed: false, show() {}, update() {}, close() {} })}
		else {delete f.host.showLayer}
		try { expect(() => f.controller.update()).toThrow(/source.outlet|source-owned/); expect(f.controller.isPresent()).toBe(false); expect(f.observers.size).toBe(0) }
		finally { f.controller.dispose() }
	}
})
it('disposal during source publication closes a late returned handle and never republishes', () => {
	const f = fixture(), publish = f.options.publish
	f.options.publish = (target, retired) => { publish(target, retired); if (target) {f.controller.dispose()} }
	f.controller.update(); const count = f.publications.length; expect(f.layers[0].closed).toBe(true); expect(f.observers.size).toBe(0)
	f.layers[0].root.unmount(); f.controller.committed(f.token()); f.controller.update(); expect(f.publications).toHaveLength(count)
})
it('host creation errors retain the original failure after source and observer cleanup', () => {
	const f = fixture(), failure = Error('host creation failed')
	f.host.showLayer = (options: any) => { options.createContentRoot({}); throw failure }
	try { expect(() => f.controller.update()).toThrow(failure); expect(f.publications.at(-1).target).toBe(null); expect(f.observers.size).toBe(0) }
	finally { f.controller.dispose() }
})
it('zero and nonfinite geometry never creates a result host', () => {
	const f = fixture()
	try {
		f.bounds.size.width = 0; f.controller.update(); f.bounds.size.width = NaN; f.controller.update(); expect(f.layers).toHaveLength(0)
		f.bounds.size.width = 180; f.controller.update(); expect(f.layers).toHaveLength(1)
	} finally { f.controller.dispose() }
})
it('compound focus includes input editors and descendants of the detached result view', () => {
	const window: any = { firstResponder: null }, input: any = { window }, list: any = { window }, child = { superview: list }
	window.firstResponder = { delegate: () => input }; expect(appKitTypeaheadOwnsFocus([input, list])).toBe(true)
	window.firstResponder = child; expect(appKitTypeaheadOwnsFocus([input, list])).toBe(true)
	window.firstResponder = { delegate: { superview: list } }; expect(appKitTypeaheadOwnsFocus([input, list])).toBe(true)
})
it('foreign, detached and cyclic responder paths leave the compound field', () => {
	const cycle: any = {}; cycle.superview = cycle
	const window = { firstResponder: cycle }, input: any = { window }, list: any = { window: null }
	expect(appKitTypeaheadOwnsFocus([input, list, null])).toBe(false)
	window.firstResponder = {}; expect(appKitTypeaheadOwnsFocus([input, list])).toBe(false)
})

it('window migration during source publication retires a late handle until close/reopen', () => {
	const f = fixture(), publish = f.options.publish
	f.options.publish = (target, retired) => { publish(target, retired); if (target) { const window = { contentView: f.window.contentView }; f.input.window = window; f.anchor.window = window } }
	try {
		f.controller.update(); expect(f.layers[0].closed).toBe(true); expect(f.dismiss).toHaveBeenCalledTimes(1); expect(f.observers.size).toBe(0)
		f.controller.update(); expect(f.layers).toHaveLength(1)
	} finally { f.controller.dispose() }
})

it('only a current revealed source commit reports readiness to its field', () => {
	const f = fixture()
	try {
		f.controller.update(); const token = f.token()
		expect(f.controller.committed({})).toBeFalsy(); expect(f.controller.committed(token)).toBe(true)
		f.input.window = null; expect(f.controller.committed(token)).toBeFalsy(); expect(f.controller.isPresent()).toBe(false)
	} finally { f.controller.dispose() }
})
it('native source retirement during reveal cannot report readiness or remain present', () => {
	const f = fixture()
	try {
		f.controller.update(); f.layers[0].show.mockImplementation(() => f.layers[0].close())
		expect(f.controller.committed(f.token())).toBeFalsy(); expect(f.controller.isPresent()).toBe(false)
	} finally { f.controller.dispose() }
})
