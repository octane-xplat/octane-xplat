import { createRoot } from 'octane'
import type { ModalOpenResult, OpenSheet } from './props'
import { applyThemeClasses } from './theme/theme-scheme'

interface ActiveSheet {
	layer: HTMLElement
	finish: (result?: ModalOpenResult) => void
}

const active = new Set<ActiveSheet>()

/** Close the most recently opened sheet (resolve with `result`). */
export function closeSheet(result?: ModalOpenResult): void {
	;[...active].pop()?.finish(result)
}

/** Imperative in-window sheet: portal layer at document root, bottom-
 *  anchored panel, dedicated Octane root. Resolves when the sheet closes. */
export const openSheet: OpenSheet = (Component, params, options = {}) =>
	new Promise<ModalOpenResult>((resolve) => {
		const layer = document.createElement('div')
		const unbindTheme = applyThemeClasses(layer, 'vx-sheet-layer')
		const panel = document.createElement('div')
		panel.className = 'vx-sheet'

		let finished = false
		const finish = (result?: ModalOpenResult) => {
			if (finished) {
				return
			}

			finished = true
			active.delete(entry)
			unbindTheme()
			root.unmount()
			layer.remove()
			resolve(result)
		}

		const entry: ActiveSheet = { layer, finish }
		if (options.shadeCover ?? true) {
			const backdrop = document.createElement('div')
			backdrop.className = 'vx-sheet-backdrop'
			backdrop.addEventListener('click', () => finish())
			layer.appendChild(backdrop)
		}

		layer.appendChild(panel)
		document.body.appendChild(layer)
		const root = createRoot(panel)
		root.render(Component, { params, close: finish })
		active.add(entry)
	})
