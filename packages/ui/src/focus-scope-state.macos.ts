import { appKitHost } from './host-bridge'
import type { FocusScopeCapabilities } from './props'

/** @internal Live behavior flags read by the native scope owner. */
export interface AppKitFocusScopeOptions {
	contain?: boolean
	autoFocus?: boolean
	restoreFocus?: boolean
}

type Scope = {
	root: NSView
	options: () => AppKitFocusScopeOptions
	owner: NSWindow | null
	previous: any
	last: NSView | null
	initialized: boolean
	order: number
	ancestors: Set<NSView>
	releaseTarget: () => void
	dispose?: () => void
}

function flag(view: any, name: string, fallback = false): boolean {
	const value = view?.[name]
	return value == null ? fallback : Boolean(typeof value === 'function' ? value.call(view) : value)
}
function contains(root: NSView, target: any): boolean {
	for (let view = target; view; view = view.superview) if (view === root) return true
	return false
}
function responder(window: NSWindow): any {
	const current = window.firstResponder as any
	const delegate = current?.delegate
	const editor = typeof delegate?.currentEditor === 'function' ? delegate.currentEditor() : delegate?.currentEditor
	return delegate?.window === window && (editor === current || flag(current, 'isFieldEditor')) ? delegate : current
}
function eligible(view: any): boolean {
	return !flag(view, 'hidden') && !flag(view, 'hiddenOrHasHiddenAncestor') &&
		flag(view, 'enabled', true) && flag(view, 'isEnabled', true) &&
		(flag(view, 'accessibilityIsEnabled', true) || flag(view, 'canBecomeKeyView'))
}
function ancestors(root: NSView): Set<NSView> {
	const result = new Set<NSView>()
	for (let view = root.superview; view; view = view.superview) result.add(view)
	return result
}

/** @internal AppKit focus ownership. Scope ordering uses native ancestry,
 * not effect ordering; unrelated scopes in one window use mount order. */
