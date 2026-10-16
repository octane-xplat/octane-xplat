import { afterContentCommit, type ContentOwner } from './owned-content'
import { createRoot } from 'octane'
import type { BottomSheetHandle, ModalOpenResult, OpenBottomSheet } from './props'
import { applyThemeClasses } from './theme/theme-host'
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
export const openBottomSheet: OpenBottomSheet = (Component, params, options) =>
	openBottomSheetWithOwner(null, Component, params, options)

/** Internal presenter shared by standalone services and declaring-tree outlets. */
export function openBottomSheetWithOwner(
	owner: ContentOwner | null,
	...[Component, params, options = {}]: Parameters<OpenBottomSheet>
): BottomSheetHandle {
	if (owner?.disposed)
		return Object.assign(Promise.reject(new Error('The content outlet has been removed')), {
			close() {},
		}) as BottomSheetHandle
	let closeSheet: ((result?: ModalOpenResult) => void) | undefined
	const handle = new Promise<ModalOpenResult>((resolve) => {
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

		closeSheet = finish

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

		const root = owner?.createRoot(panel, () => closeSheet?.()) ?? createRoot(panel)
		active.add(entry)
		root.render(Component, { params, close: finish })
		afterContentCommit(root, () => {
			if (finished) return
			if (hasScrim) {
				panel.setAttribute('role', 'dialog')
				panel.setAttribute('aria-modal', 'true')
				releaseFocus = isolateModalFocus(layer, panel, () => finish())
			}
		})
	}) as BottomSheetHandle

	handle.close = (result?: ModalOpenResult) => closeSheet?.(result)
	return handle
}
