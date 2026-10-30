import { expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { compile } from 'octane/compiler'
import { createAppKitLandmarks } from './landmark-state.macos'
function setup() {
	let callback: (event: any) => any = (event) => event, boundary: any, mode = 'ok', dispatch: any = {}, retained = 0, removed = 0, registered = 0
	const window: any = { isKeyWindow: true, firstResponder: null, contentView: null, makeFirstResponder: (view: any) => {
		if (view.reject) {return false}
		window.firstResponder = view; return true
	} }
	const view = (name: string, focusable = false, children: any[] = []): any => {
		const result: any = { name, window, children, hidden: false, enabled: true, acceptsFirstResponder: focusable, canBecomeKeyView: focusable,
			subviews: { get count() { return children.length }, objectAtIndex: (i: number) => children[i] } }
		for (const child of children) {child.superview = result}
		return result
	}
	const aStop = view('a-stop', true), bStop = view('b-stop', true), a = view('a', false, [aStop]), b = view('b', false, [bStop]), root = view('root', false, [a, b])
	window.contentView = root
	const native = { NSEvent: { addLocalMonitorForEventsMatchingMaskHandler: (_mask: number, next: typeof callback) => { registered++; callback = next; return mode === 'nil' ? null : {} }, removeMonitor: () => { removed++ } } }
	const bridge: any = { retainFocusTarget: () => { retained++; return () => { retained-- } }, dispatchKeyboardEvent: () => dispatch }
	const manager = createAppKitLandmarks(() => boundary, () => native, () => bridge)
	const key = (flags = 0, extra = {}) => { const event = { type: 10, keyCode: 97, modifierFlags: flags, window, ...extra }; return { event, result: callback(event) } }
	return { manager, window, root, a, b, aStop, bStop, view, key, bridge, setBoundary: (value: any) => { boundary = value }, setMode: (value: string) => { mode = value }, setDispatch: (value: any) => { dispatch = value }, get retained() { return retained }, get removed() { return removed }, get registered() { return registered } }
}
it('cycles forward/backward in current native order regardless of registration order', () => {
	const s = setup(); s.manager.register(s.b); s.manager.register(s.a)
	expect(s.key().result).toBeNull(); expect(s.window.firstResponder).toBe(s.aStop)
	s.key(); expect(s.window.firstResponder).toBe(s.bStop)
	s.key(); expect(s.window.firstResponder).toBe(s.aStop)
	s.root.children.reverse(); s.key(1 << 17); expect(s.window.firstResponder).toBe(s.bStop)
	s.manager.dispose(); expect(s.retained).toBe(0); expect(s.removed).toBe(1)
})
it('resolves field editors to the innermost region and retains an empty region fallback', () => {
	const s = setup(), nested = s.view('nested', false, [s.view('nested-stop', true)])
	nested.superview = s.a; s.a.children.push(nested)
	s.manager.register(s.a); s.manager.register(nested); s.manager.register(s.b)
	const editor = { delegate: nested.children[0], isFieldEditor: true }; nested.children[0].currentEditor = () => editor
	s.window.firstResponder = editor
	s.key(); expect(s.window.firstResponder).toBe(s.bStop)
	s.a.children.splice(0, s.a.children.length); s.key(); expect(s.window.firstResponder).toBe(s.a)
	s.manager.dispose()
})
it('active containment, hidden/disabled regions and other windows cannot be escaped by cycling', () => {
	const s = setup(); s.manager.register(s.a); s.manager.register(s.b)
	s.setBoundary(s.a); s.window.firstResponder = s.aStop; s.key(); expect(s.window.firstResponder).toBe(s.aStop)
	s.setBoundary(undefined); s.b.hidden = true; s.key(); expect(s.window.firstResponder).toBe(s.aStop)
	s.b.hidden = false; s.b.enabled = false; s.key(); expect(s.window.firstResponder).toBe(s.aStop)
	s.b.enabled = true; s.b.window = {}; s.key(); expect(s.window.firstResponder).toBe(s.aStop)
	s.manager.dispose()
})
it('preserves modified/native/IME keys and focused handler cancellation before navigation', () => {
	const s = setup(); s.manager.register(s.a); s.window.firstResponder = s.aStop
	for (const flags of [1 << 18, 1 << 19, 1 << 20]) { const key = s.key(flags); expect(key.result).toBe(key.event) }
	s.aStop.hasMarkedText = () => true; let key = s.key(); expect(key.result).toBe(key.event)
	s.aStop.hasMarkedText = () => false; s.setDispatch({ defaultPrevented: true }); expect(s.key().result).toBeNull()
	s.setDispatch({ propagationStopped: true }); key = s.key(); expect(key.result).toBe(key.event)
	s.setDispatch({}); key = s.key(0, { keyCode: 48 }); expect(key.result).toBe(key.event)
	expect(s.window.firstResponder).toBe(s.aStop); s.manager.dispose()
})
it('duplicate refs share a monitor; failed registration rolls back and last release blocks stale callbacks', () => {
	const s = setup(); s.setMode('nil'); s.manager.register(s.a); expect(s.retained).toBe(0)
	s.setMode('ok'); const first = s.manager.register(s.a), second = s.manager.register(s.a)
	expect(s.retained).toBe(2); expect(s.registered).toBe(2)
	first(); first(); expect(s.retained).toBe(1); expect(s.removed).toBe(0)
	second(); expect(s.retained).toBe(0); expect(s.removed).toBe(1)
	s.bridge.dispatchKeyboardEvent = () => { throw Error('stale dispatch') }
	const key = s.key(); expect(key.result).toBe(key.event)
	s.manager.dispose(); expect(s.removed).toBe(1)
})
it('native focus rejection can fall through and focus callbacks cannot recursively cycle or use retired roots', () => {
	const s = setup(); const offA = s.manager.register(s.a); s.manager.register(s.b)
	s.aStop.reject = true; s.a.reject = true; s.key(); expect(s.window.firstResponder).toBe(s.bStop)
	s.aStop.reject = false; s.a.reject = false
	s.window.makeFirstResponder = (target: any) => {
		s.window.firstResponder = target
		offA(); expect(s.manager.cycle(s.window, false)).toBe(false)
		return true
	}
	expect(s.key().result).toBeNull(); expect(s.window.firstResponder).toBe(s.aStop)
	s.manager.dispose()
})
for (const hmr of [false, true]) {
	it(`landmark hook compiles for the universal AppKit renderer with HMR ${hmr}`, () => {
		const filename = 'use-landmark.macos.tsrx', source = readFileSync(new URL('./use-landmark.macos.tsrx', import.meta.url), 'utf8')
		compile(source, filename, { hmr, renderer: { id: 'macos', module: '@octane-xplat/macos-renderer', target: 'universal', server: 'unsupported', text: 'host' } })
	})
}
