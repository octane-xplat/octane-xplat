import { appKitHost } from './host-bridge'
const flag = (view: any, name: string, fallback = false): boolean => {
	const value = view?.[name]
	return value == null ? fallback : Boolean(typeof value === 'function' ? value.call(view) : value)
}
const eligible = (view: any) => !flag(view, 'hidden') && !flag(view, 'hiddenOrHasHiddenAncestor') && flag(view, 'enabled', true) && flag(view, 'isEnabled', true) && (flag(view, 'isAccessibilityEnabled', true) || flag(view, 'canBecomeKeyView'))
const contains = (root: NSView, target: any): boolean => { for (let view = target; view; view = view.superview) if (view === root) return true; return false }
function children(view: NSView): NSView[] {
	const items = view.subviews as any
	return Array.from({ length: Number(items?.count ?? items?.length ?? 0) }, (_, i) => items.objectAtIndex ? items.objectAtIndex(i) : items[i])
}
function focused(window: NSWindow): any {
	const raw = window.firstResponder as any, delegate = raw?.delegate
	const editor = typeof delegate?.currentEditor === 'function' ? delegate.currentEditor() : delegate?.currentEditor
	return delegate?.window === window && (editor === raw || flag(raw, 'isFieldEditor')) ? delegate : raw
}
/** Window-scoped native region cycling. No OS activation or synthesized input. */
export function createAppKitLandmarks(
	boundary: (window: NSWindow) => NSView | undefined,
	native: () => Record<string, any> = () => globalThis,
	bridge: () => Record<string, any> | undefined = appKitHost,
) {
	type Entry = { release(): void }
	const regions = new Map<NSView, Set<Entry>>()
	let monitor: unknown, events: any, moving = false, handling = false, disposed = false
	const releaseTarget = (entry: Entry) => { try { entry.release() } catch { console.warn('[macos-landmark] focus target cleanup failed') } }
	const removeMonitor = () => { const token = monitor; monitor = undefined; if (token != null) { try { events.removeMonitor(token) } catch { console.warn('[macos-landmark] key monitor cleanup failed') } } }
	const available = () => typeof bridge()?.retainFocusTarget === 'function' && typeof bridge()?.dispatchKeyboardEvent === 'function' && typeof native().NSEvent?.addLocalMonitorForEventsMatchingMaskHandler === 'function' && typeof native().NSEvent?.removeMonitor === 'function'
	const cycle = (window: NSWindow, backward: boolean): boolean => {
		if (disposed || moving || !window || !flag(window, 'isKeyWindow', true)) return false
		const scope = boundary(window), root = scope ?? window.contentView
		if (!root) return false
		const ordered: NSView[] = []
		const visit = (view: NSView) => {
			if (view.window !== window || !eligible(view)) return
			if (regions.has(view)) ordered.push(view)
			for (const child of children(view)) visit(child)
		}
		visit(root)
		if (!ordered.length) return false
		const current = focused(window)
		let index = -1
		for (let i = 0; i < ordered.length; i++) if (contains(ordered[i]!, current)) index = i // Innermost registered ancestor.
		const start = index < 0 ? backward ? ordered.length - 1 : 0 : (index + (backward ? -1 : 1) + ordered.length) % ordered.length
		moving = true
		try {
			for (let offset = 0; offset < ordered.length; offset++) {
				if (boundary(window) !== scope || !flag(window, 'isKeyWindow', true)) return false
				const region = ordered[(start + (backward ? -offset : offset) + ordered.length) % ordered.length]!
				if (!regions.has(region) || region.window !== window || !eligible(region)) continue
				const targets: NSView[] = []
				const collect = (view: NSView) => {
					if (!eligible(view) || view.window !== window || view !== region && regions.has(view)) return
					if (view !== region && flag(view, 'acceptsFirstResponder') && flag(view, 'canBecomeKeyView', true)) targets.push(view)
					for (const child of children(view)) collect(child)
				}
				collect(region)
				for (const target of [...targets, region]) {
					if (!regions.has(region) || target.window !== window || !eligible(target) || boundary(window) !== scope) break
					if (window.makeFirstResponder(target)) {
						if (regions.has(region) && target.window === window && boundary(window) === scope && flag(window, 'isKeyWindow', true) && focused(window) === target) target.scrollRectToVisible?.(target.bounds)
						return true
					}
				}
			}
			return false
		} finally { moving = false }
	}
	const keyDown = (event: any) => {
		if (disposed || moving || handling || !regions.size || Number(event.type) !== 10 || Number(event.keyCode) !== 97 || !event.window) return event
		const flags = Number(event.modifierFlags ?? 0)
		if (flags & ((1 << 18) | (1 << 19) | (1 << 20))) return event
		handling = true
		try {
			const raw = event.window.firstResponder, current = focused(event.window)
			if (flag(raw, 'hasMarkedText') || flag(current, 'hasMarkedText')) return event
			const dispatched = bridge()?.dispatchKeyboardEvent?.(event)
			if (dispatched?.defaultPrevented) return null
			if (dispatched?.propagationStopped) return event
			return cycle(event.window, Boolean(flags & (1 << 17))) ? null : event
		} finally { handling = false }
	}
	return {
		cycle, keyDown,
		register(view: NSView): () => void {
			if (disposed || !available()) return () => {}
			let entry: Entry | undefined
			try {
				const release = bridge()!.retainFocusTarget(view)
				if (typeof release !== 'function') return () => {}
				entry = { release }
				let entries = regions.get(view)
				if (!entries) { entries = new Set(); regions.set(view, entries) }
				entries.add(entry)
				if (monitor == null) {
					events = native().NSEvent
					monitor = events.addLocalMonitorForEventsMatchingMaskHandler(1024, keyDown)
					if (monitor == null) throw Error('AppKit landmark monitor unavailable')
				}
			} catch {
				if (entry) { const entries = regions.get(view); entries?.delete(entry); if (!entries?.size) regions.delete(view); releaseTarget(entry) }
				return () => {}
			}
			if (!entry) return () => {}
			const owner = entry
			let active = true
			return () => {
				if (!active) return
				active = false
				const entries = regions.get(view)
				if (!entries?.delete(owner)) return
				if (!entries.size) regions.delete(view)
				try { releaseTarget(owner) } finally { if (!regions.size) removeMonitor() }
			}
		},
		dispose() {
			if (disposed) return
			disposed = true
			try { removeMonitor() } finally { for (const entries of regions.values()) for (const entry of entries) releaseTarget(entry); regions.clear() }
		},
	}
}
