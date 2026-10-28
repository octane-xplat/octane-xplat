import type { NativeKeyboardEvent } from '@octane-xplat/jsx/intrinsics'

/** Native view subset used to route keyboard events without importing AppKit. */
interface KeyView {
	window?: any
	superview?: KeyView | null
	delegate?: KeyView
	currentEditor?: any
	[key: string]: any
}
interface KeyHandlers {
	onKeyDown?: (event: NativeKeyboardEvent<KeyView>) => void
	onKeyUp?: (event: NativeKeyboardEvent<KeyView>) => void
}

// macOS virtual key positions, independent of the active text layout.
// 110 is HIToolbox kVK_ContextualMenu; AppKit NSMenuFunctionKey is U+F735.
const CODES: Record<number, string> = {
	0: 'KeyA', 1: 'KeyS', 2: 'KeyD', 3: 'KeyF', 4: 'KeyH', 5: 'KeyG', 6: 'KeyZ', 7: 'KeyX',
	8: 'KeyC', 9: 'KeyV', 10: 'IntlBackslash', 11: 'KeyB', 12: 'KeyQ', 13: 'KeyW', 14: 'KeyE',
	15: 'KeyR', 16: 'KeyY', 17: 'KeyT', 18: 'Digit1', 19: 'Digit2', 20: 'Digit3', 21: 'Digit4',
	22: 'Digit6', 23: 'Digit5', 24: 'Equal', 25: 'Digit9', 26: 'Digit7', 27: 'Minus', 28: 'Digit8',
	29: 'Digit0', 30: 'BracketRight', 31: 'KeyO', 32: 'KeyU', 33: 'BracketLeft', 34: 'KeyI',
	35: 'KeyP', 36: 'Enter', 37: 'KeyL', 38: 'KeyJ', 39: 'Quote', 40: 'KeyK', 41: 'Semicolon',
	42: 'Backslash', 43: 'Comma', 44: 'Slash', 45: 'KeyN', 46: 'KeyM', 47: 'Period', 48: 'Tab',
	49: 'Space', 50: 'Backquote', 51: 'Backspace', 53: 'Escape', 64: 'F17', 65: 'NumpadDecimal',
	67: 'NumpadMultiply', 69: 'NumpadAdd', 71: 'NumLock', 75: 'NumpadDivide', 76: 'NumpadEnter',
	78: 'NumpadSubtract', 79: 'F18', 80: 'F19', 81: 'NumpadEqual', 82: 'Numpad0', 83: 'Numpad1',
	84: 'Numpad2', 85: 'Numpad3', 86: 'Numpad4', 87: 'Numpad5', 88: 'Numpad6', 89: 'Numpad7',
	90: 'F20', 91: 'Numpad8', 92: 'Numpad9', 93: 'IntlYen', 94: 'IntlRo', 95: 'NumpadComma', 96: 'F5',
	97: 'F6', 98: 'F7', 99: 'F3', 100: 'F8', 101: 'F9', 102: 'Lang2', 103: 'F11', 104: 'Lang1',
	105: 'F13', 106: 'F16', 107: 'F14', 109: 'F10', 110: 'ContextMenu', 111: 'F12', 113: 'F15', 114: 'Insert',
	115: 'Home', 116: 'PageUp', 117: 'Delete', 118: 'F4', 119: 'End', 120: 'F2', 121: 'PageDown',
	122: 'F1', 123: 'ArrowLeft', 124: 'ArrowRight', 125: 'ArrowDown', 126: 'ArrowUp',
}
const KEYS: Record<number, string> = {
	36: 'Enter', 48: 'Tab', 49: ' ', 51: 'Backspace', 53: 'Escape', 71: 'Clear', 76: 'Enter',
	110: 'ContextMenu', 114: 'Insert', 115: 'Home', 116: 'PageUp', 117: 'Delete', 119: 'End', 121: 'PageDown',
	123: 'ArrowLeft', 124: 'ArrowRight', 125: 'ArrowDown', 126: 'ArrowUp',
}
function marked(view: any): boolean {
	return Boolean(typeof view?.hasMarkedText === 'function' ? view.hasMarkedText() : view?.hasMarkedText)
}
function targetFor(window: any): KeyView | undefined {
	const responder = window?.firstResponder
	const delegate = responder?.delegate
	const editor = typeof delegate?.currentEditor === 'function' ? delegate.currentEditor() : delegate?.currentEditor
	return delegate?.window === window && editor === responder ? delegate : responder
}

/** Native event cancellation is independent from stopping Xplat ancestor handlers. */
export interface AppKitKeyDispatchResult {
	defaultPrevented: boolean
	propagationStopped: boolean
}

/** Shared renderer key routing. A native event is dispatched at most once,
 * including when a FocusScope monitor asks to dispatch before trapping Tab. */
