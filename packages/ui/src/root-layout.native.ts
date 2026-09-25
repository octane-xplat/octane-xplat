import { getRootLayout, RootLayout } from '@nativescript/core'

// NS keeps an internal rootLayoutStack (mounted order) — but the module is
// private and can duplicate when deep imports split bundles, so Screen
// self-registers here on loaded/unloaded instead. registry order = mount
// order; last = most recently mounted screen shell.
const registry: RootLayout[] = []

/** Called by the Screen leaf's <rootlayout> onLoaded/onUnloaded. */
export function registerRootLayout(rl: RootLayout | undefined | null) {
	if (rl && !registry.includes(rl)) registry.push(rl)
}

export function unregisterRootLayout(rl: RootLayout | undefined | null) {
	const i = rl ? registry.indexOf(rl) : -1
	if (i >= 0) registry.splice(i, 1)
}

/** The most recently mounted rootlayout — the top of the push stack. For
 *  imperative services (toast, sheet) there is no invoking component to
 *  walk from; last-mounted is the pushed page when one exists. Caveat: tabs
 *  keep visited panes mounted — last is the newest, not the visible tab. */
export function topRootLayout(): RootLayout | undefined {
	return registry[registry.length - 1] ?? getRootLayout()
}

/** Resolve the RootLayout enclosing `view` by walking the native parent
 *  chain — the screen shell is a RootLayout (Screen.native), so the first
 *  RootLayout ancestor IS the current page's overlay host. Falls back to
 *  the top registry entry when the component renders outside any Screen. */
export function rootLayoutFor(view: any): RootLayout | undefined {
	for (let v = view?.parent; v; v = v.parent) {
		if (v instanceof RootLayout) return v
	}

	return topRootLayout()
}

/** Search every registered rootlayout for a view by id — overlays/sheets/
 *  toasts land on different rootlayouts depending on which screen's shell
 *  mounted last. */
export function findInRootLayouts(id: string): any {
	const walk = (view: any): any => {
		if (!view) return null
		if (view.id === id) return view
		let hit: any = null
		view.eachChildView?.((c: any) => {
			const found = walk(c)
			if (found) {
				hit = found
				return false
			}

			return true
		})

		return hit
	}

	for (let i = registry.length - 1; i >= 0; i--) {
		const hit = walk(registry[i])
		if (hit) return hit
	}

	const rl = getRootLayout() as any
	return rl ? walk(rl) : null
}
