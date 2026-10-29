import type { createAppKitChoiceFocus } from '../forms/choice-focus.macos'
import type { NSView, NSWindow } from '@octane-xplat/platform/macos'

interface OwnedRow { key: string; view: NSView; index: number; window: NSWindow }
function hidden(view: NSView): boolean {
	return ['hidden', 'hiddenOrHasHiddenAncestor'].some((name) => {
		const value = Reflect.get(view, name)
		return Boolean(typeof value === 'function' ? value.call(view) : value)
	})
}
/** Focus intent only. Each surface owns attachment, native observation and row leases. */
export function createAppKitMenuFocus(options: {
	root(): NSView | null
	views: Map<string, NSView>
	eligible(): readonly string[]
	initial(): 'container' | 'first' | 'last'
	supported(): boolean
	navigation: Pick<ReturnType<typeof createAppKitChoiceFocus>, 'focus' | 'synchronize' | 'dispose'>
	resetKeyboard(): void
}) {
	let owner: NSWindow | null = null, initial = true, refreshing = false, resetting = false, epoch = 0
	let order: { key: string; view: NSView }[] = [], last: OwnedRow | null = null, repair: OwnedRow | null = null
	const reset = () => {
		epoch++; owner = null; initial = true; order = []; last = null; repair = null
		const previous = resetting; resetting = true
		try { options.navigation.dispose(); options.resetKeyboard() } finally { resetting = previous }
	}

	const snapshot = (keys: readonly string[]) => { order = keys.flatMap((key) => { const view = options.views.get(key); return view ? [{ key, view }] : [] }) }
	const remember = (key: string, view: NSView, window: NSWindow, keys: readonly string[]) => {
		last = { key, view, window, index: Math.max(0, keys.indexOf(key)) }; repair = null
	}
	const fallback = (responder: unknown, root: NSView, window: NSWindow) => responder == null || responder === root || responder === window
	const focus = (key: string): boolean => {
		const root = options.root(), window = root?.window, view = options.views.get(key), keys = options.eligible()
		const version = epoch
		if (resetting || !root || !window || hidden(root) || !options.supported() || !view || view.window !== window || !keys.includes(key) || !options.navigation.focus(key)) return false
		if (version !== epoch || options.root() !== root || root.window !== window) return false
		remember(key, view, window, keys); snapshot(keys); return true
	}
	return {
		focus, reset,
		observes(window: NSWindow) { return window === owner || window === options.root()?.window },
		removed(key: string, view: NSView) {
			const root = options.root(), window = root?.window, responder = window?.firstResponder
			if (resetting || !root || !window || hidden(root) || !options.supported() || options.views.get(key) !== view) return
			if (responder === view || (last && last.view === view && last.window === window && fallback(responder, root, window))) {
				const index = order.findIndex((row) => row.view === view)
				repair = { key, view, window, index: index < 0 ? last?.index ?? 0 : index }
			}
			if (last?.view === view) last = null
		},
		refresh() {
			if (refreshing || resetting) return
			refreshing = true
			try {
				const root = options.root(), window = root?.window
				if (!root || !window || !options.supported()) { reset(); return }
				if (owner !== window) { reset(); owner = window }
				if (hidden(root)) {
					options.navigation.dispose(); options.resetKeyboard(); order = []; last = null; repair = null; return
				}
				const version = epoch
				const currentScope = () => version === epoch && options.root() === root && root.window === window
				options.navigation.synchronize()
				if (!currentScope()) return
				const keys = options.eligible(), responder = window.firstResponder
				const current = [...options.views].find(([, view]) => view === responder)
				if (initial) {
					const edge = options.initial(), key = keys[edge === 'last' ? keys.length - 1 : 0]
					if (edge === 'container' || !key) {
						if (window.makeFirstResponder(root) && currentScope()) { initial = false; last = null; repair = null }
					} else if (focus(key)) initial = false
				} else {
					if (!current && !fallback(responder, root, window) && responder !== repair?.view) last = null
					if (current && keys.includes(current[0])) remember(current[0], current[1], window, keys)
					else if (current && !repair) {
						const index = order.findIndex((row) => row.view === current[1])
						repair = { key: current[0], view: current[1], window, index: Math.max(0, index) }
					}
					if (repair) {
						if (repair.window !== window || (responder !== repair.view && !fallback(responder, root, window))) repair = null
						else {
							const key = keys[Math.min(repair.index, keys.length - 1)]
							if ((key ? focus(key) : window.makeFirstResponder(root)) && currentScope()) {
								if (!key) last = null
								repair = null; options.resetKeyboard()
							}
						}
					}
				}
				if (currentScope()) snapshot(keys)
			} finally { refreshing = false }
		},
	}
}