export function createAppKitFocusScopeManager(
	native: () => Record<string, any> = () => globalThis,
	bridge: () => Record<string, any> | undefined = appKitHost,
) {
	const scopes: Scope[] = []
	let releaseObservers: (() => void) | undefined
	let failed = false
	let moving = false
	let serial = 0
	const capable = () => {
		const host = native()
		const center = host.NSNotificationCenter?.defaultCenter
		return Boolean(bridge()?.retainFocusTarget && host.NSEvent?.addLocalMonitorForEventsMatchingMaskHandler &&
			host.NSEvent?.removeMonitor && center?.addObserverForNameObjectQueueUsingBlock && center?.removeObserver)
	}
	const top = (window: NSWindow): Scope | undefined => {
		let current: Scope | undefined
		for (const scope of scopes) {
			if (scope.root.window !== window || !scope.options().contain || !eligible(scope.root)) continue
			if (!current || !contains(scope.root, current.root)) current = scope
		}
		return current
	}
	const stops = (scope: Scope): NSView[] => {
		const result: NSView[] = []
		const visit = (view: NSView) => {
			if (!eligible(view)) return
			if (view !== scope.root && !scopes.some((item) => item.root === view) &&
				flag(view, 'acceptsFirstResponder') && flag(view, 'canBecomeKeyView', true)) result.push(view)
			const children = view.subviews
			for (let index = 0; index < Number(children?.count ?? 0); index++) visit(children.objectAtIndex(index) as NSView)
		}
		visit(scope.root)
		return result
	}
	const focus = (scope: Scope, target: any): boolean => {
		const window = scope.root.window
		if (!window || !target || target.window !== window || !eligible(target)) return false
		moving = true
		try {
			if (!window.makeFirstResponder(target)) return false
			scope.last = target
			return true
		} finally { moving = false }
	}
	const fallback = (scope: Scope) => {
		const candidates = stops(scope)
		return scope.last && candidates.includes(scope.last) ? scope.last : (candidates[0] ?? scope.root)
	}
	const synchronize = (window?: NSWindow) => {
		if (moving) return
		for (const scope of scopes) {
			const owner = scope.root.window
			if (!owner || (window && owner !== window)) continue
			scope.ancestors = ancestors(scope.root)
			if (scope.owner !== owner) {
				scope.owner = owner
				scope.previous = responder(owner)
				scope.initialized = false
			}
			if (!scope.initialized) {
				if (!flag(owner, 'isKeyWindow', true)) continue
				scope.initialized = true
				const containing = top(owner)
				if (scope.options().autoFocus && (!containing || contains(containing.root, scope.root))) focus(scope, stops(scope)[0] ?? scope.root)
			}
			const current = responder(owner)
			if (contains(scope.root, current)) scope.last = current
		}
		const windows = window ? [window] : [...new Set(scopes.map((scope) => scope.root.window).filter(Boolean))]
		for (const owner of windows) {
			const scope = top(owner)
			if (scope && flag(owner, 'isKeyWindow', true) && !contains(scope.root, responder(owner))) focus(scope, fallback(scope))
		}
	}
	const attach = () => {
		if (releaseObservers || !capable()) return false
		const host = native()
		const events = host.NSEvent
		const center = host.NSNotificationCenter.defaultCenter
		const observers: unknown[] = []
		let monitor: unknown
		const cleanup = () => {
			try { if (monitor != null) events.removeMonitor(monitor) }
			finally { for (const observer of observers) center.removeObserver(observer) }
		}
		try {
			monitor = events.addLocalMonitorForEventsMatchingMaskHandler(host.NSEventMask?.KeyDown ?? 1024, (event: any) => {
				if (Number(event.keyCode) !== 48 || Number(event.modifierFlags) & ((1 << 18) | (1 << 19) | (1 << 20))) return event
				if (!event.window) return event
				const scope = top(event.window)
				if (!scope) return event
				const dispatched = bridge()?.dispatchKeyboardEvent?.(event)
				if (dispatched?.defaultPrevented) return null
				if (dispatched?.propagationStopped) return event
				const raw = event.window.firstResponder
				if (flag(raw, 'hasMarkedText')) return event
				const candidates = stops(scope)
				const index = candidates.indexOf(responder(event.window))
				const backwards = Boolean(Number(event.modifierFlags) & (1 << 17))
				const next = index < 0 ? (backwards ? candidates.length - 1 : 0) :
					(index + (backwards ? candidates.length - 1 : 1)) % candidates.length
				return focus(scope, candidates[next] ?? scope.root) ? null : event
			})
			if (monitor == null) throw new Error('AppKit key observation unavailable')
			for (const name of ['NSWindowDidUpdateNotification', 'NSWindowDidBecomeKeyNotification']) {
				const observer = center.addObserverForNameObjectQueueUsingBlock(host[name] ?? name, null, null, (notification: any) => synchronize(notification.object))
				if (observer == null) throw new Error('AppKit window observation unavailable')
				observers.push(observer)
			}
			releaseObservers = cleanup
			failed = false
			return true
		} catch {
			try { cleanup() } finally { failed = true }
			return false
		}
	}
	return {
		capabilities(): FocusScopeCapabilities {
			const supported = !failed && capable()
			return { contain: supported, autoFocus: supported, restoreFocus: supported, nestedScopes: supported }
		},
		bind(root: NSView, options: () => AppKitFocusScopeOptions): () => void {
			if (!attach()) return () => {}
			let releaseTarget: () => void
			try {
				releaseTarget = bridge()!.retainFocusTarget(root)
				if (typeof releaseTarget !== 'function') throw new Error('AppKit focus target unavailable')
			} catch {
				failed = true
				if (!scopes.length) {
					const cleanup = releaseObservers
					releaseObservers = undefined
					cleanup?.()
				}
				return () => {}
			}
			const scope: Scope = {
				root, options, owner: root.window ?? null, previous: root.window ? responder(root.window) : null,
				last: null, initialized: false, releaseTarget,
				order: ++serial, ancestors: ancestors(root),
			}
			scopes.push(scope)
			// Register all nested scopes before deciding which owner may autofocus.
			Promise.resolve().then(() => { if (scopes.includes(scope)) synchronize(root.window) })
			let active = true
			const dispose = () => {
				if (!active) return
				active = false
				scopes.splice(scopes.indexOf(scope), 1)
				try {
					const owner = scope.owner
					const parent = owner ? top(owner) : undefined
					const newerIndependent = parent && parent.order > scope.order && !scope.ancestors.has(parent.root)
					if (scope.initialized && options().restoreFocus && owner &&
						!newerIndependent) {
						const previous = scope.previous
						if (previous?.window === owner && eligible(previous) && (!parent || contains(parent.root, previous))) owner.makeFirstResponder(previous)
						else if (parent) focus(parent, fallback(parent))
					}
				} finally {
					scope.releaseTarget()
					if (!scopes.length) {
						const cleanup = releaseObservers
						releaseObservers = undefined
						cleanup?.()
					}
				}
			}
			scope.dispose = dispose
			return dispose
		},
		dispose(): void {
			for (const scope of [...scopes].reverse()) scope.dispose?.()
		},
	}
}
