import { GridLayout } from '@nativescript/core'
import { createNativeScriptRoot } from '@nativescript-community/octane'
import type { UniversalComponent } from 'octane/universal'
import type { ModalOpenResult, OpenBottomSheet } from './props'
import { topRootLayout } from './root-layout'
import { applyThemeClasses } from './theme/theme-scheme'
import { normalizeSnapPoints } from './sheet-snap'
import { attachSheetDetents } from './sheet-detents'
import { bindBottomInsetToKeyboard } from './keyboard-inset'
import { attachTapToBlur } from './tap-to-blur'
import { Screen } from '@nativescript/core'

interface ActiveSheet {
	host: GridLayout
	root: any
	unbindKeyboard?: () => void
	finish: (result?: ModalOpenResult) => void
}

const active = new Set<ActiveSheet>()

/** The most recently opened sheet's host view — for harness asserts (view
 *  identity beats tree search; the owning rootlayout may unload/reload). */
export function bottomSheetHost(): GridLayout | null {
	return [...active].pop()?.host ?? null
}

/** Close the most recently opened bottom sheet (resolve with `result`). */
export function closeBottomSheet(result?: ModalOpenResult): void {
	;[...active].pop()?.finish(result)
}

/** Imperative in-window bottom sheet: a dedicated Octane root on a
 *  bottom-docked GridLayout host opened on the CURRENT rootlayout
 *  (topRootLayout — the service has no declaring view). Resolves when the
 *  sheet closes. Astryx `snapPoints` fractions/percent/px all resolve
 *  against the screen height. */
export const openBottomSheet: OpenBottomSheet = (Component, params, options = {}) =>
	new Promise<ModalOpenResult>((resolve) => {
		const rl = topRootLayout()
		if (!rl) {
			console.warn('[openBottomSheet] no RootLayout mounted — sheet skipped')
			resolve(undefined)
			return
		}

		const host = new GridLayout()
		const unbindTheme = applyThemeClasses(host, 'vx-sheet-host vx-bottom-sheet-host')
		host.horizontalAlignment = 'stretch'
		host.verticalAlignment = 'bottom'
		host.accessibilityLabel = options.label ?? ''
		const root = createNativeScriptRoot(host)
		// Detents own enter/slide-out — the RootLayout animation always
		// lands translateY at 0, so it's skipped while gestures attach.
		const detentFractions = options.snapPoints?.length
			? normalizeSnapPoints(options.snapPoints, Screen.mainScreen.heightDIPs)
			: []

		const detents = attachSheetDetents(host, detentFractions, () => finish(), {
			swipeOnly: !detentFractions.length,
		})

		if (detentFractions.length) {
			host.height = detentFractions[detentFractions.length - 1] * Screen.mainScreen.heightDIPs
		}

		// Lift the host above the software keyboard — bottom-anchored sheets
		// hosting inputs (e.g. the demo 'In sheet' todo add row) are covered
		// otherwise.
		const unbindKeyboard = bindBottomInsetToKeyboard(host)
		attachTapToBlur(host)

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
			unbindKeyboard()
			unbindTheme()
			detents.detach()
			root.unmount?.()
			const owner = host.parent as any
			if (owner?.hasChild?.(host) && !closing) {
				if (owner.getPopupIndex?.(host) === -1) {
					owner.removeChild?.(host)
				} else {
					;(owner.close?.(host) as Promise<unknown> | undefined)?.catch((error: unknown) => {
						console.error('[openBottomSheet] close failed', error)
					})
				}
			}

			resolve(result)
		}

		let closing = false

		const entry: ActiveSheet = { host, root, unbindKeyboard, finish }
		// 'closed' covers tap-to-dismiss — finish through the same path, but
		// mark the close as already in flight so finish doesn't re-enter
		// RootLayout.close (see above).
		host.on('closed', () => {
			closing = true
			finish()
		})

		root.render(Component as UniversalComponent, { params, close: finish })
		active.add(entry)

		const openOptions =
			(options.hasScrim ?? true) ? { shadeCover: { opacity: 0.4, tapToClose: true } } : undefined

		rl.open(host, openOptions)
			.then(() => detents.enter())
			.catch((error: unknown) => {
				console.error('[openBottomSheet] open failed', error)
				finish()
			})
	})