export function createAppKitKeyboardDispatcher(native: () => Record<string, any> = () => globalThis) {
	const bindings = new Map<KeyView, KeyHandlers>()
	const subscriptions = new Map<KeyView, Set<KeyHandlers>>()
	const observers = new Set<(event: { type: number; modifierFlags: number }) => void>()
	const dispatched = new WeakMap<object, AppKitKeyDispatchResult>()
	let token: unknown
	let events: any
	let failed = false
	const available = () => !failed && typeof native().NSEvent?.addLocalMonitorForEventsMatchingMaskHandler === 'function' &&
		typeof native().NSEvent?.removeMonitor === 'function'
	const dispatch = (event: any): AppKitKeyDispatchResult => {
		const previous = dispatched.get(event)
		if (previous) return previous
		const result = { defaultPrevented: false, propagationStopped: false }
		dispatched.set(event, result)
		if (![10, 11].includes(Number(event.type))) return result
		for (const observe of [...observers]) observe({ type: Number(event.type), modifierFlags: Number(event.modifierFlags ?? 0) })
		if ((!bindings.size && !subscriptions.size) || !event.window) return result
		const target = targetFor(event.window)
		if (!target) return result
		const flags = Number(event.modifierFlags ?? 0)
		const altKey = Boolean(flags & (1 << 19)), ctrlKey = Boolean(flags & (1 << 18)), metaKey = Boolean(flags & (1 << 20))
		const shiftKey = Boolean(flags & (1 << 17))
		const keyCode = Number(event.keyCode)
		const code = CODES[keyCode] ?? ''
		const characters = String(event.characters ?? '')
		const unmodified = String(event.charactersIgnoringModifiers ?? '')
		const functionCode = /^F\d+$/.test(code)
		const nonText = KEYS[keyCode] !== undefined || functionCode || /^[\uf700-\uf8ff]$/.test(unmodified)
		const dead = !nonText && !characters && altKey && !ctrlKey && !metaKey && unmodified.length > 0
		const logical = ctrlKey || metaKey ? unmodified || characters : characters || unmodified
		const key = KEYS[keyCode] ?? (functionCode ? code : dead ? 'Dead' :
			(logical === '\uf735' ? 'ContextMenu' : logical || 'Unidentified'))
		const raw = event.window.firstResponder
		const editor = typeof target.currentEditor === 'function' ? target.currentEditor() : target.currentEditor
		const isComposing = dead || marked(raw) || marked(editor)
		const path: KeyView[] = []
		for (let view: KeyView | null | undefined = target; view?.window === event.window; view = view.superview) path.push(view)
		const name = Number(event.type) === 10 ? 'onKeyDown' : 'onKeyUp'
		for (const view of path) {
			const payload: NativeKeyboardEvent<KeyView> = {
				eventName: name === 'onKeyDown' ? 'keyDown' : 'keyUp', object: view, target, currentTarget: view,
				key, code, altKey, ctrlKey, metaKey, shiftKey, repeat: Boolean(event.isARepeat), isComposing,
				get defaultPrevented() { return result.defaultPrevented },
				preventDefault: () => { result.defaultPrevented = true },
				stopPropagation: () => { result.propagationStopped = true },
			}
			bindings.get(view)?.[name]?.(payload)
			const owned = subscriptions.get(view)
			for (const handlers of [...(owned ?? [])]) {
				if (subscriptions.get(view) === owned && owned?.has(handlers)) handlers[name]?.(payload)
			}
			if (result.propagationStopped) break
		}
		return result
	}
	const release = () => {
		if (token != null) {
			const previous = token
			token = undefined
			events.removeMonitor(previous)
		}
	}
	const ensureMonitor = () => {
		if (!bindings.size && !subscriptions.size && !observers.size) { release(); return }
		if (token != null || !available()) return
		try {
			const host = native()
			events = host.NSEvent
			const mask = (host.NSEventMask?.KeyDown ?? 1024) | (host.NSEventMask?.KeyUp ?? 2048)
			token = events.addLocalMonitorForEventsMatchingMaskHandler(mask, (event: any) => dispatch(event).defaultPrevented ? null : event)
			if (token == null) throw new Error('AppKit key monitor unavailable')
		} catch {
			failed = true
		}
	}
	return {
		available,
		dispatch,
		set(view: KeyView, handlers?: KeyHandlers): void {
			if (!handlers?.onKeyDown && !handlers?.onKeyUp) bindings.delete(view)
			else bindings.set(view, handlers)
			ensureMonitor()
		},
		/** Compose owned view listeners without replacing reconciled prop handlers. */
		subscribe(view: KeyView, handlers: KeyHandlers): () => void {
			if (!handlers.onKeyDown && !handlers.onKeyUp) return () => {}
			let owned = subscriptions.get(view)
			if (!owned) { owned = new Set(); subscriptions.set(view, owned) }
			// Each lease owns its own entry, even when a caller reuses one handler object.
			const entry = { ...handlers }
			const bucket = owned
			bucket.add(entry)
			ensureMonitor()
			let active = true
			return () => {
				if (!active) return
				active = false
				bucket.delete(entry)
				if (!bucket.size && subscriptions.get(view) === bucket) subscriptions.delete(view)
				ensureMonitor()
			}
		},
		observe(notify: (event: { type: number; modifierFlags: number }) => void): () => void {
			observers.add(notify)
			ensureMonitor()
			return () => { observers.delete(notify); ensureMonitor() }
		},
		dispose(): void { bindings.clear(); subscriptions.clear(); observers.clear(); release() },
	}
}
