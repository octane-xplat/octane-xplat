import { ImperativeSheetPanel } from './bottom-sheet-panel.macos.tsrx'
import type { BottomSheetOpenOptions, ModalOpenResult, OpenBottomSheet } from './props'

interface ActiveSheet {
	controller?: { close(): void; closedPromise: Promise<unknown> }
	finish: (result?: ModalOpenResult) => void
}

const active = new Set<ActiveSheet>()

export function closeBottomSheet(result?: ModalOpenResult): void {
	;[...active].pop()?.finish(result)
}

/** Dedicated root in the key window's bottom-docked AppKit surface. */
export const openBottomSheet: OpenBottomSheet = (
	Component,
	params,
	options: BottomSheetOpenOptions = {},
) => {
	return new Promise<ModalOpenResult>((resolve, reject) => {
		let finished = false
		const entry: ActiveSheet = {
			finish(result) {
				if (finished) {
					return
				}

				finished = true
				active.delete(entry)
				try {
					entry.controller?.close()
				} finally {
					resolve(result)
				}
			},
		}

		active.add(entry)
		try {
			const present = (globalThis as any).__xplatAppKit?.presentSurface
			if (!present) {
				throw new Error('AppKit host has no shared sheet presenter')
			}

			entry.controller = present({
				kind: 'sheet',
				modal: options.hasScrim ?? true,
				snapPoints: options.snapPoints,
				label: options.label ?? 'Sheet',
				component: ImperativeSheetPanel,
				props: { component: Component, params, close: entry.finish },
				onDismiss: () => entry.finish('closed'),
			})

			// Content can close synchronously during its first render.
			if (finished) {
				entry.controller?.close()
			}

			void entry.controller?.closedPromise.then(() => entry.finish('closed'))
		} catch (error) {
			active.delete(entry)
			entry.controller?.close()
			reject(error)
		}
	})
}

export function bottomSheetHost(): null {
	return null
}
