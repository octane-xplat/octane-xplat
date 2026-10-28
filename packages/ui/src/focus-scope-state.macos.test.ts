// Native bridge model only; this does not establish OS focus/key delivery.
import { describe, expect, it } from 'vitest'
import { createAppKitFocusScopeManager } from './focus-scope-state.macos'

function fixture() {
	let monitor!: (event: any) => any
	const observers = new Map<string, (notification: any) => void>()
	const removed: string[] = []
	const retained = new Set<any>()
	const native = {
		NSEvent: {
			addLocalMonitorForEventsMatchingMaskHandler: (_mask: number, callback: typeof monitor) => { monitor = callback; return 'key' },
			removeMonitor: (token: string) => removed.push(token),
		},
		NSNotificationCenter: { defaultCenter: {
			addObserverForNameObjectQueueUsingBlock: (name: string, _object: unknown, _queue: unknown, callback: (notification: any) => void) => {
				observers.set(name, callback)
				return name
			},
			removeObserver: (token: string) => { observers.delete(token); removed.push(token) },
		} },
	}
	const bridge: Record<string, any> = {
		retainFocusTarget: (view: any) => { retained.add(view); return () => { retained.delete(view) } },
	}
	const manager = createAppKitFocusScopeManager(() => native, () => bridge)
	const window: any = { isKeyWindow: true, firstResponder: null, reject: false }
	window.makeFirstResponder = (target: any) => {
		if (window.reject || target.window !== window) return false
		window.firstResponder = target
		return true
	}
	function view(name: string, focusable = false, children: any[] = []): any {
		const node: any = {
			name, window, superview: null, hidden: false, enabled: true, children,
			acceptsFirstResponder: focusable, canBecomeKeyView: focusable,
			subviews: { get count() { return children.length }, objectAtIndex: (index: number) => children[index] },
		}
		for (const child of children) child.superview = node
		return node
	}
	const trigger = view('trigger', true)
	window.firstResponder = trigger
	const key = (flags = 0, owner = window, code = 48) => {
		const event = { keyCode: code, modifierFlags: flags, window: owner }
		return { event, result: monitor(event) }
	}
	const update = (owner = window) => observers.get('NSWindowDidUpdateNotification')?.({ object: owner })
	return { manager, window, view, trigger, key, update, removed, retained, observers, native, bridge }
}

