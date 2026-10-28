import type { NativeEvent } from '@octane-xplat/jsx/intrinsics'

interface FocusView {
	window?: any
	superview?: FocusView | null
	delegate?: FocusView
	currentEditor?: any
	[key: string]: any
}
/** Native container boundary notification; focus observation is not cancelable. */
interface FocusBoundaryEvent extends NativeEvent<FocusView> {
	type: 'focus' | 'blur'
	target: FocusView
	currentTarget: FocusView
	relatedTarget: FocusView | null
	preventDefault(): void
	stopPropagation(): void
}
interface FocusHandlers {
	onFocus?: (event: FocusBoundaryEvent) => void
	onBlur?: (event: FocusBoundaryEvent) => void
}
interface Binding {
	view: FocusView
	handlers: FocusHandlers
	window: any
	within: boolean
	target: FocusView | null
}
function focusedView(window: any): FocusView | null {
	const raw = window.firstResponder
	const delegate = raw?.delegate
	const editor = typeof delegate?.currentEditor === 'function' ? delegate.currentEditor() : delegate?.currentEditor
	const target = delegate?.window === window && editor === raw ? delegate : raw
	return target?.window === window ? target : null
}
function contains(root: FocusView, target: FocusView | null): boolean {
	for (let view = target; view; view = view.superview ?? null) if (view === root) return true
	return false
}

/** Per-window first-responder containment, independent of CSS usage and of
 * transient blur/focus callbacks while moving between native descendants. */
export function createAppKitFocusWithinDispatcher(native: () => Record<string, any> = () => globalThis) {
	const bindings = new Map<FocusView, Binding>()
	let targets = new WeakMap<object, FocusView | null>()
	let token: unknown
	let center: any
	let failed = false
	const available = () => !failed && typeof native().NSNotificationCenter?.defaultCenter?.addObserverForNameObjectQueueUsingBlock === 'function' &&
		typeof native().NSNotificationCenter?.defaultCenter?.removeObserver === 'function'
	const synchronize = (window: any) => {
		if (!window) return
		const target = focusedView(window)
		const previous = targets.get(window) ?? null
		targets.set(window, target)
		for (const binding of [...bindings.values()]) {
			if (bindings.get(binding.view) !== binding) continue
			const owner = binding.view.window
			if (owner !== window && binding.window !== window) continue
			const within = owner === window && contains(binding.view, target)
			const last = binding.target
			const changed = binding.within !== within
			binding.window = owner
			binding.within = within
			binding.target = within ? target : null
			if (!changed) continue
			const focused = within ? target : last
			if (!focused) continue
			const type = within ? 'focus' : 'blur'
			binding.handlers[within ? 'onFocus' : 'onBlur']?.({
				type, eventName: type, object: binding.view, currentTarget: binding.view,
				target: focused, relatedTarget: within ? previous : target, preventDefault() {}, stopPropagation() {},
			})
		}
	}
	const release = () => {
		if (token != null) {
			const previous = token
			token = undefined
			center.removeObserver(previous)
		}
		targets = new WeakMap()
	}
	const attach = () => {
		if (token != null || !available()) return
		try {
			const host = native()
			center = host.NSNotificationCenter.defaultCenter
			token = center.addObserverForNameObjectQueueUsingBlock(
				host.NSWindowDidUpdateNotification ?? 'NSWindowDidUpdateNotification', null, null,
				(notification: any) => synchronize(notification.object),
			)
			if (token == null) throw new Error('AppKit focus observation unavailable')
		} catch { failed = true }
	}
	return {
		available,
		synchronize,
		set(view: FocusView, handlers?: FocusHandlers): void {
			if (!handlers?.onFocus && !handlers?.onBlur) {
				bindings.delete(view)
				if (!bindings.size) release()
				return
			}
			const existing = bindings.get(view)
			if (existing) existing.handlers = handlers
			else bindings.set(view, { view, handlers, window: view.window, within: false, target: null })
			attach()
			if (!existing && token != null) {
				// Props are installed during host commit; notify after that commit.
				Promise.resolve().then(() => { if (bindings.has(view) && token != null) synchronize(view.window) })
			}
		},
		dispose(): void { bindings.clear(); release() },
	}
}
