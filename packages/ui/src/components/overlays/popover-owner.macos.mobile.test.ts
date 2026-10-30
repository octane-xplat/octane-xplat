import { expect, it, vi } from 'vitest'
import { createAppKitPopoverOwner } from './popover-owner.macos'

function fixture() {
	const observers = new Map<object, (note: any) => void>(), layers: any[] = [], targets: any[] = []
	const window: any = {}, anchor: any = { window, convertRectToView() {} }
	const state: any = { open: true, anchor, lightDismiss: true }
	const dismiss = vi.fn(), canDismiss = vi.fn(() => true), remove = vi.fn((token: object) => observers.delete(token))
	const center: any = { removeObserver: remove, addObserverForNameObjectQueueUsingBlock(_: unknown, __: unknown, ___: unknown, callback: any) { const token = {}; observers.set(token, callback); return token } }
	const native: any = { NSNotificationCenter: { defaultCenter: center } }
	let duringAcquire: (() => void) | undefined
	const bridge: any = { showLayer(options: any) {
		const source = options.createContentRoot({ window }), layer: any = { options, source, closed: false,
			show: vi.fn(), update: vi.fn((_props: any, next: any) => { layer.latest = next; source.whenCommitted(() => {}) }),
			close: vi.fn(() => { if (layer.closed) {return;} layer.closed = true; source.unmount(); options.onClose() }),
		}
		layers.push(layer); layer.update(); duringAcquire?.(); return layer
	} }
	const owner = createAppKitPopoverOwner({ state: () => state, publish: (target, retired) => targets.push({ target, retired }), dismiss, canDismiss }, () => bridge, () => native)
	const token = () => targets.findLast((entry) => entry.target)?.target.token
	return { state, anchor, window, owner, layers, targets, token, dismiss, canDismiss, observers, center, native, remove, bridge,
		duringAcquire(callback: () => void) { duringAcquire = callback }, notify() { for (const callback of [...observers.values()]) {callback({ object: state.anchor?.window })} },
	}
}
it('keeps content hidden until its current source commit and reads current physical position, alignment and offset', () => {
	const f = fixture()
	try {
		f.owner.update(); const layer = f.layers[0]; expect(layer.options.deferPresentation).toBe(true); expect(layer.options.component).toBeUndefined(); expect(layer.show).not.toHaveBeenCalled()
		f.owner.committed({}); expect(layer.show).not.toHaveBeenCalled(); f.owner.committed(f.token()); expect(layer.show).toHaveBeenCalledTimes(1); expect(f.owner.isPresent()).toBe(true)
		const bounds = { left: 30, top: 20, width: 80, height: 30 }, panel = { width: 40, height: 20 }, viewport = { left: 0, top: 0, width: 400, height: 300 }
		expect(layer.options.position(bounds, panel, viewport)).toMatchObject({ left: 30, top: 58 })
		Object.assign(f.state, { alignment: 'end', offset: '12px' }); expect(layer.options.position(bounds, panel, viewport)).toMatchObject({ left: 70, top: 62 })
		Object.assign(f.state, { placement: 'top', alignment: 'center', offset: 0 }); expect(layer.options.position(bounds, panel, viewport)).toMatchObject({ left: 50, top: 0 })
		f.state.lightDismiss = false; f.owner.update(); expect(layer.latest.lightDismiss).toBe(false); expect(f.layers).toHaveLength(1)
	} finally { f.owner.dispose() }
})
it('gates outside requests without closing a rejected controlled popover and ignores stale requests', () => {
	const f = fixture()
	try {
		f.owner.update(); f.owner.committed(f.token()); const first = f.layers[0]
		f.canDismiss.mockReturnValue(false); first.options.onClose(); expect(f.dismiss).not.toHaveBeenCalled()
		f.canDismiss.mockReturnValue(true); first.options.onClose(); expect(f.dismiss).toHaveBeenCalledTimes(1); expect(first.closed).toBe(false)
		f.state.open = false; f.owner.update(); first.options.onClose(); expect(f.dismiss).toHaveBeenCalledTimes(1); expect(first.closed).toBe(true)
		f.state.open = true; f.owner.update(); expect(f.layers).toHaveLength(2); first.options.onClose(); expect(f.dismiss).toHaveBeenCalledTimes(1)
		f.canDismiss.mockImplementationOnce(() => { f.state.open = false; f.owner.update(); return true }); f.layers[1].options.onClose(); expect(f.dismiss).toHaveBeenCalledTimes(1)
	} finally { f.owner.dispose() }
})
it('waits for attachment and replaces anchors while old commit/outlet/close callbacks stay inert', () => {
	const f = fixture(); f.anchor.window = null
	try {
		f.owner.update(); expect(f.layers).toHaveLength(0); f.anchor.window = f.window; f.notify(); expect(f.layers).toHaveLength(1)
		const first = f.layers[0], oldToken = f.token(); f.state.anchor = { window: f.window, convertRectToView() {} }; f.owner.update(); expect(first.closed).toBe(true); expect(f.layers).toHaveLength(2)
		f.owner.committed(oldToken); first.source.unmount(); first.options.onClose(); expect(f.layers[1].show).not.toHaveBeenCalled(); expect(f.dismiss).not.toHaveBeenCalled()
		f.owner.committed(f.token()); expect(f.layers[1].show).toHaveBeenCalledTimes(1)
	} finally { f.owner.dispose() }
})
it('retires a moved/closed native window once and waits for a close/open cycle to rearm', () => {
	const f = fixture()
	try {
		f.owner.update(); f.anchor.window = {}; f.owner.update(); expect(f.layers[0].closed).toBe(true); expect(f.dismiss).toHaveBeenCalledTimes(1); expect(f.observers.size).toBe(0)
		f.owner.update(); expect(f.layers).toHaveLength(1); f.state.open = false; f.owner.update(); f.state.open = true; f.owner.update(); expect(f.layers).toHaveLength(2)
		f.layers[1].closed = true; f.layers[1].source.unmount(); f.layers[1].options.onClose(); expect(f.dismiss).toHaveBeenCalledTimes(2)
	} finally { f.owner.dispose() }
})
it('releases late layer and observer acquisitions only once after teardown', () => {
	const f = fixture(); f.duringAcquire(() => f.owner.dispose()); f.owner.update()
	expect(f.layers[0].closed).toBe(true); expect(f.layers[0].close).toHaveBeenCalledTimes(1); expect(f.dismiss).not.toHaveBeenCalled(); expect(f.observers.size).toBe(0)
	const g = fixture(); g.center.addObserverForNameObjectQueueUsingBlock = () => { g.owner.dispose(); return {} }; g.owner.update(); expect(g.remove).toHaveBeenCalledTimes(1); expect(g.layers).toHaveLength(0)
})
it('captures observer receiver and makes retained notifications inert after disposal', () => {
	const f = fixture(); f.owner.update(); const notify = [...f.observers.values()][0], remove = f.remove
	f.native.NSNotificationCenter.defaultCenter = {}; f.center.removeObserver = () => { throw Error('replacement') }
	f.owner.dispose(); f.owner.dispose(); notify({ object: f.window }); f.layers[0].options.onClose(); f.owner.committed(f.token())
	expect(remove).toHaveBeenCalledTimes(1); expect(remove.mock.contexts[0]).toBe(f.center); expect(f.layers).toHaveLength(1); expect(f.dismiss).not.toHaveBeenCalled()
})
it('fails explicitly without a source host and cancels a declined native presentation', () => {
	const f = fixture(); f.bridge.showLayer = undefined
	expect(() => f.owner.update()).toThrow('source-owned window-layer'); expect(f.observers.size).toBe(0); f.owner.dispose()
	const g = fixture(); g.bridge.showLayer = () => null; g.owner.update(); expect(g.dismiss).toHaveBeenCalledTimes(1); g.owner.update(); expect(g.dismiss).toHaveBeenCalledTimes(1); g.owner.dispose()
})
it('waits for an initially hidden anchor and retires a presented anchor hidden by its owner', () => {
	const f = fixture(); f.anchor.hiddenOrHasHiddenAncestor = () => 1
	try {
		f.owner.update(); expect(f.layers).toHaveLength(0)
		f.anchor.hiddenOrHasHiddenAncestor = () => 0; f.notify(); f.owner.committed(f.token()); expect(f.owner.isPresent()).toBe(true)
		f.anchor.hidden = true; f.layers[0].options.onClose(); expect(f.dismiss).not.toHaveBeenCalled()
		f.owner.update(); expect(f.layers[0].closed).toBe(true); expect(f.dismiss).toHaveBeenCalledTimes(1)
	} finally { f.owner.dispose() }
})
