import type { NativeKeyboardEvent } from '@octane-xplat/jsx/intrinsics'
import type { ISOTimeString } from '../../props'
import { appKitHost } from '../../internal/platform/host-bridge'
import { createAppKitChoiceFocus } from './choice-focus.macos'
import { timeOptionIndex } from './date-keyboard'
import type { NSView, NSWindow } from '@octane-xplat/platform/macos'

export interface AppKitTimeOption { time: ISOTimeString; label: string }
/** Native option focus only. Parent date/time validation and accepted closure stay outside. */
export function createAppKitTimeListFocus(options: {
	rows(): readonly AppKitTimeOption[]
	seed(): ISOTimeString | undefined
	blocked(): boolean
	choose(time: ISOTimeString): void
	tab(backward: boolean): boolean
	highlight(time: ISOTimeString): void
}, bridge = appKitHost, native: () => Record<string, any> = () => globalThis) {
	const views = new Map<ISOTimeString, NSView>()
	let root: NSView | null = null, owner: NSWindow | null = null, pending = true, queued = false, refreshing = false
	let lastFocused: NSView | null = null
	let highlighted: string | undefined, stopObserver: (() => void) | undefined
	const seed = () => {
		const rows = options.rows(), value = options.seed(), index = value ? rows.findIndex((row) => row.time >= value) : 0
		return rows[index < 0 ? rows.length - 1 : index]?.time
	}
	const navigation = createAppKitChoiceFocus({ root: () => root, views, selected: seed,
		orientation: () => 'both', direction: () => 'ltr', reveal: (view) => { view.scrollRectToVisible(view.bounds) },
	}, bridge)
	const keys = () => navigation.orderedKeys().filter((key): key is ISOTimeString => options.rows().some((row) => row.time === key))
	const publish = (time: ISOTimeString) => { if (root && highlighted !== time) { highlighted = time; options.highlight(time) } }
	const focus = (time: ISOTimeString) => { if (keys().includes(time) && navigation.focus(time)) { lastFocused = views.get(time) ?? null; publish(time); return true } return false }
	const refresh = () => {
		const window = root?.window
		const flag = (name: string) => { const value = root ? Reflect.get(root, name) : false; return Boolean(typeof value === 'function' ? value.call(root) : value) }
		if (!window || flag('hidden') || flag('hiddenOrHasHiddenAncestor') || options.blocked() || !bridge()?.keyboardEventsSupported) {
			navigation.dispose(); owner = null; pending = true; return
		}
		if (owner !== window) { navigation.dispose(); owner = window; pending = true }
		navigation.synchronize()
		const active = [...views].find(([, view]) => view === window.firstResponder)?.[0]
		if (pending || (active && !keys().includes(active))) {
			const preferred = seed(), available = keys()
			const target = preferred && (!views.has(preferred) || available.includes(preferred)) ? preferred : available[0]
			if (target && focus(target)) pending = false
		} else if (active && keys().includes(active)) { lastFocused = views.get(active) ?? null; publish(active) }
	}
	const refreshSafely = () => {
		if (refreshing) return
		refreshing = true
		try { refresh() } catch (error) { console.warn('[macos-times] focus refresh failed', error) } finally { refreshing = false }
	}
	const update = () => {
		if (queued) return
		queued = true; void Promise.resolve().then(() => { queued = false; if (root) refreshSafely() })
	}
	const bind = (view: NSView | null) => {
		if (root === view) return
		navigation.dispose(); stopObserver?.(); stopObserver = undefined
		root = view; owner = null; pending = true; highlighted = undefined; lastFocused = null
		if (!view) { views.clear(); return }
		const host = native(), center = host.NSNotificationCenter?.defaultCenter
		if (bridge()?.keyboardEventsSupported && center?.addObserverForNameObjectQueueUsingBlock && center?.removeObserver) {
			try {
				const token = center.addObserverForNameObjectQueueUsingBlock(host.NSWindowDidUpdateNotification ?? 'NSWindowDidUpdateNotification', null, null,
					(note: { object: NSWindow }) => { if (root && (note.object === root.window || note.object === owner)) refreshSafely() })
				stopObserver = () => center.removeObserver(token)
			} catch (error) { console.warn('[macos-times] focus observation unavailable', error) }
		}
		update()
	}
	const activate = (time: ISOTimeString) => {
		const view = views.get(time)
		if (!root?.window || view?.window !== root.window || options.blocked() || !keys().includes(time)) return
		options.choose(time)
	}
	return {
		bind, update, activate, dispose: () => bind(null),
		register(time: ISOTimeString, view: NSView): () => void {
			views.set(time, view); update()
			return () => {
				if (views.get(time) === view) views.delete(time)
				if (lastFocused === view) { lastFocused = null; pending = true }
				update()
			}
		},
		keyDown(event: NativeKeyboardEvent<NSView>) {
			const window = root?.window, target = event.target
			if (!window || !bridge()?.keyboardEventsSupported || options.blocked() || event.defaultPrevented || event.isComposing ||
				event.altKey || event.ctrlKey || event.metaKey || target?.window !== window || window.firstResponder !== target) return
			const rows = keys(), key = [...views].find(([, view]) => view === target)?.[0]
			if ((!key || !rows.includes(key)) && target !== root) return
			const stop = () => { event.preventDefault(); event.stopPropagation() }
			if (event.key === 'Tab') { if (options.tab(event.shiftKey)) stop(); return }
			if (event.key === 'Escape') return // Existing layer dismissal owns ordinary Escape.
			if (event.key === 'Enter' || event.key === ' ') { if (key && rows.includes(key)) { stop(); activate(key) } return }
			if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
			stop()
			const next = rows[timeOptionIndex(event.key, key ? rows.indexOf(key) : -1, rows.length)]
			if (next) focus(next)
		},
	}
}
