import { afterEach, expect, it, vi } from 'vitest'
import { createAppKitKeyboardDispatcher } from '../../macos-renderer/src/keyboard'
const layer = vi.hoisted(() => ({ setup: null as any, dispatch: vi.fn() }))
vi.mock('./layer-stack', () => ({ configureLayerKeys: (setup: any) => { layer.setup = setup }, dispatchLayerKey: layer.dispatch }))
vi.mock('./layer-focus.macos', () => ({ captureAppKitLayerFocus: vi.fn() }))
import './layer-keys.macos'
afterEach(() => { vi.unstubAllGlobals(); layer.dispatch.mockReset() })
function host() {
	const monitors: ((event: any) => any)[] = [], removed: any[] = []
	const events = { addLocalMonitorForEventsMatchingMaskHandler: (_mask: number, fn: (event: any) => any) => { monitors.push(fn); return fn },
		removeMonitor: (token: unknown) => removed.push(token) }
	vi.stubGlobal('NSEvent', events)
	return { events, monitors, removed }
}
it('an owned Escape is handled before layer dismissal and the next unowned Escape still closes the layer', () => {
	const f = host(), trace: string[] = []; let local = true
	vi.stubGlobal('__xplatAppKit', { dispatchKeyboardEvent: () => {
		trace.push('renderer'); const prevent = local; local = false
		return { defaultPrevented: prevent, propagationStopped: prevent }
	} })
	layer.dispatch.mockImplementation((event) => { trace.push('layer'); event.preventDefault() })
	const off = layer.setup(), event = { keyCode: 53, window: {} }
	expect(f.monitors[0](event)).toBeNull(); expect(layer.dispatch).not.toHaveBeenCalled()
	expect(f.monitors[0]({ ...event })).toBeNull(); expect(trace).toEqual(['renderer', 'renderer', 'layer'])
	off(); expect(f.removed).toEqual([f.monitors[0]])
})
it('stopped propagation preserves native default while older bridges, composition and unrelated keys keep the prior paths', () => {
	const f = host(), dispatch = vi.fn(() => ({ defaultPrevented: false, propagationStopped: true }))
	vi.stubGlobal('__xplatAppKit', { dispatchKeyboardEvent: dispatch })
	layer.dispatch.mockImplementation((event) => { if (!event.isComposing) event.preventDefault() })
	const off = layer.setup(), event = { keyCode: 53, window: {} }
	expect(f.monitors[0](event)).toBe(event); expect(layer.dispatch).not.toHaveBeenCalled()
	const enter = { keyCode: 36 }; expect(f.monitors[0](enter)).toBe(enter); expect(dispatch).toHaveBeenCalledOnce()
	vi.stubGlobal('__xplatAppKit', {})
	const marked = { keyCode: 53, window: { firstResponder: { hasMarkedText: () => true } } }
	expect(f.monitors[0](marked)).toBe(marked); expect(layer.dispatch.mock.lastCall?.[0].isComposing).toBe(true)
	expect(f.monitors[0](event)).toBeNull(); off()
})
it.each(['layer-first', 'renderer-first'])('actual dispatcher deduplication preserves local Escape under %s monitor order', (order) => {
	const f = host(), dispatcher = createAppKitKeyboardDispatcher(() => ({ NSEvent: f.events })), handled = vi.fn((event) => { event.preventDefault(); event.stopPropagation() })
	const window: any = {}, view = { window, superview: null }; window.firstResponder = view
	dispatcher.set(view, { onKeyDown: handled })
	vi.stubGlobal('__xplatAppKit', { dispatchKeyboardEvent: dispatcher.dispatch })
	const off = layer.setup(), event = { type: 10, keyCode: 53, characters: '\u001b', window }
	const callbacks = order === 'layer-first' ? [...f.monitors].reverse() : f.monitors
	let current: any = event
	for (const callback of callbacks) { if (current != null) current = callback(current) }
	expect(current).toBeNull(); expect(handled).toHaveBeenCalledOnce(); expect(layer.dispatch).not.toHaveBeenCalled()
	handled.mockImplementationOnce((event) => { event.stopPropagation() })
	const stopped = { ...event }; current = stopped
	for (const callback of callbacks) { if (current != null) current = callback(current) }
	expect(current).toBe(stopped); expect(handled).toHaveBeenCalledTimes(2); expect(layer.dispatch).not.toHaveBeenCalled()
	off(); dispatcher.dispose()
})
