import { createRoot } from 'octane'
import type { ModalOpenResult, OpenBottomSheet } from './props'
import { applyThemeClasses } from './theme/theme-scheme'
import { normalizeSnapPoints } from './sheet-snap'
import { attachSheetDetents } from './sheet-detents.web'
import { isolateModalFocus } from './modal-focus.web'

const BASE_SCRIM = 0.4

interface ActiveSheet {
	layer: HTMLElement
	finish: (result?: ModalOpenResult) => void
}

const active = new Set<ActiveSheet>()

/** Close the most recently opened bottom sheet (resolve with `result`). */
export function closeBottomSheet(result?: ModalOpenResult): void {
	;[...active].pop()?.finish(result)
}

/** Imperative in-window bottom sheet: portal layer at document root,
 *  bottom-anchored panel, dedicated Octane root, grabber + snap/swipe
 *  gestures. Resolves when the sheet closes. */
export const openBottomSheet: OpenBottomSheet = (Component, params, options = {}) =>
	new Promise<ModalOpenResult>((resolve) => {
		const layer = document.createElement('div')
		const unbindTheme = applyThemeClasses(layer, 'vx-sheet-layer vx-bottom-sheet-layer')
		const panel = document.createElement('div')
		panel.className = 'vx-sheet vx-bottom-sheet'
		panel.setAttribute('aria-label', options.label ?? 'Sheet')
		const hasScrim = options.hasScrim ?? true
		const snapPoints = options.snapPoints?.length
			? normalizeSnapPoints(options.snapPoints, window.innerHeight)
			: []

		let finished = false
		let releaseFocus: (() => void) | undefined
		const finish = (result?: ModalOpenResult) => {
			if (finished) {
				return
			}

			finished = true
			active.delete(entry)
			releaseFocus?.()
			unbindTheme()
			detents.detach()
			root.unmount()
			layer.remove()
			resolve(result)
		}

		const entry: ActiveSheet = { layer, finish }
		let backdrop: HTMLDivElement | null = null
		if (hasScrim) {
			backdrop = document.createElement('div')
			backdrop.className = 'vx-sheet-backdrop'
			backdrop.style.opacity = String(BASE_SCRIM)
			backdrop.addEventListener('click', () => finish())
			layer.appendChild(backdrop)
		}

		layer.appendChild(panel)
		document.body.appendChild(layer)
		// Attached after the layer is in the document — the panel sizes
		// against the viewport and slides in to the smallest stop.
		const detents = attachSheetDetents(panel, snapPoints, () => finish(), {
			swipeOnly: !snapPoints.length,
			onOffset: (offset, vh) => {
				if (backdrop) {
					backdrop.style.opacity = String(Math.max(0, BASE_SCRIM * (1 - offset / vh)))
				}
			},
		})

		const root = createRoot(panel)
		root.render(Component, { params, close: finish })
		active.add(entry)
		if (hasScrim) {
			panel.setAttribute('role', 'dialog')
			panel.setAttribute('aria-modal', 'true')
			releaseFocus = isolateModalFocus(layer, panel, () => finish())
		}
	})
