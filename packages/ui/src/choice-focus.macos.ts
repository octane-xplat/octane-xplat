import type { KeyboardEvent } from './use-keyboard.types'
import { appKitHost } from './host-bridge'

interface Options {
	root(): NSView | null
	views: Map<string, NSView>
	selected(): string | undefined
	orientation(): 'horizontal' | 'both'
	direction(): 'ltr' | 'rtl'
	reveal?(view: NSView): void
	onNavigate?(key: string): void
}
function flag(view: NSView, name: string, fallback = false): boolean {
	const value = (view as unknown as Record<string, unknown>)[name]
	return value == null ? fallback : Boolean(typeof value === 'function' ? value.call(view) : value)
}

/** Registered choices follow native child order. Tabs omit onNavigate for
 * manual activation; radios use it to request selection after native focus. */
export function createAppKitChoiceFocus(options: Options, bridge = appKitHost) {
	const leases = new Map<NSView, () => void>()
	const ordered = () => {
		const byView = new Map([...options.views].map(([key, view]) => [view, key]))
		const items: { key: string; view: NSView }[] = []
		const visit = (view: NSView) => {
			if (flag(view, 'hiddenOrHasHiddenAncestor') || flag(view, 'hidden')) return
			const key = byView.get(view)
			if (key !== undefined) {
				if (flag(view, 'isAccessibilityEnabled', true)) items.push({ key, view })
				return
			}
			const children = view.subviews
			for (let index = 0; index < Number(children?.count ?? 0); index++) visit(children.objectAtIndex(index) as NSView)
		}
		const root = options.root()
		if (root) visit(root)
		return items
	}
	const focused = (items: ReturnType<typeof ordered>) => {
		const window = options.root()?.window
		const view = window?.firstResponder as NSView | undefined
		// Nested controls in endContent own their keys independently.
		return view?.window === window ? items.find((item) => item.view === view) : undefined
	}
	const recalculate = () => options.root()?.window?.recalculateKeyViewLoop()
	const synchronize = () => {
		const items = ordered()
		const current = focused(items) ?? items.find((item) => item.key === options.selected()) ?? items[0]
		const excluded = new Set(bridge()?.keyboardEventsSupported !== false && typeof bridge()?.suppressTabStop === 'function'
			? items.filter((item) => item !== current).map((item) => item.view) : [])
		let changed = false
		for (const [view, release] of leases) {
			if (!excluded.has(view)) { release(); leases.delete(view); changed = true }
		}
		for (const view of excluded) {
			if (leases.has(view)) continue
			const release = bridge()!.suppressTabStop(view)
			if (typeof release !== 'function') throw new Error('AppKit choice focus ownership unavailable')
			leases.set(view, release)
			changed = true
		}
		if (changed) recalculate()
	}
	return {
		synchronize,
		focusedView: () => focused(ordered())?.view,
		orderedKeys: () => ordered().map((item) => item.key),
		/** Programmatic/manual focus never requests a selection change. */
		focus(key?: string, edge: 'first' | 'last' = 'first'): boolean {
			const items = ordered(), window = options.root()?.window
			const target = key !== undefined ? items.find((item) => item.key === key) :
				items.find((item) => item.key === options.selected()) ?? items[edge === 'last' ? items.length - 1 : 0]
			if (!target || !window?.makeFirstResponder(target.view)) return false
			options.reveal?.(target.view)
			synchronize()
			return true
		},
		keyDown(event: KeyboardEvent) {
			if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
			const items = ordered(), current = focused(items), window = options.root()?.window
			if (!current || !window) return
			const index = items.indexOf(current)
			let next: number
			switch (event.key) {
				case 'Home': next = 0; break
				case 'End': next = items.length - 1; break
				case 'ArrowLeft': next = (index + (options.direction() === 'rtl' ? 1 : items.length - 1)) % items.length; break
				case 'ArrowRight': next = (index + (options.direction() === 'rtl' ? items.length - 1 : 1)) % items.length; break
				case 'ArrowUp':
					if (options.orientation() === 'horizontal') return
					next = (index + items.length - 1) % items.length; break
				case 'ArrowDown':
					if (options.orientation() === 'horizontal') return
					next = (index + 1) % items.length; break
				default: return
			}
			if (!window.makeFirstResponder(items[next].view)) return
			event.preventDefault()
			options.reveal?.(items[next].view)
			options.onNavigate?.(items[next].key)
			synchronize()
		},
		dispose() {
			const changed = leases.size > 0
			for (const release of leases.values()) release()
			leases.clear()
			if (changed) recalculate()
		},
	}
}
