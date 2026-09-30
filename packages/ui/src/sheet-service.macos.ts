import type { ModalOpenResult, OpenSheet, SheetOpenOptions } from './props'

interface SheetController {
	close(): void
	closed: Promise<void>
}

interface ActiveSheet {
	controller: SheetController
	finish: (result?: ModalOpenResult) => void
}

const active = new Set<ActiveSheet>()

const mount = () => (globalThis as any).__xplatAppKitMountSheet

/** Close the most recently opened sheet (resolve with `result`). */
export function closeSheet(result?: ModalOpenResult): void {
	;[...active].pop()?.finish(result)
}

/** Imperative sheet on the AppKit host — the component mounts on a dedicated
 *  Octane root inside a dialog-kind window presented as a sheet on the key
 *  window. Resolves when the sheet closes (either `close(result)` from the
 *  component or the window itself closing). `sheetHost` stays null — the
 *  sheet lives in a real NSWindow, not a rendered host element. */
export const openSheet: OpenSheet = (Component, params, options: SheetOpenOptions = {}) => {
	if (typeof mount() !== 'function') {
		console.warn('[octane-xplat] Imperative sheets are unsupported by the current AppKit host.')
		return Promise.reject(new Error('unsupported: AppKit host has no sheet presenter'))
	}

	return new Promise<ModalOpenResult>((resolve) => {
		let finished = false
		const finish = (result?: ModalOpenResult) => {
			if (finished) {return}
			finished = true
			active.delete(entry)
			try {
				entry.controller?.close()
			} catch (error) {
				console.error('[octane-xplat] sheet close failed', error)
			}

			resolve(result)
		}

		const entry: ActiveSheet = {
			controller: undefined as unknown as SheetController,
			finish,
		}

		entry.controller = mount()(Component, { params, close: finish }, options)
		active.add(entry)
		void entry.controller.closed.then(() => finish('closed'))
	})
}

export function sheetHost(): null {
	return null
}
