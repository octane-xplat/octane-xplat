import type { NativeKeyboardEvent } from '@octane-xplat/jsx/intrinsics'
import type { Key } from './list-data'
import { appKitHost } from './host-bridge'

export interface AppKitGridRow {
	key: Key
	view: NSView
}
interface GridOptions {
	root(): NSView | null
	rows(): AppKitGridRow[]
	columns(): number | undefined
	tabMode(): boolean
	press(row: AppKitGridRow, event: NativeKeyboardEvent<object>, toggleOnly: boolean): void
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
	const raw = window.firstResponder as any
	const delegate = raw?.delegate
	const editor = typeof delegate?.currentEditor === 'function' ? delegate.currentEditor() : delegate?.currentEditor
	return delegate?.window === window && editor === raw ? delegate : raw
}
function enabled(view: NSView): boolean {
	return !flag(view, 'hiddenOrHasHiddenAncestor') && !flag(view, 'hidden') &&
		flag(view, 'enabled', true) && flag(view, 'isEnabled', true) && flag(view, 'accessibilityIsEnabled', true)
}
function columns(rows: AppKitGridRow[], fixed?: number): number {
	if (fixed != null && Number.isFinite(fixed) && fixed >= 1) return Math.max(1, Math.floor(fixed))
	if (!rows.length) return 1
	const top = Number(rows[0].view.frame.origin.y)
	let count = 0
	for (const row of rows) {
		if (Math.abs(Number(row.view.frame.origin.y) - top) > 1) break
		count++
	}
	return Math.max(1, count)
}

/** Internal row registry for the AppKit GridList component. The public
 * selector-based useGridList hook remains separate. No OS events are synthesized. */
export function createAppKitGridNavigation(
	options: GridOptions,
	native: () => Record<string, any> = () => globalThis,
	bridge: () => Record<string, any> | undefined = appKitHost,
) {
	const suppressed = new Map<NSView, () => void>()
	let current: NSView | null = null
	let observer: unknown
	let center: any
	let failed = false
	let active = false
	const available = () => !failed && Boolean(bridge()?.keyboardEventsSupported) &&
		typeof bridge()?.suppressTabStop === 'function' &&
		typeof native().NSNotificationCenter?.defaultCenter?.addObserverForNameObjectQueueUsingBlock === 'function' &&
		typeof native().NSNotificationCenter?.defaultCenter?.removeObserver === 'function'
	const rows = () => {
		const root = options.root()
		return root?.window ? options.rows().filter((row) => row.view.window === root.window && contains(root, row.view)) : []
	}
	const releaseAll = () => {
		for (const release of suppressed.values()) release()
		suppressed.clear()
	}
	const synchronize = () => {
		if (!active) return
		const root = options.root()
		const all = rows()
		const usable = all.filter((row) => enabled(row.view))
		const target = root?.window ? responder(root.window) : null
		const focused = usable.find((row) => contains(row.view, target))
		current = focused?.view ?? (usable.some((row) => row.view === current) ? current : usable[0]?.view ?? null)
		const excluded = new Set(options.tabMode() ? [] : all.filter((row) => row.view !== current).map((row) => row.view))
		let changed = false
		for (const [view, release] of suppressed) {
			if (!excluded.has(view)) { release(); suppressed.delete(view); changed = true }
		}
		for (const view of excluded) {
			if (!suppressed.has(view)) {
				const release = bridge()!.suppressTabStop(view)
				if (typeof release !== 'function') throw new Error('AppKit Tab-stop ownership unavailable')
				suppressed.set(view, release)
				changed = true
			}
		}
		if (changed) root?.window?.recalculateKeyViewLoop()
	}
	const dispose = () => {
		active = false
		const token = observer
		observer = undefined
		try {
			if (token != null) center.removeObserver(token)
		} finally {
			const window = options.root()?.window
			const changed = suppressed.size > 0
			releaseAll()
			current = null
			if (changed) window?.recalculateKeyViewLoop()
		}
	}
	return {
		available,
		synchronize,
		start(): () => void {
			if (active || !available()) return () => {}
			try {
				const host = native()
				center = host.NSNotificationCenter.defaultCenter
				observer = center.addObserverForNameObjectQueueUsingBlock(
					host.NSWindowDidUpdateNotification ?? 'NSWindowDidUpdateNotification', null, null,
					(notification: any) => { if (notification.object === options.root()?.window) synchronize() },
				)
				if (observer == null) throw new Error('AppKit grid focus observation unavailable')
				active = true
				synchronize()
			} catch {
				failed = true
				dispose()
			}
			return dispose
		},
		focusRow(key: Key): boolean {
			if (!active) return false
			const root = options.root()
			const row = rows().find((row) => row.key === key && enabled(row.view))
			if (!root?.window || !row || !root.window.makeFirstResponder(row.view)) return false
			row.view.scrollRectToVisible(row.view.bounds)
			current = row.view
			synchronize()
			return true
		},
		onKeyDown(event: NativeKeyboardEvent<object>): void {
			if (!active || event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
			synchronize()
			const root = options.root()
			if (!root?.window) return
			const all = rows().filter((row) => !flag(row.view, 'hiddenOrHasHiddenAncestor') && !flag(row.view, 'hidden'))
			// Interactive descendants keep their own editing/activation keys.
			const index = all.findIndex((row) => row.view === event.target && enabled(row.view))
			if (index < 0) return
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault()
				event.stopPropagation()
				options.press(all[index], event, event.key === ' ')
				return
			}
			if (options.tabMode()) return
			const rtl = Number(root.userInterfaceLayoutDirection) === 1
			const count = columns(all, options.columns())
			const delta = event.key === 'ArrowRight' ? (rtl ? -1 : 1) : event.key === 'ArrowLeft' ? (rtl ? 1 : -1) :
				event.key === 'ArrowDown' ? count : event.key === 'ArrowUp' ? -count : 0
			let next: AppKitGridRow | undefined
			if (event.key === 'Home') next = all.find((row) => enabled(row.view))
			else if (event.key === 'End') next = [...all].reverse().find((row) => enabled(row.view))
			else if (delta) {
				for (let step = 1; step <= all.length; step++) {
					const row = all[((index + step * delta) % all.length + all.length) % all.length]
					if (enabled(row.view)) { next = row; break }
				}
			}
			if (next && root.window.makeFirstResponder(next.view)) {
				next.view.scrollRectToVisible(next.view.bounds)
				current = next.view
				synchronize()
				event.preventDefault()
				event.stopPropagation()
			}
		},
		dispose,
	}
}
