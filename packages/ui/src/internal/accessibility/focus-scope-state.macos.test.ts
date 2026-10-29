// Native bridge model only; this does not establish OS focus/key delivery.
import { describe, expect, it } from 'vitest'
import { createAppKitFocusScopeManager } from './focus-scope-state.macos'

function fixture() {
	let monitor!: (event: any) => any
	const monitors: ((event: any) => any)[] = []
	const observationHistory: { name: string; callback: (notification: any) => void }[] = []
	const observers = new Map<string, (notification: any) => void>()
	const removed: string[] = []
	const retained = new Set<any>()
	const native = {
		NSEvent: {
			addLocalMonitorForEventsMatchingMaskHandler: (_mask: number, callback: typeof monitor) => { monitor = callback; monitors.push(callback); return monitors.length === 1 ? 'key' : `key-${monitors.length}` },
			removeMonitor: (token: string) => removed.push(token),
		},
		NSNotificationCenter: { defaultCenter: {
			addObserverForNameObjectQueueUsingBlock: (name: string, _object: unknown, _queue: unknown, callback: (notification: any) => void) => {
				observers.set(name, callback)
				observationHistory.push({ name, callback })
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
	return { manager, window, view, trigger, key, update, removed, retained, observers, monitors, observationHistory, native, bridge }
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

it('exposes only the current eligible containment root to composed native navigation', () => {
	const s = fixture(), inner = s.view('inner'), outer = s.view('outer', false, [inner])
	const offOuter = s.manager.bind(outer, () => ({ contain: true }))
	const offInner = s.manager.bind(inner, () => ({ contain: true }))
	expect(s.manager.boundary(s.window)).toBe(inner)
	inner.hidden = true; expect(s.manager.boundary(s.window)).toBe(outer)
	inner.hidden = false; offInner(); expect(s.manager.boundary(s.window)).toBe(outer)
	offOuter(); expect(s.manager.boundary(s.window)).toBeUndefined()
})

it('shares one observation owner across nested scopes until the last scope releases', async () => {
	const env = fixture(), first = env.view('outer field', true), nested = env.view('nested field', true)
	const inner = env.view('inner', false, [nested]), outer = env.view('outer', false, [first, inner])
	const flags = () => ({ contain: true, autoFocus: true, restoreFocus: true })
	const closeOuter = env.manager.bind(outer, flags), closeInner = env.manager.bind(inner, flags)
	await Promise.resolve()
	expect(env.monitors).toHaveLength(1); expect(env.observationHistory).toHaveLength(2); expect(env.retained.size).toBe(2)
	expect(env.manager.boundary(env.window)).toBe(inner); expect(env.window.firstResponder).toBe(nested)
	closeInner(); closeInner()
	expect(env.manager.boundary(env.window)).toBe(outer); expect(env.window.firstResponder).toBe(first)
	expect(env.retained.size).toBe(1); expect(env.removed).toHaveLength(0); expect(env.observers.size).toBe(2)
	closeOuter(); closeOuter(); expect(env.retained.size).toBe(0); expect(env.removed).toHaveLength(3)
})

it('shares observers across windows while navigation and release stay window-owned', async () => {
	const env = fixture(), a = env.view('first window field', true), b = env.view('second window field', true), c = env.view('second window last', true)
	const other: any = { isKeyWindow: true, firstResponder: null, makeFirstResponder(target: any) { if (target.window !== other) return false; other.firstResponder = target; return true } }
	const second = env.view('second scope', false, [b, c]); second.window = b.window = c.window = other
	const closeFirst = env.manager.bind(env.view('first scope', false, [a]), () => ({ contain: true, autoFocus: true }))
	await Promise.resolve(); env.window.isKeyWindow = false
	const closeSecond = env.manager.bind(second, () => ({ contain: true, autoFocus: true }))
	await Promise.resolve()
	expect(env.window.firstResponder).toBe(a); expect(other.firstResponder).toBe(b); expect(env.monitors).toHaveLength(1)
	expect(env.key(0, other).result).toBeNull(); expect(other.firstResponder).toBe(c); expect(env.window.firstResponder).toBe(a)
	closeFirst(); expect(env.removed).toHaveLength(0); expect(env.observers.size).toBe(2)
	env.key(0, other); expect(other.firstResponder).toBe(b)
	closeSecond(); expect(env.observers.size).toBe(0); expect(env.removed).toHaveLength(3)
})

it('retires old monitor and notification closures before a later observation owner starts', async () => {
	const env = fixture(), closeFirst = env.manager.bind(env.view('first scope', false, [env.view('old field', true)]), () => ({ contain: true }))
	await Promise.resolve()
	const staleKey = env.monitors[0], staleUpdate = env.observationHistory[0].callback
	closeFirst(); env.window.firstResponder = env.trigger
	const a = env.view('new first', true), b = env.view('new last', true)
	const closeSecond = env.manager.bind(env.view('new scope', false, [a, b]), () => ({ contain: true, autoFocus: true }))
	const event = { keyCode: 48, modifierFlags: 0, window: env.window }
	expect(staleKey(event)).toBe(event); staleUpdate({ object: env.window })
	expect(env.window.firstResponder).toBe(env.trigger)
	await Promise.resolve(); expect(env.window.firstResponder).toBe(a)
	expect(staleKey(event)).toBe(event); expect(env.window.firstResponder).toBe(a)
	env.key(); expect(env.window.firstResponder).toBe(b); closeSecond()
})

it('carries the return path forward when an older scope detaches before its replacement closes', async () => {
	const env = fixture(), a = env.view('first field', true), b = env.view('replacement field', true)
	const first = env.view('first scope', false, [a]), second = env.view('replacement scope', false, [b])
	const flags = () => ({ contain: true, autoFocus: true, restoreFocus: true })
	const closeFirst = env.manager.bind(first, flags); await Promise.resolve()
	expect(env.window.firstResponder).toBe(a)
	const closeSecond = env.manager.bind(second, flags); await Promise.resolve()
	expect(env.window.firstResponder).toBe(b)
	// Native child/parent links may already be gone when effect cleanup runs.
	first.window = a.window = null; a.superview = null
	closeFirst(); expect(env.window.firstResponder).toBe(b)
	closeSecond(); expect(env.window.firstResponder).toBe(env.trigger)
	expect(env.retained.size).toBe(0); expect(env.removed).toHaveLength(3)
})

it('does not navigate a scope closed, disabled or superseded by its attached key handler', async () => {
	for (const action of ['close', 'disable', 'replace']) {
		const env = fixture(), a = env.view('first', true), b = env.view('last', true), next = env.view('replacement field', true)
		const options = { contain: true }, close = env.manager.bind(env.view('scope', false, [a, b]), () => options)
		await Promise.resolve(); expect(env.window.firstResponder).toBe(a)
		env.bridge.dispatchKeyboardEvent = () => {
			if (action === 'close') close()
			else if (action === 'disable') options.contain = false
			else env.manager.bind(env.view('replacement scope', false, [next]), () => ({ contain: true, autoFocus: true }))
		}
		const event = env.key(); expect(event.result).toBe(event.event); expect(env.window.firstResponder).toBe(a)
		await Promise.resolve(); if (action === 'replace') expect(env.window.firstResponder).toBe(next)
		env.manager.dispose()
	}
})

it('attempts all cleanup once after target/monitor/notification removal failure and blocks stale delivery', async () => {
	const env = fixture(), retain = env.bridge.retainFocusTarget, remove = env.native.NSNotificationCenter.defaultCenter.removeObserver
	env.bridge.retainFocusTarget = (view: any) => { const release = retain(view); return () => { release(); throw Error('private release detail') } }
	env.native.NSEvent.removeMonitor = (token) => { env.removed.push(token); throw Error('private monitor detail') }
	env.native.NSNotificationCenter.defaultCenter.removeObserver = (token) => { remove(token); if (token === 'NSWindowDidUpdateNotification') throw Error('private observer detail') }
	const root = env.view('scope', false, [env.view('field', true)]), close = env.manager.bind(root, () => ({ contain: true }))
	await Promise.resolve(); const staleKey = env.monitors[0], staleUpdate = env.observationHistory[0].callback
	expect(() => close()).not.toThrow(); expect(() => close()).not.toThrow()
	expect(env.removed).toHaveLength(3); expect(env.retained.size).toBe(0); expect(env.observers.size).toBe(0)
	env.window.firstResponder = env.trigger; const event = { keyCode: 48, modifierFlags: 0, window: env.window }
	expect(staleKey(event)).toBe(event); staleUpdate({ object: env.window }); expect(env.window.firstResponder).toBe(env.trigger)
})

it('restoration failure still releases every scope and its shared observers during manager teardown', async () => {
	const env = fixture(), flags = () => ({ contain: true, autoFocus: true, restoreFocus: true })
	env.manager.bind(env.view('first scope', false, [env.view('first', true)]), flags)
	env.manager.bind(env.view('second scope', false, [env.view('second', true)]), flags)
	await Promise.resolve(); env.window.makeFirstResponder = () => { throw Error('private responder detail') }
	expect(() => env.manager.dispose()).not.toThrow(); expect(() => env.manager.dispose()).not.toThrow()
	expect(env.retained.size).toBe(0); expect(env.observers.size).toBe(0); expect(env.removed).toHaveLength(3)
	expect(env.manager.boundary(env.window)).toBeUndefined()
})

it('rejects noncallable bridge hooks and recovers target registration while preserving active owners', async () => {
	const env = fixture(), retain = env.bridge.retainFocusTarget
	env.bridge.retainFocusTarget = true
	expect(env.manager.capabilities().contain).toBe(false)
	env.manager.bind(env.view('unavailable'), () => ({ contain: true }))(); expect(env.monitors).toHaveLength(0)
	env.bridge.retainFocusTarget = retain
	const first = env.view('first', false, [env.view('first field', true)]), second = env.view('second', false, [env.view('second field', true)])
	const closeFirst = env.manager.bind(first, () => ({ contain: true }))
	env.bridge.retainFocusTarget = () => { throw Error('private target detail') }
	const unavailable = env.manager.bind(second, () => ({ contain: true })); unavailable()
	expect(env.manager.boundary(env.window)).toBe(first); expect(env.observers.size).toBe(2); expect(env.retained.size).toBe(1)
	expect(env.manager.capabilities().contain).toBe(false)
	env.bridge.retainFocusTarget = retain
	const closeSecond = env.manager.bind(second, () => ({ contain: true })); await Promise.resolve()
	expect(env.manager.capabilities().contain).toBe(true); expect(env.manager.boundary(env.window)).toBe(second); expect(env.monitors).toHaveLength(1)
	closeFirst(); closeSecond(); expect(env.removed).toHaveLength(3)
})
