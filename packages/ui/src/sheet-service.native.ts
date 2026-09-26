import { GridLayout } from '@nativescript/core'
import { createNativeScriptRoot } from '@nativescript-community/octane'
import type { UniversalComponent } from 'octane/universal'
import type { ModalOpenResult, OpenSheet } from './props'
import { topRootLayout } from './root-layout.native'
import { applyThemeClasses } from './theme/theme-scheme'

interface ActiveSheet {
	host: GridLayout
	root: any
	finish: (result?: ModalOpenResult) => void
}

const active = new Set<ActiveSheet>()

/** The most recently opened sheet's host view — for harness asserts (view
 *  identity beats tree search; the owning rootlayout may unload/reload). */
export function sheetHost(): GridLayout | null {
	return [...active].pop()?.host ?? null
}

/** Close the most recently opened sheet (resolve with `result`). */
export function closeSheet(result?: ModalOpenResult): void {
	;[...active].pop()?.finish(result)
}

/** Imperative in-window sheet: a dedicated Octane root on a bottom-docked
 *  GridLayout host opened on the CURRENT rootlayout (topRootLayout — the
 *  service has no declaring view). Resolves when the sheet closes. */
export const openSheet: OpenSheet = (Component, params, options = {}) =>
	new Promise<ModalOpenResult>((resolve) => {
		const rl = topRootLayout()
		if (!rl) {
			console.warn('[openSheet] no RootLayout mounted — sheet skipped')
			resolve(undefined)
			return
		}

		const host = new GridLayout()
		const unbindTheme = applyThemeClasses(host, 'vx-sheet-host')
		host.horizontalAlignment = 'stretch'
		host.verticalAlignment = 'bottom'
		const root = createNativeScriptRoot(host)

		let finished = false
		// RootLayout notifies 'closed' from inside its own close(), before the
		// removal lands — hasChild still answers true there. Re-entering
		// close() from that notification schedules a second removeChild and
		// throws 'View not added to this instance' once the first removal
		// clears the parent. While a close is in flight the host is already
		// spliced out of _popupViews, so getPopupIndex < 0 marks the two cases
		// where we must not close() again: mid-close (RootLayout owns the
		// detach) and raced-close leftovers (plain removeChild instead).
		const finish = (result?: ModalOpenResult) => {
			if (finished) {
				return
			}

			finished = true
			active.delete(entry)
			unbindTheme()
			root.unmount?.()
			const owner = host.parent as any
			if (owner?.hasChild?.(host) && !closing) {
				if (owner.getPopupIndex?.(host) === -1) {
					owner.removeChild?.(host)
				} else {
					;(owner.close?.(host) as Promise<unknown> | undefined)?.catch((error: unknown) => {
						console.error('[openSheet] close failed', error)
					})
				}
			}

			resolve(result)
		}

		let closing = false

		const entry: ActiveSheet = { host, root, finish }
		// 'closed' covers tap-to-dismiss — finish through the same path, but
		// mark the close as already in flight so finish doesn't re-enter
		// RootLayout.close (see above).
		host.on('closed', () => {
			closing = true
			finish()
		})

		root.render(Component as UniversalComponent, { params, close: finish })
		active.add(entry)

		rl.open(host, {
			...((options.shadeCover ?? true) ? { shadeCover: { opacity: 0.4, tapToClose: true } } : {}),
			animation: {
				enterFrom: { translateY: 400, duration: 250 },
				exitTo: { translateY: 400, duration: 200 },
			},
		}).catch((error: unknown) => {
			console.error('[openSheet] open failed', error)
			finish()
		})
	})