describe('AppKit focus scope manager', () => {
	it('autofocuses, traverses enabled native views, contains outside focus and restores', async () => {
		const env = fixture()
		const a = env.view('a', true), disabled = env.view('disabled', true), b = env.view('b', true)
		disabled.enabled = false
		const root = env.view('scope', false, [a, disabled, b])
		const off = env.manager.bind(root, () => ({ contain: true, autoFocus: true, restoreFocus: true }))
		await Promise.resolve()
		expect(env.window.firstResponder).toBe(a)
		expect(env.key().result).toBeNull()
		expect(env.window.firstResponder).toBe(b)
		env.key()
		expect(env.window.firstResponder).toBe(a)
		env.key(1 << 17)
		expect(env.window.firstResponder).toBe(b)
		env.window.firstResponder = env.trigger
		env.update()
		expect(env.window.firstResponder).toBe(b)
		off()
		expect(env.window.firstResponder).toBe(env.trigger)
		expect(env.retained.size).toBe(0)
		expect(env.observers.size).toBe(0)
		expect(env.removed).toHaveLength(3)
	})

	it('keeps an empty scope focused and restores after native detachment', async () => {
		const env = fixture()
		const root = env.view('empty')
		const off = env.manager.bind(root, () => ({ contain: true, autoFocus: true, restoreFocus: true }))
		await Promise.resolve()
		expect(env.window.firstResponder).toBe(root)
		expect(env.key().result).toBeNull()
		root.window = null
		off()
		expect(env.window.firstResponder).toBe(env.trigger)
	})

	it('chooses a nested containing scope regardless of effect order', async () => {
		const env = fixture()
		const outerStop = env.view('outer', true), innerStop = env.view('inner', true)
		const inner = env.view('inner-scope', false, [innerStop])
		const outer = env.view('outer-scope', false, [outerStop, inner])
		const flags = () => ({ contain: true, autoFocus: true, restoreFocus: true })
		const closeInner = env.manager.bind(inner, flags)
		const closeOuter = env.manager.bind(outer, flags)
		await Promise.resolve()
		expect(env.window.firstResponder).toBe(innerStop)
		env.key()
		expect(env.window.firstResponder).toBe(innerStop)
		outer.children.pop()
		inner.superview = null
		inner.window = null
		innerStop.superview = null
		innerStop.window = null
		closeInner()
		expect(env.window.firstResponder).toBe(outerStop)
		closeOuter()
		expect(env.window.firstResponder).toBe(env.trigger)
	})

	it('maps field editors, preserves IME/modifiers and leaves other windows alone', async () => {
		const env = fixture()
		const field = env.view('field', true), next = env.view('next', true)
		const root = env.view('scope', false, [field, next])
		const off = env.manager.bind(root, () => ({ contain: true }))
		await Promise.resolve()
		const editor = { delegate: field, isFieldEditor: true, hasMarkedText: true }
		field.currentEditor = () => editor
		env.window.firstResponder = editor
		expect(env.key().result).not.toBeNull()
		editor.hasMarkedText = false
		expect(env.key().result).toBeNull()
		expect(env.window.firstResponder).toBe(next)
		for (const mask of [1 << 18, 1 << 19, 1 << 20]) expect(env.key(mask).result).not.toBeNull()
		expect(env.key(0, { firstResponder: {} }).result).not.toBeNull()
		expect(env.key(0, null).result).not.toBeNull()
		env.window.reject = true
		expect(env.key().result).not.toBeNull()
		off()
	})

	it('reads live flags and view changes without restarting a scope', async () => {
		const env = fixture()
		const a = env.view('a', true), b = env.view('b', true)
		const root = env.view('scope', false, [a, b])
		const options = { contain: true, restoreFocus: true }
		const off = env.manager.bind(root, () => options)
		await Promise.resolve()
		a.hidden = true
		env.key()
		expect(env.window.firstResponder).toBe(b)
		options.contain = false
		expect(env.key().result).not.toBeNull()
		off()
	})

	it('does not let an older sibling restore over a newer active scope', async () => {
		const env = fixture()
		const a = env.view('a', true), b = env.view('b', true)
		const flags = () => ({ contain: true, autoFocus: true, restoreFocus: true })
		const closeA = env.manager.bind(env.view('first', false, [a]), flags)
		await Promise.resolve()
		const closeB = env.manager.bind(env.view('second', false, [b]), flags)
		await Promise.resolve()
		closeA()
		expect(env.window.firstResponder).toBe(b)
		closeB()
	})

	it('defers initialization until the scope has a key window and reports missing bridges', async () => {
		const env = fixture()
		const root = env.view('pending', false, [env.view('field', true)])
		root.window = null
		const off = env.manager.bind(root, () => ({ autoFocus: true }))
		await Promise.resolve()
		expect(env.window.firstResponder).toBe(env.trigger)
		root.window = env.window
		env.update()
		expect(env.window.firstResponder).toBe(root.children[0])
		off()
		const missing = createAppKitFocusScopeManager(() => ({}), () => undefined)
		expect(missing.capabilities()).toEqual({ contain: false, autoFocus: false, restoreFocus: false, nestedScopes: false })
	})

	it('releases partial observation and reports failed registration as unavailable', () => {
		const env = fixture()
		const center = env.native.NSNotificationCenter.defaultCenter
		const observe = center.addObserverForNameObjectQueueUsingBlock
		let registrations = 0
		center.addObserverForNameObjectQueueUsingBlock = (...args) => {
			if (++registrations === 2) throw new Error('registration failed')
			return observe(...args)
		}
		const off = env.manager.bind(env.view('scope'), () => ({ contain: true }))
		expect(env.manager.capabilities().contain).toBe(false)
		expect(env.retained.size).toBe(0)
		expect(env.observers.size).toBe(0)
		expect(env.removed).toHaveLength(2)
		off()
	})

	it('dispatches attached keys before Tab containment and respects cancellation/propagation', async () => {
		const env = fixture()
		const a = env.view('a', true), b = env.view('b', true)
		const off = env.manager.bind(env.view('scope', false, [a, b]), () => ({ contain: true }))
		await Promise.resolve()
		env.bridge.dispatchKeyboardEvent = () => ({ defaultPrevented: true, propagationStopped: false })
		expect(env.key().result).toBeNull()
		expect(env.window.firstResponder).toBe(a)
		env.bridge.dispatchKeyboardEvent = () => ({ defaultPrevented: false, propagationStopped: true })
		expect(env.key().result).not.toBeNull()
		expect(env.window.firstResponder).toBe(a)
		env.bridge.dispatchKeyboardEvent = () => ({ defaultPrevented: false, propagationStopped: false })
		expect(env.key().result).toBeNull()
		expect(env.window.firstResponder).toBe(b)
		off()
	})
})


it('retains native disabled-but-focusable views while excluding ordinary disabled controls', async () => {
	const env = fixture()
	const disabledCard = env.view('disabled card', true)
	disabledCard.isAccessibilityEnabled = false
	const disabledField = env.view('disabled field', true)
	disabledField.enabled = false
	const disabledAction = env.view('disabled action', true)
	disabledAction.isAccessibilityEnabled = false
	disabledAction.canBecomeKeyView = false
	const next = env.view('next', true)
	const root = env.view('scope', false, [disabledCard, disabledField, disabledAction, next])
	const off = env.manager.bind(root, () => ({ contain: true, autoFocus: true }))
	try {
		await Promise.resolve()
		expect(env.window.firstResponder).toBe(disabledCard)
		env.key(); expect(env.window.firstResponder).toBe(next)
		env.key(); expect(env.window.firstResponder).toBe(disabledCard)
	} finally { off() }
})
